
import React, { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import AlertComments from "@/components/AlertComments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { Bell, Info, AlertTriangle, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AlertItem {
  id: string;
  title: string;
  description: string;
  type: "general" | "test" | "exam" | "assignment";
  moduleId: string;
  moduleName: string;
  createdAt: Date;
}

const AlertsPage = () => {
  const { userData } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // For demo purposes, we'll create some placeholder alerts
        // In a real app, this would fetch from Firestore based on the user's subscriptions
        const demoAlerts: AlertItem[] = [
          {
            id: "1",
            title: "Venue Change for Tomorrow's Lecture",
            description: "The lecture has been moved to Room A305",
            type: "general",
            moduleId: "csy301",
            moduleName: "Software Development",
            createdAt: new Date(2025, 3, 10) // April 10, 2025
          },
          {
            id: "2",
            title: "Assignment Deadline Extended",
            description: "The deadline for the project submission has been extended to next Friday",
            type: "assignment",
            moduleId: "isy201",
            moduleName: "Information Systems",
            createdAt: new Date(2025, 3, 9) // April 9, 2025
          },
          {
            id: "3",
            title: "Test Date Announced",
            description: "The mid-term test will be held on May 5th",
            type: "test",
            moduleId: "csy202",
            moduleName: "Databases",
            createdAt: new Date(2025, 3, 8) // April 8, 2025
          },
          {
            id: "4",
            title: "Exam Schedule Update",
            description: "The final exam will now be held in the main hall",
            type: "exam",
            moduleId: "ce101",
            moduleName: "Introduction to Civil Engineering",
            createdAt: new Date(2025, 3, 7) // April 7, 2025
          },
          {
            id: "5",
            title: "Additional Study Resources",
            description: "New study materials have been uploaded to the learning platform",
            type: "general",
            moduleId: "ee201",
            moduleName: "Circuit Theory",
            createdAt: new Date(2025, 3, 6) // April 6, 2025
          }
        ];
        
        setAlerts(demoAlerts);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlerts();
  }, [userData]);

  const filteredAlerts = filterType === "all" 
    ? alerts 
    : alerts.filter(alert => alert.type === filterType);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "test":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "exam":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "assignment":
        return <BookOpen className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Alerts & Announcements</h1>
        <p className="text-muted-foreground">
          Stay updated with announcements from your modules
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Alerts
          </CardTitle>
          <CardDescription>
            Filter alerts by type
          </CardDescription>
          <Tabs defaultValue="all" value={filterType} onValueChange={setFilterType}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="test">Tests</TabsTrigger>
              <TabsTrigger value="exam">Exams</TabsTrigger>
              <TabsTrigger value="assignment">Assignments</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map(alert => (
                <div key={alert.id} className="space-y-2">
                  <Alert className="relative">
                    <div className="absolute right-4 top-4 text-xs text-muted-foreground">
                      {format(alert.createdAt, "MMM d, yyyy")}
                    </div>
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <div>
                        <AlertTitle>
                          {alert.title} • {alert.moduleName}
                        </AlertTitle>
                        <AlertDescription className="mt-1">
                          {alert.description}
                        </AlertDescription>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            alert.type === "exam" 
                              ? "bg-red-100 text-red-800" 
                              : alert.type === "assignment" 
                                ? "bg-yellow-100 text-yellow-800" 
                                : alert.type === "test"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}>
                            {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Alert>
                  <AlertComments alertId={alert.id} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              No alerts matching the selected filter
            </p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AlertsPage;
