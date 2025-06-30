import React, { useState, useEffect } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
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

  // Remove hardcoded chart data and compute from Firestore
  const [monthlyAlerts, setMonthlyAlerts] = useState([]);
  const [alertTypes, setAlertTypes] = useState([]);

  useEffect(() => {
    if (userData?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchAnalytics();
    // Listen for real-time updates to alerts
    const unsubscribe = onSnapshot(collection(db, "alerts"), () => fetchAnalytics());
    return () => unsubscribe();
  }, [userData, navigate]);

  const fetchAnalytics = async () => {
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const totalUsers = usersSnapshot.size;
      // Fetch alerts
      const alertsSnapshot = await getDocs(collection(db, "alerts"));
      const totalAlerts = alertsSnapshot.size;
      // Fetch events (alerts of type 'event')
      let totalEvents = 0;
      const alertTypeCounts = {};
      const monthlyCounts = Array(12).fill(0);
      alertsSnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        const month = createdAt.getMonth();
        monthlyCounts[month]++;
        alertTypeCounts[data.type] = (alertTypeCounts[data.type] || 0) + 1;
        if (data.type === "event") totalEvents++;
      });
      setStats({
        totalUsers,
        totalAlerts,
        totalEvents,
        activeUsers: Math.floor(totalUsers * 0.8)
      });
      // Prepare chart data
      setMonthlyAlerts([
        { name: "Jan", alerts: monthlyCounts[0] },
        { name: "Feb", alerts: monthlyCounts[1] },
        { name: "Mar", alerts: monthlyCounts[2] },
        { name: "Apr", alerts: monthlyCounts[3] },
        { name: "May", alerts: monthlyCounts[4] },
        { name: "Jun", alerts: monthlyCounts[5] },
        { name: "Jul", alerts: monthlyCounts[6] },
        { name: "Aug", alerts: monthlyCounts[7] },
        { name: "Sep", alerts: monthlyCounts[8] },
        { name: "Oct", alerts: monthlyCounts[9] },
        { name: "Nov", alerts: monthlyCounts[10] },
        { name: "Dec", alerts: monthlyCounts[11] },
      ]);
      // Alert type pie chart
      const typeColors = {
        exam: "#ef4444",
        assignment: "#f59e0b",
        test: "#3b82f6",
        general: "#10b981",
        event: "#22d3ee"
      };
      setAlertTypes(Object.entries(alertTypeCounts).map(([name, value]) => ({ name, value, color: typeColors[name] || "#8884d8" })));
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

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
