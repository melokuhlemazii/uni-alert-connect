import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/context/AuthContext";
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
  UserCheck, 
  UserCog,
  UserX,
  Trash,
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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: Date;
}

const UserManagement = () => {
  const { userData, updateUserRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "student",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    uid: "",
    displayName: "",
    email: "",
    role: "student",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (userData?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    
    fetchUsers();
  }, [userData, navigate]);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      
      const fetchedUsers: User[] = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        fetchedUsers.push({
          uid: doc.id,
          email: userData.email || "",
          displayName: userData.displayName || "",
          role: userData.role || "student",
          createdAt:
            userData.createdAt && typeof userData.createdAt.toDate === "function"
              ? userData.createdAt.toDate()
              : userData.createdAt
                ? new Date(userData.createdAt)
                : null,
        });
      });
      
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      
      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.uid === userId ? { ...user, role: newRole } : user
        )
      );
      
      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete user from Firestore
      await deleteDoc(doc(db, "users", userId));
      
      // Remove from local state
      setUsers((prevUsers) => prevUsers.filter((user) => user.uid !== userId));
      
      toast({
        title: "User deleted",
        description: "User has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        addForm.email,
        addForm.password
      );
      const newUser = userCredential.user;
      // 2. Add user to Firestore
      await updateDoc(doc(db, "users", newUser.uid), {
        email: addForm.email,
        displayName: addForm.displayName,
        role: addForm.role,
        createdAt: new Date(),
      });
      // 3. Update local state
      setUsers((prev) => [
        ...prev,
        {
          uid: newUser.uid,
          email: addForm.email,
          displayName: addForm.displayName,
          role: addForm.role as UserRole,
          createdAt: new Date(),
        },
      ]);
      setShowAddDialog(false);
      setAddForm({ displayName: "", email: "", password: "", role: "student" });
      toast({ title: "User added", description: "User has been created." });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditForm({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
    });
    setShowEditDialog(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      // Update user in Firestore
      await updateDoc(doc(db, "users", editForm.uid), {
        displayName: editForm.displayName,
        email: editForm.email,
        role: editForm.role,
      });
      setUsers((prev) =>
        prev.map((user) =>
          user.uid === editForm.uid
            ? { ...user, displayName: editForm.displayName, email: editForm.email, role: editForm.role as UserRole }
            : user
        )
      );
      setShowEditDialog(false);
      toast({ title: "User updated", description: "User details have been updated." });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <UserCog className="h-4 w-4 text-red-500" />;
      case "lecturer":
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      user.role.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and permissions
        </p>
      </div>
      <Button className="mb-4" onClick={() => setShowAddDialog(true)}>
        + Add User
      </Button>
      {/* Add User Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block mb-1">Name</label>
                <Input
                  value={addForm.displayName}
                  onChange={e => setAddForm(f => ({ ...f, displayName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Email</label>
                <Input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Password</label>
                <Input
                  type="password"
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Role</label>
                <select
                  className="w-full border rounded p-2"
                  value={addForm.role}
                  onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                  required
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addLoading}>
                  {addLoading ? "Adding..." : "Add User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit User Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block mb-1">Name</label>
                <Input
                  value={editForm.displayName}
                  onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Role</label>
                <select
                  className="w-full border rounded p-2"
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  required
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" /> Users
          </CardTitle>
          <CardDescription>
            View and manage user accounts
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-6">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-center py-6">No users found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>{user.displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? format(user.createdAt, "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(user)}>
                          <UserX className="h-4 w-4" />
                        </Button>
                        
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value: string) => 
                            handleRoleChange(user.uid, value as UserRole)
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="lecturer">Lecturer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(user.uid)}
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

export default UserManagement;
