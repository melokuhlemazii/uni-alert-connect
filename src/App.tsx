import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBasedLanding from "@/components/RoleBasedLanding";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Dashboard Pages
import Alerts from "./pages/Alerts";
import Modules from "./pages/Modules";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Admin Pages
import UserManagement from "./pages/UserManagement";
import AlertManagement from "./pages/AlertManagement";
import Analytics from "./pages/Analytics";
import SystemSettings from "./pages/SystemSettings";

// Lecturer Pages
import MyModules from "./pages/MyModules";
import CreateAlert from "./pages/CreateAlert";
import ModuleDetails from "./pages/ModuleDetails";

// Student Pages
import MyTimetable from "./pages/MyTimetable";
import StudentDashboard from "./pages/StudentDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect from index to login page */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/alerts" element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            } />
            <Route path="/modules" element={
              <ProtectedRoute>
                <Modules />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/usermanagement" element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/alert-management" element={
              <ProtectedRoute>
                <AlertManagement />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/system-settings" element={
              <ProtectedRoute>
                <SystemSettings />
              </ProtectedRoute>
            } />
            
            {/* Lecturer Routes */}
            <Route path="/my-modules" element={
              <ProtectedRoute>
                <MyModules />
              </ProtectedRoute>
            } />
            <Route path="/create-alert" element={
              <ProtectedRoute>
                <CreateAlert />
              </ProtectedRoute>
            } />
            <Route path="/modules/:moduleId" element={
              <ProtectedRoute>
                <ModuleDetails />
              </ProtectedRoute>
            } />
            
            {/* Student Routes */}
            <Route path="/my-timetable" element={
              <ProtectedRoute>
                <MyTimetable />
              </ProtectedRoute>
            } />
            
            {/* Student dashboard route - only for students */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            
            {/* Role-based landing after login */}
            <Route path="/home" element={
              <ProtectedRoute>
                <RoleBasedLanding />
              </ProtectedRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
