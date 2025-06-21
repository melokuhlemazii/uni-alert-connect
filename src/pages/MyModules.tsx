import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, Users, Plus, Upload, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  studentCount: number;
  lecturerId: string;
}

const MyModules = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [modules, setModules] = useState<Module[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.role !== "lecturer") {
      navigate("/dashboard");
      return;
    }
    
    fetchModules();
  }, [userData, navigate]);

  const fetchModules = async () => {
    if (!userData?.uid) return;
    
    try {
      // In a real app, you'd query modules where lecturerId equals userData.uid
      // For now, we'll create some sample data
      const sampleModules: Module[] = [
        {
          id: "1",
          name: "Computer Science Fundamentals",
          code: "CS101",
          description: "Introduction to programming and computer science concepts",
          studentCount: 45,
          lecturerId: userData.uid
        },
        {
          id: "2",
          name: "Data Structures and Algorithms",
          code: "CS201",
          description: "Advanced programming concepts and algorithm design",
          studentCount: 32,
          lecturerId: userData.uid
        },
        {
          id: "3",
          name: "Web Development",
          code: "CS301",
          description: "Modern web development using React and Node.js",
          studentCount: 28,
          lecturerId: userData.uid
        }
      ];
      
      setModules(sampleModules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast({
        title: "Error",
        description: "Failed to load modules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules.filter((module) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      module.name.toLowerCase().includes(searchTermLower) ||
      module.code.toLowerCase().includes(searchTermLower) ||
      module.description.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Modules</h1>
        <p className="text-muted-foreground">
          Manage the modules you teach
        </p>
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
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-6">Loading modules...</p>
      ) : modules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No modules assigned</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any modules assigned yet. Contact your administrator.
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
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
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
