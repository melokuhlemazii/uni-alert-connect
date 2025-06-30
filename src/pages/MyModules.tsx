import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, Users, Plus, Trash, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  studentCount: number;
}

const MyModules = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]); // Modules taught by lecturer
  const [allModules, setAllModules] = useState<Module[]>([]); // All modules in DB
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  // Fetch modules taught by this lecturer
  useEffect(() => {
    if (userData?.role !== "lecturer") {
      navigate("/dashboard");
      return;
    }
    setLoading(true);
    const lecturerModulesRef = collection(db, "lecturerModules");
    const q = query(lecturerModulesRef, where("lecturerId", "==", userData.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      (async () => {
        const lecturerModules: Module[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const moduleDoc = await getDoc(doc(db, "modules", data.moduleId));
          if (moduleDoc.exists()) {
            const mod = moduleDoc.data();
            // Count students enrolled in this module
            const userSubsQ = query(collection(db, "userSubscriptions"), where("moduleId", "==", data.moduleId));
            const userSubsSnap = await getDocs(userSubsQ);
            const studentCount = userSubsSnap.size;
            lecturerModules.push({
              id: moduleDoc.id,
              name: mod.name,
              code: mod.code,
              description: mod.description,
              studentCount
            });
          }
        }
        setModules(lecturerModules);
        setLoading(false);
      })();
    });
    return () => unsubscribe();
  }, [userData, navigate]);

  // Fetch all modules for Add Module dialog
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "modules"), (snapshot) => {
      const all: Module[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        all.push({
          id: doc.id,
          name: data.name,
          code: data.code,
          description: data.description,
          studentCount: data.studentCount || 0
        });
      });
      setAllModules(all);
    });
    return () => unsubscribe();
  }, []);

  const filteredModules = modules.filter((module) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      module.name.toLowerCase().includes(searchTermLower) ||
      module.code.toLowerCase().includes(searchTermLower) ||
      module.description.toLowerCase().includes(searchTermLower)
    );
  });

  // Add module to lecturer's list
  const handleAddModule = async (moduleId: string) => {
    if (!userData?.uid) return;
    try {
      await setDoc(doc(collection(db, "lecturerModules")), {
        lecturerId: userData.uid,
        moduleId
      });
      toast({ title: "Module added", description: "Module added to your teaching list." });
      setShowAddDialog(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add module.", variant: "destructive" });
    }
  };

  // Remove module from lecturer's list
  const handleDeleteModule = async (moduleId: string) => {
    if (!userData?.uid) return;
    try {
      const q = query(collection(db, "lecturerModules"), where("lecturerId", "==", userData.uid), where("moduleId", "==", moduleId));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        toast({ title: "Error", description: "Module not found in your list.", variant: "destructive" });
        return;
      }
      const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
      toast({ title: "Module removed", description: "Module removed from your teaching list." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove module.", variant: "destructive" });
    }
  };

  // Filter modules for Add Module dialog
  const availableModules = allModules.filter(
    (mod) => !modules.some((m) => m.id === mod.id) &&
      (mod.name.toLowerCase().includes(addSearch.toLowerCase()) ||
        mod.code.toLowerCase().includes(addSearch.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Modules</h1>
        <p className="text-muted-foreground">Manage the modules you teach</p>
      </div>
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>
      </div>
      {/* Add Module Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add Module</h2>
            <Input
              placeholder="Search all modules..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="mb-4"
            />
            <div className="max-h-64 overflow-y-auto space-y-2">
              {availableModules.length === 0 ? (
                <p className="text-muted-foreground">No modules found.</p>
              ) : (
                availableModules.map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="font-medium">{mod.name}</div>
                      <div className="text-xs text-muted-foreground">{mod.code}</div>
                      <div className="text-xs text-muted-foreground">{mod.description}</div>
                    </div>
                    <Button size="sm" onClick={() => handleAddModule(mod.id)}>
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <p className="text-center py-6">Loading modules...</p>
      ) : modules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No modules assigned</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any modules assigned yet. Click Add Module to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((module) => (
            <Card key={module.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{module.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {module.code}
                    </Badge>
                  </div>
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription className="mt-2">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {module.studentCount} students enrolled
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/modules/${module.id}`)}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="flex-1"
                    onClick={async () => await handleDeleteModule(module.id)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyModules;
