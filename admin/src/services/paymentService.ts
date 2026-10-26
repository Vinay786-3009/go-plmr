import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  where,
  type Unsubscribe,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { auditService } from './auditService';
import type { DriverSettlement, RidePaymentRecord, VehicleCategoryType } from '@/types';

export const paymentService = {
  subscribeSettlements(
    onUpdate: (settlements: DriverSettlement[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const colRef = collection(db, 'settlements');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const settlements = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as DriverSettlement[];
        onUpdate(settlements);
      },
      (error) => {
        console.error('Error in settlements subscription:', error);
        onError(error);
      }
    );
  },

  async getSettlements(): Promise<DriverSettlement[]> {
    try {
      const colRef = collection(db, 'settlements');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as DriverSettlement[];
    } catch (error) {
      console.warn('Error fetching settlements:', error);
      return [];
    }
  },

  async markSettlementAsPaid(
    settlementId: string,
    params: {
      transactionReference: string;
      notes?: string;
    },
    adminUser: { uid: string; email: string }
  ) {
    const docRef = doc(db, 'settlements', settlementId);
    const now = new Date().toISOString();
    await updateDoc(docRef, {
      status: 'settled',
      settledAt: now,
      settledByUid: adminUser.uid,
      settledByEmail: adminUser.email,
      transactionReference: params.transactionReference,
      notes: params.notes || null,
      updatedAt: now,
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'SETTLE_DRIVER_PAYOUT',
      category: 'settlement',
      targetId: settlementId,
      targetType: 'settlement',
      details: {
        status: 'settled',
        transactionReference: params.transactionReference,
        notes: params.notes,
      },
    });
  },

  subscribeRidePayments(
    onUpdate: (payments: RidePaymentRecord[]) => void,
    onError: (error: Error) => void,
    maxCount: number = 100
  ): Unsubscribe {
    const colRef = collection(db, 'rides');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(maxCount));

    return onSnapshot(
      q,
      (snapshot) => {
        const list: RidePaymentRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const totalFare = Number(data.fare || data.finalFare || data.estimatedFare || 0);
          const platformCommission = Number(
            data.platformCommission ||
            data.fareBreakdown?.commission ||
            Math.round(totalFare * 0.15)
          );
          const driverEarnings = Number(
            data.driverEarnings ||
            Math.max(0, totalFare - platformCommission)
          );
          const rawMethod = String(data.paymentMethod || data.paymentMode || 'cash').toLowerCase();
          const paymentMethod = rawMethod.includes('upi') || rawMethod.includes('online') ? 'upi' : 'cash';
          const rawStatus = String(data.paymentStatus || (data.status === 'completed' ? 'completed' : 'pending')).toLowerCase();
          const paymentStatus = (rawStatus === 'completed' || rawStatus === 'paid')
            ? 'completed'
            : rawStatus === 'failed'
            ? 'failed'
            : 'pending';

          return {
            id: docSnap.id,
            rideId: docSnap.id,
            customerId: data.customerId || '',
            customerName: data.customerName || data.riderName || 'Customer',
            driverId: data.driverId || '',
            driverName: data.driverName || '—',
            vehicleCategory: (data.vehicleCategory || data.vehicleType || 'bike') as VehicleCategoryType,
            totalFare,
            platformCommission,
            driverEarnings,
            paymentMethod,
            paymentStatus,
            timestamp: data.completedAt || data.createdAt || new Date().toISOString(),
          };
        });
        onUpdate(list);
      },
      (error) => {
        console.error('Error subscribing to ride payments:', error);
        onError(error);
      }
    );
  },

  async getRidePayments(maxCount: number = 100): Promise<RidePaymentRecord[]> {
    try {
      const colRef = collection(db, 'rides');
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(maxCount));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => {
        const data = docSnap.data();
        const totalFare = Number(data.fare || data.finalFare || data.estimatedFare || 0);
        const platformCommission = Number(
          data.platformCommission ||
          data.fareBreakdown?.commission ||
          Math.round(totalFare * 0.15)
        );
        const driverEarnings = Number(
          data.driverEarnings ||
          Math.max(0, totalFare - platformCommission)
        );
        const rawMethod = String(data.paymentMethod || data.paymentMode || 'cash').toLowerCase();
        const paymentMethod = rawMethod.includes('upi') || rawMethod.includes('online') ? 'upi' : 'cash';
        const rawStatus = String(data.paymentStatus || (data.status === 'completed' ? 'completed' : 'pending')).toLowerCase();
        const paymentStatus = (rawStatus === 'completed' || rawStatus === 'paid')
          ? 'completed'
          : rawStatus === 'failed'
          ? 'failed'
          : 'pending';

        return {
          id: docSnap.id,
          rideId: docSnap.id,
          customerId: data.customerId || '',
          customerName: data.customerName || data.riderName || 'Customer',
          driverId: data.driverId || '',
          driverName: data.driverName || '—',
          vehicleCategory: (data.vehicleCategory || data.vehicleType || 'bike') as VehicleCategoryType,
          totalFare,
          platformCommission,
          driverEarnings,
          paymentMethod,
          paymentStatus,
          timestamp: data.completedAt || data.createdAt || new Date().toISOString(),
        };
      });
    } catch (error) {
      console.warn('Error fetching ride payments:', error);
      return [];
    }
  },
};

