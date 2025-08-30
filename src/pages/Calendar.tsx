import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useRealTimeAlerts } from "@/hooks/useRealTimeAlerts";
import { useRealTimeEvents } from "@/hooks/useRealTimeEvents";
import { AnimatedCard, FadeInUp } from "@/components/AnimatedCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AlertTriangle, BookOpen, Calendar as CalendarIcon, Info } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: string;
  moduleId: string;
  moduleName: string;
  isAlert?: boolean;
}

const CalendarPage = () => {
  const { alerts, loading: alertsLoading } = useRealTimeAlerts();
  const { events, loading: eventsLoading } = useRealTimeEvents();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [allCalendarEvents, setAllCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>([]);
  const loading = alertsLoading || eventsLoading;

  useEffect(() => {
    // Combine alerts and events into calendar events
    const combinedEvents: CalendarEvent[] = [
      ...events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        type: event.type,
        moduleId: event.moduleId,
        moduleName: event.moduleName,
        isAlert: false
      })),
      ...alerts.filter(alert => alert.scheduledAt).map(alert => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        date: alert.scheduledAt!,
        type: alert.type,
        moduleId: alert.moduleId,
        moduleName: alert.moduleName,
        isAlert: true
      }))
    ];
    
    setAllCalendarEvents(combinedEvents);
  }, [alerts, events]);

  useEffect(() => {
    if (date) {
      // Find events for the selected date
      const eventsForDate = allCalendarEvents.filter(event => 
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
      );
      
      setSelectedDateEvents(eventsForDate);
    }
  }, [date, allCalendarEvents]);

  // Create a map of dates that have events
  const eventDates = allCalendarEvents.reduce((acc, event) => {
    const dateKey = format(event.date, "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Function to get event type indicator for calendar
  const getDayClassNames = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    if (eventDates[dateKey]) {
      const types = new Set(eventDates[dateKey].map(e => e.type));
      if (types.has("exam")) {
        return "bg-red-200 text-red-900 rounded-full animate-pulse";
      } else if (types.has("assignment")) {
        return "bg-yellow-200 text-yellow-900 rounded-full animate-pulse";
      } else if (types.has("test")) {
        return "bg-blue-200 text-blue-900 rounded-full animate-pulse";
      } else {
        return "bg-green-200 text-green-900 rounded-full animate-pulse";
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
      <FadeInUp>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Academic Calendar</h1>
          <p className="text-muted-foreground">
            View all your academic events in one place
          </p>
        </div>
      </FadeInUp>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <AnimatedCard delay={0.1}>
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
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Skeleton className="h-[350px] w-full" />
                </motion.div>
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
                      <motion.div 
                        className={`flex items-center justify-center h-9 w-9 ${getDayClassNames(date)}`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {date.getDate()}
                      </motion.div>
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
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-200 mr-1"></div>
                  <span>General</span>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        </div>

        <div className="md:col-span-3">
          <AnimatedCard delay={0.2} className="h-full">
            <CardHeader>
              <motion.div layout>
                <CardTitle>
                {date ? format(date, "MMMM d, yyyy") : "Select a date"}
                </CardTitle>
              </motion.div>
              <CardDescription>
                Events for the selected day
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <motion.div 
                  className="space-y-4"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  {[1, 2].map(i => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </motion.div>
              ) : selectedDateEvents.length > 0 ? (
                <AnimatePresence>
                  {selectedDateEvents.map(event => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-2">
                        {getEventIcon(event.type)}
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.moduleName}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.isAlert ? "Alert" : "Event"}
                          </p>
                          {event.description && (
                            <p className="text-sm mt-1">{event.description}</p>
                          )}
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              event.type === "exam" 
                                ? "bg-red-100 text-red-800" 
                                : event.type === "assignment" 
                                  ? "bg-yellow-100 text-yellow-800" 
                                  : event.type === "test"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                            }`}>
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground py-6"
                >
                  No events scheduled for this date
                </motion.div>
              )}
            </CardContent>
          </AnimatedCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
