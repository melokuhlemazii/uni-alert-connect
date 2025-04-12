import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Bell, Info, Image } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AlertItem, EventItem, upcomingEventsData } from "@/utils/alertsData";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AlertComments from "@/components/AlertComments";

const Dashboard = () => {
  const { userData } = useAuth();
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate loading progress
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 200);

        // Fetch real alerts from Firestore
        const alertsRef = collection(db, "alerts");
        const alertsQuery = query(alertsRef, orderBy("createdAt", "desc"), limit(3));
        const alertsSnapshot = await getDocs(alertsQuery);
        
        const fetchedAlerts: AlertItem[] = [];
        alertsSnapshot.forEach((doc) => {
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
        
        if (fetchedAlerts.length > 0) {
          setRecentAlerts(fetchedAlerts);
        } else {
          // Fallback to demo data if no alerts found
          import("@/utils/alertsData").then(({ demoAlerts }) => {
            setRecentAlerts(demoAlerts.slice(0, 3));
          });
        }

        // Fetch real events from Firestore
        const eventsRef = collection(db, "events");
        const eventsQuery = query(eventsRef, orderBy("date"), limit(3));
        const eventsSnapshot = await getDocs(eventsQuery);
        
        const fetchedEvents: EventItem[] = [];
        eventsSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedEvents.push({
            id: doc.id,
            title: data.title,
            date: data.date instanceof Timestamp 
              ? data.date.toDate() 
              : new Date(data.date),
            type: data.type,
            moduleId: data.moduleId,
            moduleName: data.moduleName,
            imageUrl: data.imageUrl || getDefaultImageForEvent(data.type)
          });
        });
        
        if (fetchedEvents.length > 0) {
          setUpcomingEvents(fetchedEvents);
        } else {
          // Keep using demo data for events
          setUpcomingEvents(upcomingEventsData);
        }
        
        // Simulate network delay
        setTimeout(() => {
          clearInterval(interval);
          setProgress(100);
          setLoading(false);
        }, 1200);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Use demo data as fallback
        import("@/utils/alertsData").then(({ demoAlerts }) => {
          setRecentAlerts(demoAlerts.slice(0, 3));
          setUpcomingEvents(upcomingEventsData);
          setLoading(false);
        });
      }
    };
    
    fetchData();
  }, []);

  // Helper functions to get default images
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
  
  const getDefaultImageForEvent = (type: string) => {
    switch (type) {
      case "test":
        return "https://images.unsplash.com/photo-1473091534298-04dcbce3278c?auto=format&fit=crop&w=500&q=80";
      case "exam":
        return "https://images.unsplash.com/photo-1486718448742-163732cd1544?auto=format&fit=crop&w=500&q=80";
      case "assignment":
        return "https://images.unsplash.com/photo-1460574283810-2aab119d8511?auto=format&fit=crop&w=500&q=80";
      default:
        return "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=500&q=80";
    }
  };

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
        {loading && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Loading your dashboard...</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}
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
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {recentAlerts.map(alert => (
                  <div key={alert.id}>
                    <Alert key={alert.id} className="relative">
                      <div className="absolute right-4 top-4 text-xs text-muted-foreground">
                        {format(alert.createdAt, "MMM d, yyyy")}
                      </div>
                      <div className="flex items-start gap-3">
                        {alert.imageUrl ? (
                          <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                            <img 
                              src={alert.imageUrl} 
                              alt={alert.title}
                              className="h-full w-full object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div>
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
                        </div>
                      </div>
                    </Alert>
                    <AlertComments alertId={alert.id} />
                  </div>
                ))}
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/alerts">View All Alerts</Link>
                </Button>
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
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex gap-3 items-start border-b pb-3 last:border-0">
                    {event.imageUrl ? (
                      <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                        <img 
                          src={event.imageUrl} 
                          alt={event.title}
                          className="h-full w-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
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
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/calendar">View Calendar</Link>
                </Button>
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
