import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AlertTriangle, BookOpen, Calendar as CalendarIcon, Info } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

interface EventType {
  id: string;
  title: string;
  date: Date;
  type: "test" | "exam" | "assignment" | "general";
  moduleId: string;
  moduleName: string;
  description?: string;
}

const CalendarPage = () => {
  const { userData } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateEvents, setSelectedDateEvents] = useState<EventType[]>([]);

  useEffect(() => {
    const fetchEventsAndAlerts = async () => {
      setLoading(true);
      try {
        if (!userData?.uid) return;
        // Get subscribed modules
        const userSubsDoc = await getDoc(doc(db, "userSubscriptions", userData.uid));
        let subscribedModuleIds: string[] = [];
        if (userSubsDoc.exists()) {
          const data = userSubsDoc.data();
          subscribedModuleIds = Object.keys(data.modules || {}).filter(mid => data.modules[mid]);
        }
        // Fetch events
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const fetchedEvents: EventType[] = [];
        eventsSnapshot.forEach(doc => {
          const d = doc.data();
          if (subscribedModuleIds.includes(d.moduleId)) {
            fetchedEvents.push({
              id: doc.id,
              title: d.title,
              date: d.date?.toDate ? d.date.toDate() : new Date(d.date),
              type: d.type,
              moduleId: d.moduleId,
              moduleName: d.moduleName,
              description: d.description
            });
          }
        });
        // Fetch alerts
        const alertsSnapshot = await getDocs(collection(db, "alerts"));
        alertsSnapshot.forEach(doc => {
          const d = doc.data();
          if (subscribedModuleIds.includes(d.moduleId)) {
            fetchedEvents.push({
              id: doc.id,
              title: d.title,
              date: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt),
              type: d.type || "general",
              moduleId: d.moduleId,
              moduleName: d.moduleName,
              description: d.description
            });
          }
        });
        setEvents(fetchedEvents);
      } catch (error) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEventsAndAlerts();
  }, [userData]);

  useEffect(() => {
    if (date) {
      // Find events for the selected date
      const eventsForDate = events.filter(event => 
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
      );
      
      setSelectedDateEvents(eventsForDate);
    }
  }, [date, events]);

  // Create a map of dates that have events
  const eventDates = events.reduce((acc, event) => {
    const dateKey = format(event.date, "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, EventType[]>);

  // Function to get event type indicator for calendar
  const getDayClassNames = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    if (eventDates[dateKey]) {
      const types = new Set(eventDates[dateKey].map(e => e.type));
      
      if (types.has("exam")) {
        return "bg-red-200 text-red-900 rounded-full";
      } else if (types.has("assignment")) {
        return "bg-yellow-200 text-yellow-900 rounded-full";
      } else if (types.has("test")) {
        return "bg-blue-200 text-blue-900 rounded-full";
      }
    }
    return "";
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "test":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "exam":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "assignment":
        return <BookOpen className="h-4 w-4 text-yellow-500" />;
      default:
        return <CalendarIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Academic Calendar</h1>
        <p className="text-muted-foreground">
          View all your academic events in one place
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" /> Calendar
              </CardTitle>
              <CardDescription>
                Tests, exams and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border w-full"
                  modifiers={{
                    event: (date) => {
                      const dateKey = format(date, "yyyy-MM-dd");
                      return !!eventDates[dateKey];
                    }
                  }}
                  modifiersClassNames={{
                    event: "font-bold"
                  }}
                  components={{
                    DayContent: ({ date, ...props }) => (
                      <div className={`flex items-center justify-center h-9 w-9 ${getDayClassNames(date)}`}>
                        {date.getDate()}
                      </div>
                    )
                  }}
                />
              )}
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-200 mr-1"></div>
                  <span>Exam</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-yellow-200 mr-1"></div>
                  <span>Assignment</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-200 mr-1"></div>
                  <span>Test</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {date ? format(date, "MMMM d, yyyy") : "Select a date"}
              </CardTitle>
              <CardDescription>
                Events for the selected day
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : selectedDateEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        {getEventIcon(event.type)}
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.moduleName}</p>
                          {event.description && (
                            <p className="text-sm mt-1">{event.description}</p>
                          )}
                          <div className="mt-2">
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
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  No events scheduled for this date
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
