import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Bell, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertItem {
  id: string;
  title: string;
  description: string;
  type: string;
  moduleId: string;
  moduleName: string;
  createdAt: Date;
  imageUrl?: string;
}

interface EventItem {
  id: string;
  title: string;
  date: Date;
  type: string;
  moduleId: string;
  moduleName: string;
  imageUrl?: string;
}

interface Module {
  id: string;
  name: string;
  code: string;
  description?: string;
}

const StudentDashboard = () => {
  const { userData } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) return;
    let unsubAlerts: (() => void) | null = null;
    let unsubEvents: (() => void) | null = null;
    const fetchData = async () => {
      setLoading(true);
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
      // Real-time alerts for subscribed modules
      unsubAlerts = onSnapshot(collection(db, "alerts"), (snapshot: QuerySnapshot<DocumentData>) => {
        const fetchedAlerts: AlertItem[] = [];
        snapshot.forEach(doc => {
          const d = doc.data();
          if (subscribedModuleIds.includes(d.moduleId) && d.type !== "event") {
            fetchedAlerts.push({
              id: doc.id,
              title: d.title,
              description: d.description,
              type: d.type,
              moduleId: d.moduleId,
              moduleName: d.moduleName,
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
              imageUrl: d.imageUrl,
            });
          }
        });
        setAlerts(fetchedAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      });
      // Real-time events for subscribed modules
      unsubEvents = onSnapshot(collection(db, "alerts"), (snapshot: QuerySnapshot<DocumentData>) => {
        const fetchedEvents: EventItem[] = [];
        snapshot.forEach(doc => {
          const d = doc.data();
          if (subscribedModuleIds.includes(d.moduleId) && d.type === "event") {
            fetchedEvents.push({
              id: doc.id,
              title: d.title,
              date: d.scheduledDate?.toDate ? d.scheduledDate.toDate() : new Date(),
              type: d.type,
              moduleId: d.moduleId,
              moduleName: d.moduleName,
              imageUrl: d.imageUrl,
            });
          }
        });
        setEvents(fetchedEvents.sort((a, b) => a.date.getTime() - b.date.getTime()));
        setLoading(false);
      });
    };
    fetchData();
    return () => {
      if (unsubAlerts) unsubAlerts();
      if (unsubEvents) unsubEvents();
    };
  }, [userData]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Welcome, {userData?.displayName}</h1>
        <p className="text-muted-foreground">Here's your academic overview</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Academic Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Academic Alerts
            </CardTitle>
            <CardDescription>Alerts for your modules</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : alerts.length > 0 ? (
              <ul className="space-y-3">
                {alerts.map(alert => (
                  <li key={alert.id} className="border-b pb-2 last:border-0">
                    <div className="font-medium">{alert.title} <span className="text-xs text-muted-foreground">({alert.moduleName})</span></div>
                    <div className="text-sm text-muted-foreground">{alert.description}</div>
                    <div className="text-xs text-gray-400">{format(alert.createdAt, "MMM d, yyyy")}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No alerts for your modules.</p>
            )}
          </CardContent>
        </Card>
        {/* Academic Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Upcoming Events
            </CardTitle>
            <CardDescription>Events for your modules</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : events.length > 0 ? (
              <ul className="space-y-3">
                {events.map(event => (
                  <li key={event.id} className="border-b pb-2 last:border-0">
                    <div className="font-medium">{event.title} <span className="text-xs text-muted-foreground">({event.moduleName})</span></div>
                    <div className="text-xs text-gray-400">{format(event.date, "MMM d, yyyy HH:mm")}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No upcoming events for your modules.</p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Subscribed Modules */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> My Modules
            </CardTitle>
            <CardDescription>Modules you are subscribed to</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : modules.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {modules.map(module => (
                  <Card key={module.id} className="shadow-sm border border-gray-200">
                    <CardContent className="p-4 flex flex-col items-start">
                      <div className="font-semibold text-base mb-1">{module.name}</div>
                      <div className="text-xs text-muted-foreground mb-2">{module.code}</div>
                      {module.description && (
                        <div className="text-xs text-gray-400 line-clamp-2">{module.description}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">You are not subscribed to any modules.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
