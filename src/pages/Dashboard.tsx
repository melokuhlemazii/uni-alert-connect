import React, { useEffect, useState } from "react";
import { useRealTimeAlerts } from "@/hooks/useRealTimeAlerts";
import { useRealTimeEvents } from "@/hooks/useRealTimeEvents";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { AnimatedCard, FadeInUp, ScaleIn } from "@/components/AnimatedCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Bell, Info, Image } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AlertComments from "@/components/AlertComments";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, CalendarPlus, Mail } from "lucide-react";
import { BookOpen } from "lucide-react";

const alertTypes = [
  { key: "exams", label: "Exam Alerts" },
  { key: "assignments", label: "Assignment Alerts" },
  { key: "events", label: "Event Alerts" },
];

const Dashboard = () => {
  const { userData } = useAuth();
  const { alerts: recentAlerts, loading: alertsLoading } = useRealTimeAlerts();
  const { events: upcomingEvents, loading: eventsLoading } = useRealTimeEvents();
  const [progress, setProgress] = useState(10);
  const [timetable, setTimetable] = useState<File | null>(null);
  const [timetableUrl, setTimetableUrl] = useState<string | null>(null);
  const [alertPrefs, setAlertPrefs] = useState({
    all: true,
    general: true,
    exams: true,
    assignments: true,
    events: true,
  });
  // Add state for subscribed modules
  const [subscribedModules, setSubscribedModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const loading = alertsLoading || eventsLoading || modulesLoading;
  // For event modal
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  // For mark as read (demo, local state)
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  // For module search
  const [moduleSearch, setModuleSearch] = useState("");
  const { toast } = useToast();
  // Modal state for alert/event details
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    if (!loading) {
      setProgress(100);
    }
  }, [loading]);

  useEffect(() => {
    // Fetch subscribed modules for student
    const fetchSubscribedModules = async () => {
      if (!userData?.uid) return;
      setModulesLoading(true);
      try {
        const userSubsDoc = await getDoc(doc(db, "userSubscriptions", userData.uid));
        let subscribedModuleIds = [];
        if (userSubsDoc.exists()) {
          const data = userSubsDoc.data();
          subscribedModuleIds = Object.keys(data.modules || {}).filter(mid => data.modules[mid]);
        }
        const modulesSnapshot = await getDocs(collection(db, "modules"));
        const allModules = [];
        modulesSnapshot.forEach(doc => {
          const d = doc.data();
          allModules.push({ id: doc.id, name: d.name, code: d.code, description: d.description });
        });
        const myModules = allModules.filter(m => subscribedModuleIds.includes(m.id));
        setSubscribedModules(myModules);
      } catch (e) {
        setSubscribedModules([]);
      } finally {
        setModulesLoading(false);
      }
    };
    if (userData?.role === "student") fetchSubscribedModules();
  }, [userData]);

  // Load preferences from Firestore
  useEffect(() => {
    const fetchPrefs = async () => {
      if (!userData?.uid) return;
      const userDoc = await getDoc(doc(db, "users", userData.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.alertPrefs) setAlertPrefs(prev => ({ ...prev, ...data.alertPrefs }));
      }
    };
    fetchPrefs();
  }, [userData]);

  // Save preferences to Firestore
  const handleAlertToggle = (type: string) => {
    const newPrefs = {
      ...alertPrefs,
      [type]: !alertPrefs[type],
      ...(type === "all" && !alertPrefs.all
        ? { general: true, exams: true, assignments: true, events: true }
        : {}),
      ...(type === "all" && alertPrefs.all
        ? { general: false, exams: false, assignments: false, events: false }
        : {}),
    };
    setAlertPrefs(newPrefs);
    if (userData?.uid) {
      // Save to Firestore
      getDoc(doc(db, "users", userData.uid)).then(userDoc => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDoc(doc(db, "users", userData.uid), { ...data, alertPrefs: newPrefs }, { merge: true });
        }
      });
    }
  };

  // Filter alerts/events based on preferences
  const filteredAlerts = alertPrefs.all
    ? recentAlerts
    : recentAlerts.filter(a =>
        (alertPrefs.general && a.type === "general") ||
        (alertPrefs.exams && a.type === "exam") ||
        (alertPrefs.assignments && a.type === "assignment") ||
        (alertPrefs.events && a.type === "test") // 'test' is the closest to 'event' in your types
      );
  const filteredEvents = alertPrefs.all
    ? upcomingEvents
    : upcomingEvents.filter(e =>
        (alertPrefs.exams && e.type === "exam") ||
        (alertPrefs.assignments && e.type === "assignment") ||
        (alertPrefs.events && e.type === "test")
      );

  // --- Dashboard Summary Cards ---
  const summaryCards = [
    {
      label: "Unread Alerts",
      value: filteredAlerts.length,
      icon: <Bell className="h-6 w-6 text-indigo-500" />,
      color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      aria: "Number of unread alerts"
    },
    {
      label: "Upcoming Events",
      value: filteredEvents.length,
      icon: <Calendar className="h-6 w-6 text-green-500" />,
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      aria: "Number of upcoming events"
    },
    {
      label: "My Modules",
      value: subscribedModules.length,
      icon: <BookOpen className="h-6 w-6 text-yellow-500" />,
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      aria: "Number of subscribed modules"
    }
  ];

  // Quick Actions for students
  const quickActions = [
    {
      label: "Subscribe to Module",
      icon: <UserPlus className="h-5 w-5" />,
      onClick: () => window.location.href = "/modules",
      aria: "Subscribe to a new module"
    },
    {
      label: "View Timetable",
      icon: <CalendarPlus className="h-5 w-5" />,
      onClick: () => window.location.href = "/my-timetable",
      aria: "View your timetable"
    },
    {
      label: "Contact Lecturer",
      icon: <Mail className="h-5 w-5" />,
      onClick: () => window.location.href = "/profile",
      aria: "Contact your lecturer"
    }
  ];

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

  const handleTimetableUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTimetable(e.target.files[0]);
      // TODO: Upload to server or Firebase Storage
    }
  };

  // --- Enhanced: Mark as read ---
  const handleMarkAsRead = (alertId: string) => {
    setReadAlertIds(ids => [...ids, alertId]);
    toast({ title: "Alert marked as read" });
  };

  return (
    <DashboardLayout>
      <>
        <TooltipProvider>
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Welcome, {userData?.displayName}</h1>
            <p className="text-muted-foreground">
              Here's what's happening with your modules
            </p>
            {/* --- Summary Cards --- */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
            >
              {summaryCards.map(card => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={`flex items-center gap-4 p-4 shadow-sm transition-all duration-200 hover:shadow-md ${card.color}`}
                  aria-label={card.aria}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.click(); }}
                  >
                  <div>{card.icon}</div>
                  <div>
                    <motion.div 
                      className="text-2xl font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      {card.value}
                    </motion.div>
                    <div className="text-sm font-medium">{card.label}</div>
                  </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
            {/* --- Quick Actions --- */}
            {userData?.role === "student" && (
              <motion.div 
                className="flex gap-4 mb-6" 
                aria-label="Quick Actions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, staggerChildren: 0.1 }}
              >
                {quickActions.map(action => (
                  <motion.div
                    key={action.label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                    variant="secondary"
                    className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                    onClick={action.onClick}
                    aria-label={action.aria}
                    >
                    {action.icon} {action.label}
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {/* My Modules section for students */}
            {userData?.role === "student" && (
              <div className="mt-8 mb-6">
                <AnimatedCard delay={0.3}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span role="img" aria-label="modules">📚</span> My Modules
                    </CardTitle>
                    <CardDescription>Modules you are subscribed to</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {modulesLoading ? (
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        Loading modules...
                      </motion.div>
                    ) : subscribedModules.length > 0 ? (
                      <motion.ul 
                        className="flex flex-wrap gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ staggerChildren: 0.1 }}
                      >
                        {subscribedModules.map(module => (
                          <Tooltip key={module.id}>
                            <TooltipTrigger asChild>
                              <motion.li 
                                className="bg-gray-100 rounded px-3 py-1 text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-gray-200 transition-colors"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-200 text-indigo-700 font-bold text-xs">
                                  {module.code?.slice(0,2) || "M"}
                                </span>
                                {module.code} - {module.name}
                              </motion.li>
                            </TooltipTrigger>
                            <TooltipContent>{module.description}</TooltipContent>
                          </Tooltip>
                        ))}
                      </motion.ul>
                    ) : (
                      <motion.div 
                        className="flex flex-col items-center gap-2 py-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Image className="h-10 w-10 text-gray-300" />
                        <p className="text-muted-foreground">You are not subscribed to any modules.</p>
                      </motion.div>
                    )}
                  </CardContent>
                </AnimatedCard>
              </div>
            )}
            {loading && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Loading your dashboard...</p>
                <Progress value={progress} className="h-2 animate-pulse" />
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Alerts */}
            <AnimatedCard delay={0.1}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" /> Recent Alerts
                </CardTitle>
                <CardDescription>Latest announcements and updates</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <motion.div 
                    className="space-y-3"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-16 w-16 rounded-md animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4 animate-pulse" />
                          <Skeleton className="h-4 w-full animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : filteredAlerts.slice(0, 3).length > 0 ? (
                  <AnimatePresence>
                    {filteredAlerts.slice(0, 3).map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Alert
                          className="relative cursor-pointer hover:shadow-md transition-all hover:bg-gray-50"
                          tabIndex={0}
                          aria-label={`View details for alert: ${alert.title}`}
                          onClick={() => { setModalData({ ...alert, isAlert: true }); setModalOpen(true); }}
                          onKeyDown={e => { if (e.key === 'Enter') { setModalData({ ...alert, isAlert: true }); setModalOpen(true); } }}
                        >
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
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to="/alerts">View All Alerts</Link>
                      </Button>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <motion.div 
                    className="flex flex-col items-center gap-2 py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Bell className="h-10 w-10 text-gray-300" />
                    <p className="text-center text-muted-foreground">No recent alerts</p>
                  </motion.div>
                )}
              </CardContent>
            </AnimatedCard>

            {/* Upcoming Events */}
            <AnimatedCard delay={0.2}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Upcoming Events
                </CardTitle>
                <CardDescription>Tests, exams and deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <motion.div 
                    className="space-y-3"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-16 w-16 rounded-md animate-pulse" />
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-6 w-3/4 animate-pulse" />
                          <Skeleton className="h-4 w-1/2 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : filteredEvents.slice(0, 3).length > 0 ? (
                  <AnimatePresence>
                    {filteredEvents.slice(0, 3).map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex gap-3 items-start border-b pb-3 last:border-0 cursor-pointer hover:shadow-md hover:bg-gray-50 p-2 rounded transition-all"
                        tabIndex={0}
                        aria-label={`View details for event: ${event.title}`}
                        onClick={() => { setModalData({ ...event, isAlert: false }); setModalOpen(true); }}
                        onKeyDown={e => { if (e.key === 'Enter') { setModalData({ ...event, isAlert: false }); setModalOpen(true); } }}
                      >
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
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to="/calendar">View Calendar</Link>
                      </Button>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <motion.div 
                    className="flex flex-col items-center gap-2 py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Calendar className="h-10 w-10 text-gray-300" />
                    <p className="text-center text-muted-foreground">No upcoming events</p>
                  </motion.div>
                )}
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Details Modal for Alert/Event */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="max-w-md" asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
              {modalData && (
                <>
                  <DialogHeader>
                    <DialogTitle>{modalData?.title || "Event Details"}</DialogTitle>
                    <DialogDescription>
                      {modalData.moduleName && <span className="font-medium">{modalData.moduleName}</span>}
                      <span className="ml-2 text-xs text-muted-foreground">{modalData.isAlert ? format(modalData.createdAt, "MMM d, yyyy") : format(modalData.date, "MMM d, yyyy")}</span>
                    </DialogDescription>
                  </DialogHeader>
                  {modalData.imageUrl && (
                    <motion.img 
                      src={modalData.imageUrl} 
                      alt={modalData.title} 
                      className="w-full h-40 object-cover rounded mb-3"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  )}
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 bg-indigo-100 text-indigo-800">
                      {modalData.type?.charAt(0).toUpperCase() + modalData.type?.slice(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">{modalData.isAlert ? "Alert" : "Event"}</span>
                  </div>
                  <div className="mb-4">
                    {modalData.description}
                  </div>
                  <motion.div 
                    className="flex gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {modalData.isAlert && (
                      <Button size="sm" variant="secondary" onClick={() => { setModalOpen(false); }}>
                        Mark as Read
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setModalOpen(false)}>
                      Close
                    </Button>
                  </motion.div>
                </>
              )}
              </motion.div>
            </DialogContent>
          </Dialog>
        </TooltipProvider>
      </>
    </DashboardLayout>
  );
};

export default Dashboard;
