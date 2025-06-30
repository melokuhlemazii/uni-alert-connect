import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, getDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookOpen, School, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Module {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  code: string;
  description?: string;
}

interface Department {
  id: string;
  name: string;
}

const Modules = () => {
  const { userData } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({});
  const [subscriptionsChanged, setSubscriptionsChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribeModules: (() => void) | undefined;
    let unsubscribeSubscriptions: (() => void) | undefined;
    setLoading(true);
    // Fetch modules from Firestore in real-time
    const modulesRef = collection(db, "modules");
    const q = query(modulesRef, orderBy("name"));
    unsubscribeModules = onSnapshot(q, (modulesSnapshot) => {
      const modulesData: Module[] = [];
      modulesSnapshot.forEach((doc) => {
        const data = doc.data();
        modulesData.push({
          id: doc.id,
          code: data.code,
          name: data.name,
          departmentId: data.departmentId || "",
          departmentName: data.departmentName || "",
          description: data.description || ""
        });
      });
      setModules(modulesData);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });
    // Real-time listener for user subscriptions
    if (userData?.uid) {
      const userSubscriptionsRef = doc(db, "userSubscriptions", userData.uid);
      unsubscribeSubscriptions = onSnapshot(userSubscriptionsRef, (userSubscriptionsDoc) => {
        if (userSubscriptionsDoc.exists()) {
          const userSubscriptions = userSubscriptionsDoc.data().modules || {};
          setSubscriptions(userSubscriptions);
        } else {
          setSubscriptions({});
        }
      });
    }
    // Optionally, fetch departments from Firestore if you want real-time departments
    // For now, keep departments hardcoded or fetch as needed
    setDepartments([
      { id: "it", name: "Information Technology" },
      { id: "ce", name: "Civil Engineering" },
      { id: "ee", name: "Electrical Engineering" },
      { id: "cs", name: "Computer Science" },
      { id: "me", name: "Mechanical Engineering" }
    ]);
    return () => {
      if (unsubscribeModules) unsubscribeModules();
      if (unsubscribeSubscriptions) unsubscribeSubscriptions();
    };
  }, [userData]);

  const toggleSubscription = (moduleId: string) => {
    setSubscriptions(prev => {
      const newSubscriptions = { 
        ...prev, 
        [moduleId]: !prev[moduleId] 
      };
      setSubscriptionsChanged(true);
      return newSubscriptions;
    });
  };

  const saveSubscriptions = async () => {
    try {
      if (!userData?.uid) return;
      
      await setDoc(doc(db, "userSubscriptions", userData.uid), {
        modules: subscriptions
      });
      
      toast({
        title: "Subscriptions saved",
        description: "Your module subscriptions have been updated"
      });
      
      setSubscriptionsChanged(false);
    } catch (error) {
      console.error("Error saving subscriptions:", error);
      toast({
        title: "Error saving subscriptions",
        description: "There was an error saving your subscriptions",
        variant: "destructive"
      });
    }
  };

  const groupModulesByDepartment = () => {
    const grouped: Record<string, Module[]> = {};
    
    modules.forEach(module => {
      if (!grouped[module.departmentId]) {
        grouped[module.departmentId] = [];
      }
      grouped[module.departmentId].push(module);
    });
    
    return grouped;
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Module Subscriptions</h1>
        <p className="text-muted-foreground">
          Subscribe to modules to receive alerts and notifications
        </p>
      </div>

      {subscriptionsChanged && (
        <div className="mb-6 flex justify-end">
          <Button onClick={saveSubscriptions} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-5 w-1/4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupModulesByDepartment()).map(([departmentId, deptModules]) => {
            const department = departments.find(d => d.id === departmentId);
            
            return (
              <Card key={departmentId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5" />
                    {department?.name || "Department"}
                  </CardTitle>
                  <CardDescription>Select modules to subscribe</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deptModules.map(module => (
                      <div key={module.id} className="flex items-start gap-3">
                        <Checkbox 
                          id={`module-${module.id}`} 
                          checked={!!subscriptions[module.id]}
                          onCheckedChange={() => toggleSubscription(module.id)}
                        />
                        <div>
                          <Label 
                            htmlFor={`module-${module.id}`} 
                            className="font-medium cursor-pointer"
                          >
                            {module.code} - {module.name}
                          </Label>
                          {module.description && (
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Modules;
