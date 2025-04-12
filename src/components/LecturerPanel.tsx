
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bell, Calendar, Users, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const LecturerPanel = () => {
  const { toast } = useToast();
  
  const lecturerActions = [
    {
      title: "Post Alert",
      description: "Post an announcement or alert to students",
      icon: <Bell className="h-10 w-10 text-indigo-600" />,
      link: "/admin?tab=alerts",
      buttonText: "Create Alert",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=500&q=80",
      onClick: () => {
        toast({
          title: "Alert Creation",
          description: "Create and post announcements to your students",
        });
      }
    },
    {
      title: "Add Event",
      description: "Schedule tests, exams, or assignment deadlines",
      icon: <Calendar className="h-10 w-10 text-indigo-600" />,
      link: "/admin?tab=events",
      buttonText: "Add Event",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=500&q=80",
      onClick: () => {
        toast({
          title: "Event Creation",
          description: "Schedule academic events for your courses",
        });
      }
    },
    {
      title: "View All Alerts",
      description: "See all alerts and respond to student comments",
      icon: <Eye className="h-10 w-10 text-indigo-600" />,
      link: "/alerts",
      buttonText: "View Alerts",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=80",
      onClick: () => {
        toast({
          title: "View Alerts",
          description: "Access and respond to all posted alerts",
        });
      }
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Lecturer Panel</h2>
      <p className="text-muted-foreground">
        Manage your course alerts, events, and interact with students
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {lecturerActions.map((action, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow overflow-hidden">
            {action.image && (
              <div className="w-full h-32 overflow-hidden">
                <img 
                  src={action.image} 
                  alt={action.title} 
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" 
                />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-center mb-2">
                {action.icon}
              </div>
              <CardTitle className="text-center">{action.title}</CardTitle>
              <CardDescription className="text-center">{action.description}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button 
                asChild 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={action.onClick}
              >
                <Link to={action.link}>{action.buttonText}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LecturerPanel;
