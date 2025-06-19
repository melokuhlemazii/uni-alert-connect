
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Save, Bell } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
  const { userData, user } = useAuth();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(userData?.displayName || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // Alert preferences for students
  const [alertPreferences, setAlertPreferences] = useState({
    examAlerts: true,
    testAlerts: true,
    assignmentAlerts: true,
    generalAlerts: true,
    emailNotifications: true,
    pushNotifications: true
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
      const updateData: any = {
        displayName: displayName
      };
      
      // Include alert preferences for students
      if (userData?.role === "student") {
        updateData.alertPreferences = alertPreferences;
      }
      
      await updateDoc(doc(db, "users", user.uid), updateData);
      
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

  const handlePreferenceChange = (key: string, value: boolean) => {
    setAlertPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Personal Information */}
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
            </div>
          </CardContent>
        </Card>

        {/* Alert Preferences - Only for students */}
        {userData?.role === "student" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Preferences
              </CardTitle>
              <CardDescription>
                Choose which types of alerts you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Alert Types</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Exam Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about upcoming exams
                      </p>
                    </div>
                    <Switch
                      checked={alertPreferences.examAlerts}
                      onCheckedChange={(checked) => handlePreferenceChange('examAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Test Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about tests and quizzes
                      </p>
                    </div>
                    <Switch
                      checked={alertPreferences.testAlerts}
                      onCheckedChange={(checked) => handlePreferenceChange('testAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Assignment Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about assignment deadlines
                      </p>
                    </div>
                    <Switch
                      checked={alertPreferences.assignmentAlerts}
                      onCheckedChange={(checked) => handlePreferenceChange('assignmentAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>General Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive general announcements and updates
                      </p>
                    </div>
                    <Switch
                      checked={alertPreferences.generalAlerts}
                      onCheckedChange={(checked) => handlePreferenceChange('generalAlerts', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Notification Methods</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts via email
                      </p>
                    </div>
                    <Switch
                      checked={alertPreferences.emailNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={alertPreferences.pushNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleUpdateProfile}
            disabled={isLoading || (displayName === userData?.displayName)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? "Saving..." : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
