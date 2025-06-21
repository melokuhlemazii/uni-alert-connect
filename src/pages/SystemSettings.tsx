import React, { useState } from "react";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Settings, Save, Shield, Bell, Database } from "lucide-react";

const SystemSettings = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    allowStudentRegistration: true,
    requireEmailVerification: false,
    enablePushNotifications: true,
    maxAlertsPerDay: 10,
    systemMaintenanceMode: false,
    autoDeleteOldAlerts: true,
    alertRetentionDays: 30
  });
  
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (userData?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
  }, [userData, navigate]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Here you would typically save to Firestore
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings saved",
        description: "System settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save system settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and permissions
        </p>
      </div>

      <div className="grid gap-6">
        {/* User Management Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Control user registration and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Student Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow new students to register accounts
                </p>
              </div>
              <Switch
                checked={settings.allowStudentRegistration}
                onCheckedChange={(checked) => handleSettingChange('allowStudentRegistration', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Users must verify their email before accessing the system
                </p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(checked) => handleSettingChange('requireEmailVerification', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure alert and notification behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Allow the system to send push notifications
                </p>
              </div>
              <Switch
                checked={settings.enablePushNotifications}
                onCheckedChange={(checked) => handleSettingChange('enablePushNotifications', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxAlerts">Max Alerts Per Day</Label>
              <Input
                id="maxAlerts"
                type="number"
                value={settings.maxAlertsPerDay}
                onChange={(e) => handleSettingChange('maxAlertsPerDay', parseInt(e.target.value))}
                className="w-32"
              />
              <p className="text-sm text-muted-foreground">
                Maximum number of alerts a lecturer can create per day
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Maintenance
            </CardTitle>
            <CardDescription>
              System maintenance and data management settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable maintenance mode (only admins can access)
                </p>
              </div>
              <Switch
                checked={settings.systemMaintenanceMode}
                onCheckedChange={(checked) => handleSettingChange('systemMaintenanceMode', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-delete Old Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically remove old alerts after specified days
                </p>
              </div>
              <Switch
                checked={settings.autoDeleteOldAlerts}
                onCheckedChange={(checked) => handleSettingChange('autoDeleteOldAlerts', checked)}
              />
            </div>
            
            {settings.autoDeleteOldAlerts && (
              <div className="space-y-2">
                <Label htmlFor="retentionDays">Alert Retention (Days)</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  value={settings.alertRetentionDays}
                  onChange={(e) => handleSettingChange('alertRetentionDays', parseInt(e.target.value))}
                  className="w-32"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? "Saving..." : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SystemSettings;
