import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import type { AdminNotification } from '@/types';

export const notificationService = {
  subscribeNotifications(
    onUpdate: (notifications: AdminNotification[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const colRef = collection(db, 'notifications');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));

    return onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AdminNotification[];
        onUpdate(notifs);
      },
      (error) => {
        console.warn('Notifications subscription note (may be empty initially):', error);
        onError(error);
      }
    );
  },

  async getNotifications(): Promise<AdminNotification[]> {
    try {
      const colRef = collection(db, 'notifications');
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AdminNotification[];
    } catch (error) {
      console.warn('Error fetching notifications:', error);
      return [];
    }
  },

  async markAsRead(id: string) {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, { read: true });
  },

  async markAllAsRead(notifications: AdminNotification[]) {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach((n) => {
      const docRef = doc(db, 'notifications', n.id);
      batch.update(docRef, { read: true });
    });
    await batch.commit();
  },
};
