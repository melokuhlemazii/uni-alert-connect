import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BarChart3, Users, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Analytics = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAlerts: 0,
    totalEvents: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    
    fetchAnalytics();
  }, [userData, navigate]);

  const fetchAnalytics = async () => {
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const totalUsers = usersSnapshot.size;
      
      // Fetch alerts
      const alertsSnapshot = await getDocs(collection(db, "alerts"));
      const totalAlerts = alertsSnapshot.size;
      
      // Fetch events
      const eventsSnapshot = await getDocs(collection(db, "events"));
      const totalEvents = eventsSnapshot.size;
      
      setStats({
        totalUsers,
        totalAlerts,
        totalEvents,
        activeUsers: Math.floor(totalUsers * 0.8) // Mock active users
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts
  const monthlyAlerts = [
    { name: "Jan", alerts: 12 },
    { name: "Feb", alerts: 19 },
    { name: "Mar", alerts: 15 },
    { name: "Apr", alerts: 25 },
    { name: "May", alerts: 22 },
    { name: "Jun", alerts: 18 }
  ];

  const alertTypes = [
    { name: "Exams", value: 35, color: "#ef4444" },
    { name: "Assignments", value: 25, color: "#f59e0b" },
    { name: "Tests", value: 20, color: "#3b82f6" },
    { name: "General", value: 20, color: "#10b981" }
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <p className="text-muted-foreground">
          System-wide analytics and engagement metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Students, lecturers, and admins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              All time alerts created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled academic events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Alert Activity</CardTitle>
            <CardDescription>Number of alerts created per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyAlerts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="alerts" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alert Types Distribution</CardTitle>
            <CardDescription>Breakdown of alert categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alertTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {alertTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
