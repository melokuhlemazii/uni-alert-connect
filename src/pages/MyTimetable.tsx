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
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MyTimetable = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [timetableUrl, setTimetableUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [calendarItems, setCalendarItems] = useState<any[]>([]);

  React.useEffect(() => {
    if (userData?.role !== "student") {
      navigate("/dashboard");
      return;
    }
    
    // In a real app, fetch user's existing timetable
    // For demo, we'll set a sample timetable
    setTimetableUrl("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80");

    // Fetch alerts/events for calendar
    const fetchCalendarItems = async () => {
      const snapshot = await getDocs(collection(db, "alerts"));
      const items: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (["event", "exam", "assignment"].includes(data.type) && data.scheduledAt) {
          items.push({
            ...data,
            id: doc.id,
            scheduledAt: data.scheduledAt.toDate ? data.scheduledAt.toDate() : new Date(data.scheduledAt),
          });
        }
      });
      // Sort by date ascending
      items.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
      setCalendarItems(items);
    };
    fetchCalendarItems();
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
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      setTimetableFile(file);
    }
  };

  const handleUpload = async () => {
    if (!timetableFile) return;
    
    setIsUploading(true);
    try {
      // In a real app, you would upload to Firebase Storage
      // For demo, we'll create a fake URL and simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fakeUrl = URL.createObjectURL(timetableFile);
      setTimetableUrl(fakeUrl);
      setTimetableFile(null);
      
      toast({
        title: "Timetable uploaded",
        description: "Your timetable has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload your timetable",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setTimetableUrl("");
    setTimetableFile(null);
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
                  Supported formats: JPG, PNG, GIF (Max 5MB)
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

        {/* Upcoming Events/Alerts Section */}
        {calendarItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Events & Alerts
              </CardTitle>
              <CardDescription>
                These are events, exams, and assignments scheduled by your lecturers/admins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {calendarItems.map(item => (
                  <li key={item.id} className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ml-1 ${
                          item.type === "exam"
                            ? "bg-red-100 text-red-800"
                            : item.type === "assignment"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.scheduledAt ? item.scheduledAt.toLocaleString() : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
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
