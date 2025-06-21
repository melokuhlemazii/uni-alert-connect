import React, { useState } from "react";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Key, Save } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";

const alertTypes = [
  { key: "exams", label: "Exam Alerts" },
  { key: "assignments", label: "Assignment Alerts" },
  { key: "events", label: "Event Alerts" },
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
    exams: true,
    assignments: true,
    events: true,
  });

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

  const handleAlertToggle = (type: string) => {
    setAlertPrefs((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
    // TODO: Save preferences to backend or local storage
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information
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
                <Label htmlFor="cellphone">Cellphone Number</Label>
                <Input
                  id="cellphone"
                  value={cellphone}
                  onChange={e => setCellphone(e.target.value)}
                  placeholder="e.g. 0812345678"
                />
                <p className="text-sm text-muted-foreground">
                  Your cellphone number is used for SMS alerts
                </p>
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
        {/* Alert Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Preferences</CardTitle>
            <CardDescription>Choose which alerts you want to see or receive notifications for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertTypes.map((alert) => (
                <div key={alert.key} className="flex items-center justify-between">
                  <span>{alert.label}</span>
                  <Switch
                    checked={alertPrefs[alert.key as keyof typeof alertPrefs]}
                    onCheckedChange={() => handleAlertToggle(alert.key)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
