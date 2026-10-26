import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { auditService } from './auditService';
import type { UserProfile, AccountStatus } from '@/types';

export const customerService = {
  subscribeCustomers(
    onUpdate: (customers: UserProfile[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs
          .map((d) => ({
            uid: d.id,
            ...d.data(),
          }))
          .filter((u: any) => u.role !== 'driver') as UserProfile[];
        onUpdate(users);
      },
      (error) => {
        console.error('Error in customers subscription:', error);
        onError(error);
      }
    );
  },

  async getCustomers(): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((d) => ({
          uid: d.id,
          ...d.data(),
        }))
        .filter((u: any) => u.role !== 'driver') as UserProfile[];
    } catch (error) {
      console.warn('Error fetching customers:', error);
      return [];
    }
  },

  async getCustomerById(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { uid: snap.id, ...snap.data() } as UserProfile;
  },

  async getCustomerRides(customerId: string) {
    try {
      const q = query(
        collection(db, 'rides'),
        where('customerId', '==', customerId),
        orderBy('timestamps.requestedAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
    } catch (err) {
      console.warn(`Error fetching rides for customer ${customerId}:`, err);
      // Fallback query without orderBy in case composite index is not deployed yet
      try {
        const qFallback = query(
          collection(db, 'rides'),
          where('customerId', '==', customerId),
          limit(50)
        );
        const fallbackSnap = await getDocs(qFallback);
        return fallbackSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      } catch (e) {
        console.error('Fallback query also failed:', e);
        return [];
      }
    }
  },

  async getCustomerComplaints(customerId: string) {
    try {
      const q = query(
        collection(db, 'complaints'),
        where('raisedByUid', '==', customerId),
        limit(20)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
    } catch (err) {
      console.warn(`Error fetching complaints for customer ${customerId}:`, err);
      return [];
    }
  },

  async suspendCustomer(uid: string, reason: string, adminUser: { uid: string; email: string }) {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      status: 'suspended' as AccountStatus,
      suspensionReason: reason,
      updatedAt: new Date().toISOString(),
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'SUSPEND_CUSTOMER',
      category: 'customer',
      targetId: uid,
      targetType: 'user',
      reason,
      details: { status: 'suspended', suspensionReason: reason },
    });
  },

  async reactivateCustomer(uid: string, adminUser: { uid: string; email: string }) {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      status: 'active' as AccountStatus,
      suspensionReason: null,
      updatedAt: new Date().toISOString(),
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'REACTIVATE_CUSTOMER',
      category: 'customer',
      targetId: uid,
      targetType: 'user',
      details: { status: 'active' },
    });
  },
};

