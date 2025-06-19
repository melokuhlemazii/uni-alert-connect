
import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
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
  type: string;
  moduleId: string;
  moduleName: string;
  createdAt: Date;
  createdBy: string;
}

const AlertManagement = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    
    fetchAlerts();
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
    return (
      alert.title.toLowerCase().includes(searchTermLower) ||
      alert.description.toLowerCase().includes(searchTermLower) ||
      alert.moduleName.toLowerCase().includes(searchTermLower) ||
      alert.type.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Alert Management</h1>
        <p className="text-muted-foreground">
          Manage all alerts across the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> System Alerts
              </CardTitle>
              <CardDescription>
                View, edit, and delete alerts from all users
              </CardDescription>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-6">Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <p className="text-center py-6">No alerts found</p>
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
                              : "bg-blue-100 text-blue-800"
                        }`}>
                          {alert.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(alert.createdAt, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button variant="outline" size="icon">
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
                              <AlertDialogTitle>Delete Alert</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this alert? This action cannot be undone.
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
    </DashboardLayout>
  );
};

export default AlertManagement;
