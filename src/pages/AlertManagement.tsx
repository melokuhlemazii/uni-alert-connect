import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { 
  Search, 
  AlertTriangle,
  Trash,
  Edit,
  Plus
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface AlertItem {
  id: string;
  title: string;
  description: string;
  type: string; // 'general', 'test', 'exam', 'assignment', 'event', etc.
  moduleId: string;
  moduleName: string;
  createdAt: Date;
  createdBy: string;
  scheduledAt?: string | Date | null;
}

const FILTERS = [
  { label: "All", value: "all" },
  { label: "General", value: "general" },
  { label: "Tests", value: "test" },
  { label: "Exams", value: "exam" },
  { label: "Assignments", value: "assignment" },
  { label: "Events", value: "event" },
];

const AlertManagement = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add'|'edit'>("add");
  const [form, setForm] = useState({
    id: "",
    title: "",
    description: "",
    type: "general",
    moduleId: "",
    moduleName: "",
    scheduledAt: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (userData?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, navigate]);

  const fetchAlerts = async () => {
    try {
      const alertsSnapshot = await getDocs(collection(db, "alerts"));
      
      const fetchedAlerts: AlertItem[] = [];
      alertsSnapshot.forEach((doc) => {
        const alertData = doc.data();
        fetchedAlerts.push({
          id: doc.id,
          title: alertData.title || "",
          description: alertData.description || "",
          type: alertData.type || "general",
          moduleId: alertData.moduleId || "",
          moduleName: alertData.moduleName || "",
          createdAt: alertData.createdAt?.toDate() || new Date(),
          createdBy: alertData.createdBy || "",
        });
      });
      
      setAlerts(fetchedAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast({
        title: "Error",
        description: "Failed to load alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteDoc(doc(db, "alerts", alertId));
      setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId));
      
      toast({
        title: "Alert deleted",
        description: "Alert has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesFilter = activeFilter === "all" ? true : alert.type === activeFilter;
    return (
      matchesFilter && (
        alert.title.toLowerCase().includes(searchTermLower) ||
        alert.description.toLowerCase().includes(searchTermLower) ||
        alert.moduleName.toLowerCase().includes(searchTermLower) ||
        alert.type.toLowerCase().includes(searchTermLower)
      )
    );
  });

  const openAddDialog = () => {
    setDialogMode("add");
    setForm({ id: "", title: "", description: "", type: "general", moduleId: "", moduleName: "", scheduledAt: "" });
    setShowDialog(true);
  };

  const openEditDialog = (alert: AlertItem) => {
    setDialogMode("edit");
    setForm({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      type: alert.type,
      moduleId: alert.moduleId,
      moduleName: alert.moduleName,
      scheduledAt: alert.scheduledAt ? (typeof alert.scheduledAt === "string" ? alert.scheduledAt : alert.scheduledAt.toISOString().slice(0, 16)) : "",
    });
    setShowDialog(true);
  };

  // Add or Edit handler
  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (dialogMode === "add") {
        // Add new alert/event
        await addDoc(collection(db, "alerts"), {
          title: form.title,
          description: form.description,
          type: form.type,
          moduleId: form.moduleId,
          moduleName: form.moduleName,
          createdAt: new Date(),
          createdBy: userData?.uid || "",
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : null,
        });
        toast({ title: "Created", description: "Alert/Event created." });
      } else {
        // Edit existing alert/event
        await setDoc(doc(db, "alerts", form.id), {
          title: form.title,
          description: form.description,
          type: form.type,
          moduleId: form.moduleId,
          moduleName: form.moduleName,
          createdAt: new Date(), // Optionally keep original createdAt
          createdBy: userData?.uid || "",
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : null,
        });
        toast({ title: "Updated", description: "Alert/Event updated." });
      }
      setShowDialog(false);
      setFormLoading(false);
      fetchAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Alert & Event Management</h1>
        <p className="text-muted-foreground">
          Manage all alerts and events across the system
        </p>
      </div>
      {/* Filter Bar */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <Button
            key={f.value}
            variant={activeFilter === f.value ? "default" : "outline"}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Alerts & Events
              </CardTitle>
              <CardDescription>
                View, edit, and delete alerts and events from all users
              </CardDescription>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Alert/Event
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-6">Loading...</p>
          ) : filteredAlerts.length === 0 ? (
            <p className="text-center py-6">No items found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.description.substring(0, 50)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{alert.moduleName}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                          alert.type === "exam"
                            ? "bg-red-100 text-red-800"
                            : alert.type === "assignment"
                            ? "bg-yellow-100 text-yellow-800"
                            : alert.type === "event"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {alert.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(alert.createdAt, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(alert)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this item? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteAlert(alert.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Add/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{dialogMode === 'add' ? 'New Alert/Event' : 'Edit Alert/Event'}</h2>
            <form onSubmit={handleAddOrEdit} className="space-y-4">
              <div>
                <label className="block mb-1">Title</label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Description</label>
                <Input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block mb-1">Type</label>
                  <select
                    className="w-full border rounded p-2"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    required
                  >
                    <option value="general">General</option>
                    <option value="test">Test</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block mb-1">Module</label>
                  <Input
                    value={form.moduleName}
                    onChange={e => setForm(f => ({ ...f, moduleName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1">Scheduled Date (Optional)</label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (dialogMode === 'add' ? 'Creating...' : 'Saving...') : (dialogMode === 'add' ? 'Create' : 'Save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AlertManagement;
