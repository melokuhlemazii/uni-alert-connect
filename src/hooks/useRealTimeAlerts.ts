import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/useAuth';

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  type: string;
  moduleId: string;
  moduleName: string;
  createdAt: Date;
  scheduledAt?: Date;
  imageUrl?: string;
  createdBy: string;
  createdByName: string;
}

export function useRealTimeAlerts() {
  const { userData } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }

    // Get user's subscribed modules first
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
          setAlerts([]);
          setLoading(false);
          return;
        }

        // Real-time listener for alerts
        const alertsRef = collection(db, 'alerts');
        const q = query(
          alertsRef,
          where('moduleId', 'in', subscribedModuleIds),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedAlerts: AlertItem[] = [];
          const now = new Date();

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const scheduledAt = data.scheduledAt?.toDate?.() || null;
            
            // Check if alert should be automatically removed
            if (scheduledAt && scheduledAt <= now) {
              // Delete expired alert
              deleteDoc(doc(db, 'alerts', docSnap.id)).catch(console.error);
              return;
            }

            fetchedAlerts.push({
              id: docSnap.id,
              title: data.title,
              description: data.description,
              type: data.type,
              moduleId: data.moduleId,
              moduleName: data.moduleName,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
              scheduledAt,
              imageUrl: data.imageUrl,
              createdBy: data.createdBy,
              createdByName: data.createdByName
            });
          });

          setAlerts(fetchedAlerts);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up real-time alerts:', error);
        setLoading(false);
      }
    };

    fetchSubscribedModules();
  }, [userData?.uid]);

  return { alerts, loading };
}