import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/useAuth';

interface Notification {
  id: string;
  alertId: string;
  title: string;
  description: string;
  type: string;
  moduleId: string;
  moduleName: string;
  createdAt: Date;
  read: boolean;
}

export function useNotifications() {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userData.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications: Notification[] = [];
      let unreadCounter = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const notification: Notification = {
          id: doc.id,
          alertId: data.alertId,
          title: data.title,
          description: data.description,
          type: data.type,
          moduleId: data.moduleId,
          moduleName: data.moduleName,
          createdAt: data.createdAt?.toDate() || new Date(),
          read: data.read || false
        };

        fetchedNotifications.push(notification);
        
        if (!notification.read) {
          unreadCounter++;
        }
      });

      setNotifications(fetchedNotifications);
      setUnreadCount(unreadCounter);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification =>
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
}