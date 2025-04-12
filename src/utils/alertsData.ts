
export interface AlertItem {
  id: string;
  title: string;
  description: string;
  type: "general" | "test" | "exam" | "assignment";
  moduleId: string;
  moduleName: string;
  createdAt: Date;
  imageUrl?: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: Date;
  type: "test" | "exam" | "assignment";
  moduleId: string;
  moduleName: string;
  imageUrl?: string;
}

// Shared alert data across components
export const demoAlerts: AlertItem[] = [
  {
    id: "1",
    title: "Venue Change for Tomorrow's Lecture",
    description: "The lecture has been moved to Room A305",
    type: "general",
    moduleId: "csy301",
    moduleName: "Software Development",
    createdAt: new Date(2025, 3, 10), // April 10, 2025
    imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "2",
    title: "Assignment Deadline Extended",
    description: "The deadline for the project submission has been extended to next Friday",
    type: "assignment",
    moduleId: "isy201",
    moduleName: "Information Systems",
    createdAt: new Date(2025, 3, 9), // April 9, 2025
    imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "3",
    title: "Test Date Announced",
    description: "The mid-term test will be held on May 5th",
    type: "test",
    moduleId: "csy202",
    moduleName: "Databases",
    createdAt: new Date(2025, 3, 8), // April 8, 2025
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "4",
    title: "Exam Schedule Update",
    description: "The final exam will now be held in the main hall",
    type: "exam",
    moduleId: "ce101",
    moduleName: "Introduction to Civil Engineering",
    createdAt: new Date(2025, 3, 7), // April 7, 2025
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "5",
    title: "Additional Study Resources",
    description: "New study materials have been uploaded to the learning platform",
    type: "general",
    moduleId: "ee201",
    moduleName: "Circuit Theory",
    createdAt: new Date(2025, 3, 6), // April 6, 2025
    imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=500&q=80"
  }
];

// Shared upcoming events data
export const upcomingEventsData: EventItem[] = [
  {
    id: "1",
    title: "Midterm Exam",
    date: new Date(2025, 4, 15), // May 15, 2025
    type: "exam",
    moduleId: "CSY301",
    moduleName: "Computer Science 301",
    imageUrl: "https://images.unsplash.com/photo-1486718448742-163732cd1544?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "2",
    title: "Assignment Due",
    date: new Date(2025, 4, 20), // May 20, 2025
    type: "assignment",
    moduleId: "ISY201",
    moduleName: "Information Systems 201",
    imageUrl: "https://images.unsplash.com/photo-1460574283810-2aab119d8511?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "3",
    title: "Weekly Test",
    date: new Date(2025, 4, 25), // May 25, 2025
    type: "test",
    moduleId: "MTH102",
    moduleName: "Mathematics 102",
    imageUrl: "https://images.unsplash.com/photo-1473091534298-04dcbce3278c?auto=format&fit=crop&w=500&q=80"
  }
];
