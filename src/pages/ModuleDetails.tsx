import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DiscussionForum from "@/components/DiscussionForum";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";

const ModuleDetails = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const [moduleName, setModuleName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!moduleId) return;
    const fetchModule = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "modules", moduleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setModuleName(docSnap.data().name || "Module Details");
          setDescription(docSnap.data().description || "");
        } else {
          // fallback for sample data
          const sample = {
            "1": { name: "Computer Science Fundamentals", description: "Introduction to programming and computer science concepts" },
            "2": { name: "Data Structures and Algorithms", description: "Advanced programming concepts and algorithm design" },
            "3": { name: "Web Development", description: "Modern web development using React and Node.js" }
          };
          setModuleName(sample[moduleId]?.name || "Module Details");
          setDescription(sample[moduleId]?.description || "");
        }
      } catch {
        setModuleName("Module Details");
        setDescription("");
      }
      setLoading(false);
    };
    fetchModule();
  }, [moduleId]);

  const handleSave = async () => {
    if (!moduleId) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "modules", moduleId), {
        name: moduleName,
        description,
        updatedBy: userData?.uid,
        updatedAt: new Date(),
      }, { merge: true });
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{moduleName}</h1>
        <p className="text-muted-foreground">View module information and engage with students</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Module Information</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4 max-w-xl">
              <Input
                value={moduleName}
                onChange={e => setModuleName(e.target.value)}
                placeholder="Module Name"
                className="mb-2"
              />
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Module Description"
                className="mb-2"
              />
              <Button onClick={handleSave} disabled={loading || !moduleName.trim()} className="mr-2 bg-indigo-600 hover:bg-indigo-700">Save</Button>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={loading}>Cancel</Button>
            </div>
          ) : (
            <div className="max-w-xl">
              <div className="mb-2 text-lg font-semibold">{moduleName}</div>
              <div className="mb-2 text-muted-foreground whitespace-pre-line">{description || <span className="italic">No description provided.</span>}</div>
              {userData?.role === "lecturer" && (
                <Button size="sm" onClick={() => setEditing(true)} className="mt-2">Edit</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forum">Discussion Forum</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="mt-4">Module overview and resources go here.</div>
          </TabsContent>
          <TabsContent value="forum">
            {moduleId && <DiscussionForum moduleId={moduleId} />}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ModuleDetails;
