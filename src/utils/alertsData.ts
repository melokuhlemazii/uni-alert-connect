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
export const demoAlerts: AlertItem[] = [];

// Shared upcoming events data
export const upcomingEventsData: EventItem[] = [];
