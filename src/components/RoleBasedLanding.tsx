import { useAuth } from "@/context/useAuth";
import { Navigate } from "react-router-dom";

const RoleBasedLanding = () => {
  const { userData } = useAuth();
  if (!userData) return <Navigate to="/login" replace />;
  if (userData.role === "admin") return <Navigate to="/analytics" replace />;
  if (userData.role === "lecturer") return <Navigate to="/my-modules" replace />;
  if (userData.role === "student") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/profile" replace />;
};

export default RoleBasedLanding;
