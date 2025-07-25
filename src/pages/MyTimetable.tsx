import React, { useState } from "react";
import { useAuth } from "@/context/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Upload, Download, Trash, Image } from "lucide-react";
import { collection, getDocs, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Define a type for calendar items
interface CalendarItem {
  id: string;
  title: string;
  description: string;
  type: string;
  scheduledAt: Date;
}

const MyTimetable = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [timetableUrl, setTimetableUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);

  React.useEffect(() => {
    if (userData?.role !== "student") {
      navigate("/dashboard");
      return;
    }
    // Real-time listener for user's timetable
    let unsubscribeTimetable: (() => void) | undefined;
    if (userData?.uid) {
      const userDocRef = doc(db, "users", userData.uid);
      unsubscribeTimetable = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.timetableUrl) setTimetableUrl(data.timetableUrl);
          else setTimetableUrl("");
        }
      });
    }
    // Real-time listener for calendar items (alerts/events)
    const alertsRef = collection(db, "alerts");
    const unsubscribeAlerts = onSnapshot(alertsRef, (snapshot) => {
      const items: CalendarItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (["event", "exam", "assignment"].includes(data.type) && data.scheduledAt) {
          items.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            type: data.type,
            scheduledAt: data.scheduledAt.toDate ? data.scheduledAt.toDate() : new Date(data.scheduledAt),
          });
        }
      });
      // Sort by date ascending
      items.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
      setCalendarItems(items);
    });
    return () => {
      if (unsubscribeTimetable) unsubscribeTimetable();
      unsubscribeAlerts();
    };
  }, [userData, navigate]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      // Allow image/* and PDF
      if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image or PDF file",
          variant: "destructive"
        });
        return;
      }
      setTimetableFile(file);
    }
  };

  const handleUpload = async () => {
    if (!timetableFile || !userData?.uid) return;
    setIsUploading(true);
    try {
      // Always use a fixed file name for overwrite/removal
      const fileExt = timetableFile.name.split('.').pop();
      const fileRef = storageRef(storage, `timetables/${userData.uid}/timetable.${fileExt}`);
      await uploadBytes(fileRef, timetableFile);
      const url = await getDownloadURL(fileRef);
      setTimetableUrl(url);
      setTimetableFile(null);
      // Save URL to Firestore
      await setDoc(doc(db, "users", userData.uid), { timetableUrl: url }, { merge: true });
      toast({
        title: "Timetable uploaded",
        description: "Your timetable has been saved successfully",
      });
    } catch (error) {
      setTimetableFile(null);
      toast({
        title: "Upload failed",
        description: (error as Error).message || "Failed to upload your timetable",
        variant: "destructive"
      });
      return;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!userData?.uid || !timetableUrl) return;
    try {
      // Delete from Firebase Storage
      const fileRef = storageRef(storage, `timetables/${userData.uid}/timetable.${timetableUrl.split('.').pop().split('?')[0]}`);
      await deleteObject(fileRef);
    } catch (e) {
      // Ignore if file doesn't exist
    }
    setTimetableUrl("");
    setTimetableFile(null);
    // Remove URL from Firestore
    await setDoc(doc(db, "users", userData.uid), { timetableUrl: "" }, { merge: true });
    toast({
      title: "Timetable removed",
      description: "Your timetable has been removed",
    });
  };

  const handleDownload = () => {
    if (timetableUrl) {
      const link = document.createElement('a');
      link.href = timetableUrl;
      link.download = 'my-timetable.jpg';
      link.click();
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Timetable</h1>
        <p className="text-muted-foreground">
          Upload and manage your personal class schedule
        </p>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Timetable
            </CardTitle>
            <CardDescription>
              Upload an image of your class timetable for easy access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timetable">Select Timetable Image</Label>
                <Input
                  id="timetable"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: JPG, PNG, GIF, PDF (Max 5MB)
                </p>
              </div>
              
              {timetableFile && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <span className="text-sm">{timetableFile.name}</span>
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Timetable */}
        {timetableUrl && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Your Timetable
                  </CardTitle>
                  <CardDescription>
                    Your uploaded class schedule
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={timetableUrl}
                  alt="Your timetable"
                  className="w-full h-auto max-h-[600px] object-contain"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tips for a Better Timetable</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Take a clear, well-lit photo of your printed timetable</li>
              <li>• Make sure all text is readable and not blurry</li>
              <li>• Include room numbers and lecturer names if possible</li>
              <li>• You can update your timetable anytime during the semester</li>
              <li>• Consider creating a digital version for better clarity</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyTimetable;
