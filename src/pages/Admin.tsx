import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import LecturerPanel from "@/components/LecturerPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Bell, CalendarIcon, Plus, Users, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";

// Update the alert schema to include imageUrl
const alertSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["general", "test", "exam", "assignment"]),
  moduleId: z.string().min(1, "Module is required"),
  imageUrl: z.string().optional(),
});

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  date: z.date(),
  type: z.enum(["test", "exam", "assignment"]),
  moduleId: z.string().min(1, "Module is required"),
});

const Admin = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [modules, setModules] = useState<{id: string, name: string, code: string}[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Parse URL query parameters to get the active tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);
  
  // Check user role and fetch modules
  useEffect(() => {
    // Check if user is admin or lecturer
    if (!userData || (userData.role !== "admin" && userData.role !== "lecturer")) {
      navigate("/dashboard");
      return;
    }
    
    // Load modules
    const modulesData = [
      { id: "csy301", code: "CSY301", name: "Software Development" },
      { id: "isy201", code: "ISY201", name: "Information Systems" },
      { id: "csy202", code: "CSY202", name: "Databases" },
      { id: "ce101", code: "CE101", name: "Introduction to Civil Engineering" },
      { id: "ee201", code: "EE201", name: "Circuit Theory" },
      { id: "me301", code: "ME301", name: "Machine Design" },
      { id: "it310", code: "IT310", name: "Network Security" },
      { id: "csy405", code: "CSY405", name: "Artificial Intelligence" }
    ];
    setModules(modulesData);
  }, [userData, navigate]);

  // Updated alert form with imageUrl
  const alertForm = useForm<z.infer<typeof alertSchema>>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "general",
      moduleId: "",
      imageUrl: "",
    },
  });

  // Event form
  const eventForm = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      type: "test",
      moduleId: "",
    },
  });

  const onAlertSubmit = async (values: z.infer<typeof alertSchema>) => {
    try {
      // Find the module name for the selected moduleId
      const selectedModule = modules.find(m => m.id === values.moduleId);
      if (!selectedModule) return;
      
      // Get a default image URL based on alert type if none provided
      const imageUrl = values.imageUrl || getDefaultImageForType(values.type);
      
      // Add the alert to Firestore
      await addDoc(collection(db, "alerts"), {
        ...values,
        imageUrl,
        moduleName: selectedModule.name,
        moduleCode: selectedModule.code,
        createdAt: serverTimestamp(),
        createdBy: userData?.uid,
        createdByName: userData?.displayName,
      });
      
      toast({
        title: "Alert created",
        description: "The alert has been posted successfully",
      });
      
      // Reset the form
      alertForm.reset();
    } catch (error) {
      console.error("Error posting alert:", error);
      toast({
        title: "Error",
        description: "Failed to post the alert",
        variant: "destructive",
      });
    }
  };

  const onEventSubmit = async (values: z.infer<typeof eventSchema>) => {
    try {
      // Find the module name for the selected moduleId
      const selectedModule = modules.find(m => m.id === values.moduleId);
      if (!selectedModule) return;
      
      // Add the event to Firestore
      await addDoc(collection(db, "events"), {
        ...values,
        moduleName: selectedModule.name,
        moduleCode: selectedModule.code,
        createdAt: serverTimestamp(),
        createdBy: userData?.uid,
        createdByName: userData?.displayName,
      });
      
      toast({
        title: "Event created",
        description: "The event has been added successfully",
      });
      
      // Reset the form
      eventForm.reset();
    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        title: "Error",
        description: "Failed to add the event",
        variant: "destructive",
      });
    }
  };
  
  // Helper function to get default image based on alert type
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

  // Admin stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAlerts: 0,
    totalEvents: 0,
  });

  // Fetch stats for admin dashboard
  useEffect(() => {
    const fetchStats = async () => {
      if (userData?.role !== "admin") return;
      
      try {
        // Count users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const userCount = usersSnapshot.size;
        
        // Count alerts
        const alertsSnapshot = await getDocs(collection(db, "alerts"));
        const alertCount = alertsSnapshot.size;
        
        // Count events
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const eventCount = eventsSnapshot.size;
        
        setStats({
          totalUsers: userCount,
          totalAlerts: alertCount,
          totalEvents: eventCount,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchStats();
  }, [userData]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {userData?.role === "admin" ? "Admin Panel" : "Lecturer Panel"}
        </h1>
        <p className="text-muted-foreground">
          {userData?.role === "admin" 
            ? "Manage users, post alerts, and schedule events" 
            : "Post alerts and manage academic events"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Post Alert</TabsTrigger>
          <TabsTrigger value="events">Add Event</TabsTrigger>
          {userData?.role === "admin" && (
            <TabsTrigger value="users">User Management</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="overview">
          {userData?.role === "admin" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Users
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      Registered accounts
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Alerts
                    </CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalAlerts}</div>
                    <p className="text-xs text-muted-foreground">
                      Posted alerts
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Events
                    </CardTitle>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEvents}</div>
                    <p className="text-xs text-muted-foreground">
                      Scheduled events
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" /> Admin Actions
                    </CardTitle>
                    <CardDescription>
                      Quick actions for administrators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                      <Link to="/usermanagement">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Users
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("alerts")}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Post New Alert
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("events")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Schedule Event
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest actions on the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Activity feed will be implemented soon.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <LecturerPanel />
          )}
        </TabsContent>
        
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Create New Alert
              </CardTitle>
              <CardDescription>
                Post an announcement or alert to students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...alertForm}>
                <form onSubmit={alertForm.handleSubmit(onAlertSubmit)} className="space-y-6">
                  <FormField
                    control={alertForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alert Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter alert title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={alertForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter alert details" 
                            className="min-h-32" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide detailed information about the alert
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={alertForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Add an image URL to display with the alert. A default image will be used if left empty.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={alertForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alert Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select alert type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="test">Test</SelectItem>
                              <SelectItem value="exam">Exam</SelectItem>
                              <SelectItem value="assignment">Assignment</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={alertForm.control}
                      name="moduleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Module</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select module" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {modules.map(module => (
                                <SelectItem key={module.id} value={module.id}>
                                  {module.code} - {module.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> Post Alert
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Add New Event
              </CardTitle>
              <CardDescription>
                Schedule tests, exams, or assignment deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...eventForm}>
                <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-6">
                  <FormField
                    control={eventForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter event title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={eventForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter event details" 
                            className="min-h-20" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={eventForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Event Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={eventForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="test">Test</SelectItem>
                              <SelectItem value="exam">Exam</SelectItem>
                              <SelectItem value="assignment">Assignment</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={eventForm.control}
                    name="moduleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select module" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modules.map(module => (
                              <SelectItem key={module.id} value={module.id}>
                                {module.code} - {module.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Event
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {userData?.role === "admin" && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> User Management
                </CardTitle>
                <CardDescription>
                  Manage users and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700">
                  <Link to="/usermanagement">
                    <Users className="mr-2 h-4 w-4" />
                    Go to User Management
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
};

export default Admin;
