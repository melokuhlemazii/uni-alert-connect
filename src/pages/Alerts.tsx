
import React, { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import AlertComments from "@/components/AlertComments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { Bell, Info, AlertTriangle, BookOpen, Image } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AlertItem } from "@/utils/alertsData";

const AlertsPage = () => {
  const { userData } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(10);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Simulate loading progress
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 20;
          });
        }, 300);

        // Fetch real alerts from Firestore
        const alertsRef = collection(db, "alerts");
        const q = query(alertsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const fetchedAlerts: AlertItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedAlerts.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            type: data.type,
            moduleId: data.moduleId,
            moduleName: data.moduleName,
            createdAt: data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate() 
              : new Date(),
            imageUrl: data.imageUrl || getDefaultImageForType(data.type)
          });
        });
        
        setAlerts(fetchedAlerts);
        
        // If no alerts were found, use demo data as fallback
        if (fetchedAlerts.length === 0) {
          import("@/utils/alertsData").then(({ demoAlerts }) => {
            setAlerts(demoAlerts);
            console.log("Using demo alerts as fallback");
          });
        }
        
        // Simulate network delay
        setTimeout(() => {
          clearInterval(interval);
          setProgress(100);
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error("Error fetching alerts:", error);
        
        // Fallback to demo data on error
        import("@/utils/alertsData").then(({ demoAlerts }) => {
          setAlerts(demoAlerts);
          console.log("Error fetching alerts, using demo data");
          setLoading(false);
        });
      }
    };
    
    fetchAlerts();
  }, [userData]);

  // Helper function to get default image based on alert type
  const getDefaultImageForType = (type: string) => {
    switch (type) {
      case "test":
        return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80";
      case "exam":
        return "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=500&q=80";
      case "assignment":
        return "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=80";
      default:
        return "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=500&q=80";
    }
  };

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
        {loading && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Loading alerts...</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}
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
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-24 w-24 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
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
                    <div className="flex items-start gap-4">
                      {alert.imageUrl ? (
                        <div className="h-24 w-24 rounded-md overflow-hidden flex-shrink-0">
                          <img 
                            src={alert.imageUrl} 
                            alt={alert.title} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-24 w-24 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Image className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
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
