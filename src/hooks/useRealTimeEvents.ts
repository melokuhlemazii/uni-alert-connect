import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/useAuth';

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: string;
  moduleId: string;
  moduleName: string;
  imageUrl?: string;
  createdBy: string;
  createdByName: string;
}

export function useRealTimeEvents() {
  const { userData } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }

    const fetchSubscribedModules = async () => {
      try {
        const userSubsDoc = await import('firebase/firestore').then(({ getDoc, doc }) => 
          getDoc(doc(db, 'userSubscriptions', userData.uid))
        );
        
        let subscribedModuleIds: string[] = [];
        if (userSubsDoc.exists()) {
          const data = userSubsDoc.data();
          subscribedModuleIds = Object.keys(data.modules || {}).filter(mid => data.modules[mid]);
        }

        if (subscribedModuleIds.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }

        // Real-time listener for events
        const eventsRef = collection(db, 'events');
        const q = query(
          eventsRef,
          where('moduleId', 'in', subscribedModuleIds),
          orderBy('date', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedEvents: EventItem[] = [];
          const now = new Date();

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const eventDate = data.date?.toDate?.() || new Date(data.date);
            
            // Check if event should be automatically removed (1 day after)
            const oneDayAfter = new Date(eventDate);
            oneDayAfter.setDate(oneDayAfter.getDate() + 1);
            
            if (oneDayAfter <= now) {
              // Delete expired event
              deleteDoc(doc(db, 'events', docSnap.id)).catch(console.error);
              return;
            }

            fetchedEvents.push({
              id: docSnap.id,
              title: data.title,
              description: data.description,
              date: eventDate,
              type: data.type,
              moduleId: data.moduleId,
              moduleName: data.moduleName,
              imageUrl: data.imageUrl,
              createdBy: data.createdBy,
              createdByName: data.createdByName
            });
          });

          setEvents(fetchedEvents);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up real-time events:', error);
        setLoading(false);
      }
    };

    fetchSubscribedModules();
  }, [userData?.uid]);

  return { events, loading };
}