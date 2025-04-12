
import React, { createContext, useState, useContext, useEffect } from "react";
import { 
  User,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

export type UserRole = "student" | "admin" | "lecturer";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt?: Date;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (uid: string, newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            setUserData(userData);
          } else {
            // Create basic userData from auth user if not in Firestore
            setUserData({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              role: "student" // Default role
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: "student" // Default role
          });
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, displayName: string, role: UserRole) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      // Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        displayName,
        role,
        createdAt: new Date()
      });
      
      // Update local userData
      setUserData({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role
      });
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: (error as Error).message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "You have logged in successfully!",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: (error as Error).message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully!",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: (error as Error).message,
        variant: "destructive"
      });
      throw error;
    }
  };

  // New function to update user role (admin only)
  const updateUserRole = async (uid: string, newRole: UserRole) => {
    try {
      // Check if current user is admin
      if (userData?.role !== "admin") {
        throw new Error("Only admins can update user roles");
      }

      // Update user role in Firestore
      await setDoc(doc(db, "users", uid), { role: newRole }, { merge: true });
      
      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: (error as Error).message,
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      login, 
      register, 
      logout,
      updateUserRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
