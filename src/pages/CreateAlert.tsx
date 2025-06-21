import React, { useState, useEffect } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Plus, AlertTriangle, Calendar } from "lucide-react";

const CreateAlert = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    moduleId: "",
    moduleName: "",
    scheduledDate: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sample modules - in a real app, fetch from Firestore
  const modules = [
    { id: "1", name: "Computer Science Fundamentals", code: "CS101" },
    { id: "2", name: "Data Structures and Algorithms", code: "CS201" },
    { id: "3", name: "Web Development", code: "CS301" }
  ];

  useEffect(() => {
    if (userData?.role !== "lecturer") {
      navigate("/dashboard");
      return;
    }
  }, [userData, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleModuleChange = (moduleId: string) => {
    const selectedModule = modules.find(m => m.id === moduleId);
    setFormData(prev => ({
      ...prev,
      moduleId,
      moduleName: selectedModule ? `${selectedModule.name} (${selectedModule.code})` : ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.type || !formData.moduleId) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, "alerts"), {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        moduleId: formData.moduleId,
        moduleName: formData.moduleName,
        createdAt: Timestamp.now(),
        createdBy: userData?.uid,
        createdByName: userData?.displayName,
        scheduledDate: formData.scheduledDate ? Timestamp.fromDate(new Date(formData.scheduledDate)) : null
      });
      
      toast({
        title: "Alert created",
        description: "Your alert has been created successfully",
      });
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "",
        moduleId: "",
        moduleName: "",
        scheduledDate: ""
      });
      
      navigate("/alerts");
    } catch (error) {
      console.error("Error creating alert:", error);
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Alert</h1>
        <p className="text-muted-foreground">
          Create and schedule alerts for your students
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New Alert
          </CardTitle>
          <CardDescription>
            Fill in the details below to create a new alert for your students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Alert Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Midterm Exam Scheduled"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide details about the alert..."
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alert Type *</Label>
                <Select onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Module *</Label>
                <Select onValueChange={handleModuleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name} ({module.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date (Optional)</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                If set, the alert will be published at this time
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? "Creating..." : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Create Alert
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default CreateAlert;
