import React, { useState } from "react";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Key, Save, Phone } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";

const alertTypes = [
  { key: "examAlerts", label: "Exam Alerts", description: "Receive notifications about upcoming exams" },
  { key: "testAlerts", label: "Test Alerts", description: "Receive notifications about tests and quizzes" },
  { key: "assignmentAlerts", label: "Assignment Alerts", description: "Receive notifications about assignment deadlines" },
  { key: "generalAlerts", label: "General Alerts", description: "Receive general announcements and updates" },
];

const notificationMethods = [
  { key: "emailNotifications", label: "Email Notifications", description: "Receive alerts via email" },
  { key: "pushNotifications", label: "Push Notifications", description: "Receive push notifications in your browser" },
];

const Profile = () => {
  const { userData, user } = useAuth();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(userData?.displayName || "");
  const [cellphone, setCellphone] = useState(userData?.cellphone || "");
  const [isLoading, setIsLoading] = useState(false);
  const [timetable, setTimetable] = useState<File | null>(null);
  const [timetableUrl, setTimetableUrl] = useState<string | null>(userData?.timetableUrl || null);
  const [removingTimetable, setRemovingTimetable] = useState(false);
  const [alertPrefs, setAlertPrefs] = useState({
    examAlerts: true,
    testAlerts: true,
    assignmentAlerts: true,
    generalAlerts: true,
    emailNotifications: true,
    pushNotifications: true,
  });

  // Real-time sync of alertPrefs and cellphone from Firestore
  React.useEffect(() => {
    if (!userData?.uid) return;
    const userDocRef = doc(db, "users", userData.uid);
    const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.alertPrefs) setAlertPrefs(data.alertPrefs);
        if (data.cellphone) setCellphone(data.cellphone);
      }
    });
    return () => unsubscribe();
  }, [userData]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName
      });
      
      // Update Firestore user document
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        cellphone,
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimetableUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTimetable(file);
      // TODO: Upload to Firebase Storage and get URL
      // setTimetableUrl(url);
    }
  };

  const handleRemoveTimetable = async () => {
    setRemovingTimetable(true);
    // TODO: Remove from Firebase Storage and update Firestore
    setTimetable(null);
    setTimetableUrl(null);
    setRemovingTimetable(false);
  };

  // Save alertPrefs to Firestore on toggle
  const handleAlertToggle = async (type: string) => {
    const newPrefs = {
      ...alertPrefs,
      [type]: !alertPrefs[type],
    };
    setAlertPrefs(newPrefs);
    if (user) {
      await updateDoc(doc(db, "users", user.uid), {
        alertPrefs: newPrefs,
      });
      
      toast({
        title: "Preferences updated",
        description: `${type === 'emailNotifications' || type === 'pushNotifications' ? 'Notification method' : 'Alert type'} preferences have been saved`,
      });
    }
  };

  // Save cellphone to Firestore in real-time
  const handleCellphoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCellphone(value);
    if (user) {
      await updateDoc(doc(db, "users", user.uid), {
        cellphone: value,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and notification preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="displayName" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <Button 
                    onClick={handleUpdateProfile}
                    disabled={isLoading || displayName === userData?.displayName}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? "Saving..." : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  value={userData?.email || ""} 
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  Your email address cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input 
                  id="role" 
                  value={userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : ""} 
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  Your role determines your access level in the system
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cellphone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Cellphone Number
                </Label>
                <Input
                  id="cellphone"
                  value={cellphone}
                  onChange={handleCellphoneChange}
                  placeholder="e.g. +27812345678"
                />
                <p className="text-sm text-muted-foreground">
                  <strong>Important:</strong> SMS notifications will always be sent to this number when provided, regardless of your other notification preferences
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Alert Preferences
            </CardTitle>
            <CardDescription>Choose which types of alerts you want to receive and how you want to receive them</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="font-semibold mb-4">Alert Types</div>
              <div className="space-y-4">
                {alertTypes.map((alert) => (
                  <div key={alert.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{alert.label}</div>
                      <div className="text-sm text-muted-foreground">{alert.description}</div>
                    </div>
                    <Switch
                      checked={alertPrefs[alert.key as keyof typeof alertPrefs]}
                      onCheckedChange={() => handleAlertToggle(alert.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="font-semibold mb-4">Notification Methods</div>
              <div className="space-y-4">
                {notificationMethods.map((method) => (
                  <div key={method.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{method.label}</div>
                      <div className="text-sm text-muted-foreground">{method.description}</div>
                    </div>
                    <Switch
                      checked={alertPrefs[method.key as keyof typeof alertPrefs]}
                      onCheckedChange={() => handleAlertToggle(method.key)}
                    />
                  </div>
                ))}
                
                {/* SMS notification info */}
                <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <div className="font-medium text-blue-900 dark:text-blue-100">SMS Notifications</div>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    SMS notifications are automatically enabled when you provide a cellphone number above. 
                    You will receive SMS alerts regardless of your other notification preferences.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semester Timetable Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Semester Timetable</CardTitle>
            <CardDescription>Upload your semester timetable (PDF or image)</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleTimetableUpload}
              disabled={!!timetableUrl}
            />
            {timetableUrl ? (
              <div className="mt-2 flex items-center gap-4">
                <a href={timetableUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  View Timetable
                </a>
                <Button variant="destructive" size="sm" onClick={handleRemoveTimetable} disabled={removingTimetable}>
                  {removingTimetable ? "Removing..." : "Remove"}
                </Button>
              </div>
            ) : timetable ? (
              <div className="mt-2 text-sm text-green-600">
                Ready to upload: {timetable.name}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;