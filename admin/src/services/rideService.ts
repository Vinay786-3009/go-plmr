import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  limit,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { auditService } from './auditService';
import type { RideRecord, RideStatus, VehicleCategoryType } from '@/types';

export const rideService = {
  subscribeRides(
    filters: {
      status?: RideStatus | 'all';
      vehicleCategory?: VehicleCategoryType | 'all';
      limitCount?: number;
    },
    onUpdate: (rides: RideRecord[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const ridesRef = collection(db, 'rides');
    let q = query(ridesRef, orderBy('timestamps.requestedAt', 'desc'), limit(filters.limitCount || 100));

    if (filters.status && filters.status !== 'all') {
      q = query(ridesRef, where('status', '==', filters.status), orderBy('timestamps.requestedAt', 'desc'), limit(filters.limitCount || 100));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        let rides = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as RideRecord[];

        if (filters.vehicleCategory && filters.vehicleCategory !== 'all') {
          rides = rides.filter((r) => r.vehicleCategory === filters.vehicleCategory);
        }

        onUpdate(rides);
      },
      (error) => {
        console.error('Error in rides subscription:', error);
        onError(error);
      }
    );
  },

  async getRides(limitCount = 100): Promise<RideRecord[]> {
    try {
      const ridesRef = collection(db, 'rides');
      const q = query(ridesRef, orderBy('timestamps.requestedAt', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as RideRecord[];
    } catch (error) {
      console.warn('Error fetching rides:', error);
      return [];
    }
  },

  async getRideById(rideId: string): Promise<RideRecord | null> {
    const docRef = doc(db, 'rides', rideId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as RideRecord;
  },

  async cancelRideByAdmin(
    rideId: string,
    reason: string,
    adminUser: { uid: string; email: string }
  ) {
    const docRef = doc(db, 'rides', rideId);
    const now = new Date().toISOString();
    await updateDoc(docRef, {
      status: 'cancelled' as RideStatus,
      cancellationReason: reason,
      cancelledBy: 'admin',
      'timestamps.cancelledAt': now,
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'ADMIN_CANCEL_RIDE',
      category: 'ride',
      targetId: rideId,
      targetType: 'ride',
      reason,
      details: { status: 'cancelled', cancelledBy: 'admin', reason },
    });
  },
};
