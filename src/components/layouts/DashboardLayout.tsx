
import React from "react";
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
  Plus
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { userData, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
          path: "/dashboard", 
          name: "Dashboard", 
          icon: <Home className="mr-2 h-4 w-4" /> 
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
          path: "/analytics", 
          name: "Analytics", 
          icon: <BarChart3 className="mr-2 h-4 w-4" /> 
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
          path: "/dashboard", 
          name: "Dashboard", 
          icon: <Home className="mr-2 h-4 w-4" /> 
        },
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

    // Default student navigation
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
    <>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="text-lg font-semibold tracking-tight">Uni-Alert Connect</h2>
          <p className="text-sm text-muted-foreground">
            {getRoleDisplayName()}
          </p>
        </div>
        <div className="px-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  {item.icon}
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-auto p-4">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for desktop */}
      {!isMobile && (
        <div className="hidden md:flex w-64 flex-col border-r bg-white">
          <NavContent />
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Top nav for mobile */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
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
          <div className="flex items-center gap-2">
            <span className="text-sm">{userData?.displayName}</span>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
