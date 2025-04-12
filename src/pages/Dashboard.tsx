
import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Bell, Info } from "lucide-react";
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

interface EventItem {
  id: string;
  title: string;
  date: Date;
  type: "test" | "exam" | "assignment";
  moduleId: string;
  moduleName: string;
}

const Dashboard = () => {
  const { userData } = useAuth();
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent alerts
        const alertsRef = collection(db, "alerts");
        const alertsQuery = query(alertsRef, orderBy("createdAt", "desc"), limit(5));
        const alertsSnapshot = await getDocs(alertsQuery);
        
        const alerts: AlertItem[] = alertsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            type: data.type,
            moduleId: data.moduleId,
            moduleName: data.moduleName,
            createdAt: data.createdAt.toDate()
          };
        });
        
        setRecentAlerts(alerts);
        
        // For now use placeholder events, in a real app you'd fetch from Firestore
        setUpcomingEvents([
          {
            id: "1",
            title: "Midterm Exam",
            date: new Date(2025, 4, 15), // May 15, 2025
            type: "exam",
            moduleId: "CSY301",
            moduleName: "Computer Science 301"
          },
          {
            id: "2",
            title: "Assignment Due",
            date: new Date(2025, 4, 20), // May 20, 2025
            type: "assignment",
            moduleId: "ISY201",
            moduleName: "Information Systems 201"
          },
          {
            id: "3",
            title: "Weekly Test",
            date: new Date(2025, 4, 25), // May 25, 2025
            type: "test",
            moduleId: "MTH102",
            moduleName: "Mathematics 102"
          }
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "test":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "exam":
        return <Info className="h-4 w-4 text-red-500" />;
      case "assignment":
        return <Info className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Welcome, {userData?.displayName}</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your modules
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Recent Alerts
            </CardTitle>
            <CardDescription>Latest announcements and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {recentAlerts.map(alert => (
                  <Alert key={alert.id} className="relative">
                    <div className="absolute right-4 top-4 text-xs text-muted-foreground">
                      {format(alert.createdAt, "MMM d, yyyy")}
                    </div>
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <div>
                        <AlertTitle>
                          {alert.title} • {alert.moduleName}
                        </AlertTitle>
                        <AlertDescription>
                          {alert.description}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">
                No recent alerts
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Upcoming Events
            </CardTitle>
            <CardDescription>Tests, exams and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.moduleName}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{format(event.date, "MMM d, yyyy")}</div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        event.type === "exam" 
                          ? "bg-red-100 text-red-800" 
                          : event.type === "assignment" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-blue-100 text-blue-800"
                      }`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">
                No upcoming events
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
