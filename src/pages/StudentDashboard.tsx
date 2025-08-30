import React, { useEffect, useState } from "react";
import { useRealTimeAlerts } from "@/hooks/useRealTimeAlerts";
import { useRealTimeEvents } from "@/hooks/useRealTimeEvents";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { AnimatedCard, FadeInUp, SlideInLeft } from "@/components/AnimatedCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Bell, Calendar, BookOpen } from "lucide-react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Module {
  id: string;
  name: string;
  code: string;
  description?: string;
}

const StudentDashboard = () => {
  const { userData } = useAuth();
  const { alerts, loading: alertsLoading } = useRealTimeAlerts();
  const { events, loading: eventsLoading } = useRealTimeEvents();
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) return;
    const fetchData = async () => {
      setModulesLoading(true);
      // Fetch student module subscriptions
      const userSubsDoc = await getDoc(doc(db, "userSubscriptions", userData.uid));
      let subscribedModuleIds: string[] = [];
      if (userSubsDoc.exists()) {
        const data = userSubsDoc.data();
        subscribedModuleIds = Object.keys(data.modules || {}).filter(mid => data.modules[mid]);
      }
      // Fetch modules
      const modulesSnapshot = await getDocs(collection(db, "modules"));
      const allModules: Module[] = [];
      modulesSnapshot.forEach(doc => {
        const d = doc.data();
        allModules.push({ id: doc.id, name: d.name, code: d.code, description: d.description });
      });
      const myModules = allModules.filter(m => subscribedModuleIds.includes(m.id));
      setModules(myModules);
      setModulesLoading(false);
    };
    fetchData();
  }, [userData]);

  const loading = alertsLoading || eventsLoading || modulesLoading;
  return (
    <DashboardLayout>
      <FadeInUp>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Welcome, {userData?.displayName}</h1>
          <p className="text-muted-foreground">Here's your academic overview</p>
        </div>
      </FadeInUp>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Academic Alerts */}
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Academic Alerts
            </CardTitle>
            <CardDescription>Alerts for your modules</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                Loading alerts...
              </motion.div>
            ) : alerts.length > 0 ? (
              <AnimatePresence>
                {alerts.map(alert => (
                  <motion.li
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="border-b pb-2 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <div className="font-medium">{alert.title} <span className="text-xs text-muted-foreground">({alert.moduleName})</span></div>
                    <div className="text-sm text-muted-foreground">{alert.description}</div>
                    <div className="text-xs text-gray-400">{format(alert.createdAt, "MMM d, yyyy")}</div>
                  </motion.li>
                ))}
              </AnimatePresence>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground"
              >
                No alerts for your modules.
              </motion.p>
            )}
          </CardContent>
        </AnimatedCard>
        {/* Academic Events */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Upcoming Events
            </CardTitle>
            <CardDescription>Events for your modules</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                Loading events...
              </motion.div>
            ) : events.length > 0 ? (
              <AnimatePresence>
                {events.map(event => (
                  <motion.li
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="border-b pb-2 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <div className="font-medium">{event.title} <span className="text-xs text-muted-foreground">({event.moduleName})</span></div>
                    <div className="text-xs text-gray-400">{format(event.date, "MMM d, yyyy HH:mm")}</div>
                  </motion.li>
                ))}
              </AnimatePresence>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground"
              >
                No upcoming events for your modules.
              </motion.p>
            )}
          </CardContent>
        </AnimatedCard>
      </div>
      {/* Subscribed Modules */}
      <div className="mt-8">
        <SlideInLeft delay={0.3}>
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> My Modules
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
            ) : modules.length > 0 ? (
              <motion.div 
                className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {modules.map(module => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col items-start">
                      <div className="font-semibold text-base mb-1">{module.name}</div>
                      <div className="text-xs text-muted-foreground mb-2">{module.code}</div>
                      {module.description && (
                        <div className="text-xs text-gray-400 line-clamp-2">{module.description}</div>
                      )}
                    </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground"
              >
                You are not subscribed to any modules.
              </motion.p>
            )}
          </CardContent>
          </Card>
        </SlideInLeft>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
