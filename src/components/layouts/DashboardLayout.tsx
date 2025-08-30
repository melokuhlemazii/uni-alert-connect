import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Calendar, 
  Home, 
  LogOut, 
  Settings, 
  BookOpen,
  User,
  Menu,
  Users,
  AlertTriangle,
  BarChart3,
  Clock,
  Plus,
  Moon,
  Sun,
  UserCircle
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { useAuth } from "@/context/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { NotificationCenter } from "@/components/NotificationCenter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { userData, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // Move darkMode state to localStorage for global theme persistence
  const [darkMode, setDarkMode] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Role-specific navigation items
  const getNavItems = () => {
    const role = userData?.role;

    if (role === "admin") {
      return [
        { 
          path: "/analytics", 
          name: "Analytics", 
          icon: <BarChart3 className="mr-2 h-4 w-4" /> 
        },
        { 
          path: "/usermanagement", 
          name: "User Management", 
          icon: <Users className="mr-2 h-4 w-4" /> 
        },
        { 
          path: "/alert-management", 
          name: "Alert Management", 
          icon: <AlertTriangle className="mr-2 h-4 w-4" /> 
        },
        { 
          path: "/system-settings", 
          name: "System Settings", 
          icon: <Settings className="mr-2 h-4 w-4" /> 
        },
        { 
          path: "/profile", 
          name: "Profile", 
          icon: <User className="mr-2 h-4 w-4" /> 
        }
      ];
    }

    if (role === "lecturer") {
      return [
        { 
          path: "/my-modules", 
          name: "My Modules", 
          icon: <BookOpen className="mr-2 h-4 w-4" /> 
        },
        { 
          path: "/create-alert", 
          name: "Create Alert", 
          icon: <Plus className="mr-2 h-4 w-4" /> 
        },
        { 
          path: "/calendar", 
          name: "Calendar", 
          icon: <Calendar className="mr-2 h-4 w-4" /> 
        },
        { 
          path: "/alerts", 
          name: "Alerts", 
          icon: <Bell className="mr-2 h-4 w-4" /> 
        },
        { 
          path: "/profile", 
          name: "Profile", 
          icon: <User className="mr-2 h-4 w-4" /> 
        }
      ];
    }

    // Student navigation
    return [
      { 
        path: "/dashboard", 
        name: "Dashboard", 
        icon: <Home className="mr-2 h-4 w-4" /> 
      },
      { 
        path: "/modules", 
        name: "My Modules", 
        icon: <BookOpen className="mr-2 h-4 w-4" /> 
      },
      { 
        path: "/calendar", 
        name: "Calendar", 
        icon: <Calendar className="mr-2 h-4 w-4" /> 
      },
      { 
        path: "/my-timetable", 
        name: "My Timetable", 
        icon: <Clock className="mr-2 h-4 w-4" /> 
      },
      { 
        path: "/alerts", 
        name: "Alerts", 
        icon: <Bell className="mr-2 h-4 w-4" /> 
      },
      { 
        path: "/profile", 
        name: "Profile", 
        icon: <User className="mr-2 h-4 w-4" /> 
      }
    ];
  };

  const navItems = getNavItems();

  const getRoleDisplayName = () => {
    switch (userData?.role) {
      case "admin":
        return "Admin Dashboard";
      case "lecturer":
        return "Lecturer Dashboard";
      case "student":
        return "Student Dashboard";
      default:
        return "Dashboard";
    }
  };

  const NavContent = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <motion.h2 
            className="text-lg font-semibold tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Uni-Alert Connect
          </motion.h2>
          <p className="text-sm text-muted-foreground">
            {getRoleDisplayName()}
          </p>
        </div>
        <div className="px-2">
          <motion.div 
            className="space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, staggerChildren: 0.05 }}
          >
            {navItems.map((item) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={item.path}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className={`w-full justify-start transition-all duration-200 ${isActive(item.path) ? "bg-indigo-100 dark:bg-indigo-900" : ""}`}
                >
                  {item.icon}
                  {item.name}
                </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      <motion.div 
        className="mt-auto p-4 flex flex-col gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
        <Button
          onClick={() => setDarkMode((d) => !d)}
          variant="ghost"
          className="w-full justify-start"
        >
          {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {darkMode ? "Light Mode" : "Dark Mode"}
        </Button>
      </motion.div>
    </motion.div>
  );

  return (
    <div className={`flex min-h-screen ${darkMode ? "dark bg-gray-950 text-white" : "bg-gray-50"}`}> 
      {/* Sidebar for desktop */}
      {!isMobile && (
        <div className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-gray-900">
          <NavContent />
        </div>
      )}
      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Top nav for mobile and desktop */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white dark:bg-gray-900 px-4 md:px-6">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <NavContent />
              </SheetContent>
            </Sheet>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {navItems.find(item => isActive(item.path))?.name || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Add Notification Center for students */}
            {userData?.role === "student" && <NotificationCenter />}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-7 w-7" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/system-settings")}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDarkMode((d) => !d)}>
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm font-medium">{userData?.displayName}</span>
          </div>
        </header>
        {/* Page content */}
        <motion.main 
          className="flex-1 p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;