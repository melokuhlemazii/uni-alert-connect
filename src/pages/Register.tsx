import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { UserRole } from "@/context/AuthContext";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: { fullName?: string; email?: string; password?: string } = {};
    // Name: only letters and spaces
    if (!/^[A-Za-z ]+$/.test(fullName)) {
      newErrors.fullName = "Name must contain only letters and spaces.";
    }
    // Email: must be a gmail account
    if (!/^([a-zA-Z0-9_.+-]+)@gmail\.com$/.test(email)) {
      newErrors.email = "Email must be a valid Gmail address.";
    }
    // Password: min 6 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
    if (!/^.*(?=.{6,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?]).*$/.test(password)) {
      newErrors.password = "Password must be at least 6 characters, include uppercase, lowercase, number, and special character.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register(email, password, fullName, role);
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <motion.div 
            className="flex justify-center mb-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <GraduationCap className="h-12 w-12 text-indigo-600" />
          </motion.div>
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Join our learning platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe" 
                required 
              />
              {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
            </motion.div>
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com" 
                required 
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </motion.div>
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </motion.div>
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Label htmlFor="role">Role</Label>
              <Select 
                value={role} 
                onValueChange={(value) => setRole(value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
              disabled={isLoading}
              >
              {isLoading ? "Registering..." : "Register"}
              </Button>
            </motion.div>
          </form>
          <motion.div 
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <p>Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in here</Link></p>
          </motion.div>
        </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Register;
