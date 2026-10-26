import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  where,
  limit,
  increment,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { auditService } from './auditService';
import type { DriverProfile, DriverApprovalStatus, DriverViolationRecord } from '@/types';

export const driverService = {
  // Realtime subscription to drivers
  subscribeDrivers(
    onUpdate: (drivers: DriverProfile[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const driversRef = collection(db, 'drivers');
    const q = query(driversRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const drivers = snapshot.docs.map((d) => ({
          id: d.id,
          uid: d.id,
          ...d.data(),
        })) as DriverProfile[];
        onUpdate(drivers);
      },
      (error) => {
        console.error('Error in drivers subscription:', error);
        onError(error);
      }
    );
  },

  // One-time fetch
  async getDrivers(): Promise<DriverProfile[]> {
    try {
      const driversRef = collection(db, 'drivers');
      const q = query(driversRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({
        id: d.id,
        uid: d.id,
        ...d.data(),
      })) as DriverProfile[];
    } catch (error) {
      console.warn('Error fetching drivers:', error);
      return [];
    }
  },

  async getDriverById(driverId: string): Promise<DriverProfile | null> {
    const docRef = doc(db, 'drivers', driverId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, uid: snap.id, ...snap.data() } as DriverProfile;
  },

  // Fetch all rides for a specific driver
  async getDriverRides(driverId: string) {
    try {
      const q = query(
        collection(db, 'rides'),
        where('driverId', '==', driverId),
        orderBy('timestamps.requestedAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
    } catch (err) {
      console.warn(`Error fetching rides for driver ${driverId}:`, err);
      try {
        const qFallback = query(
          collection(db, 'rides'),
          where('driverId', '==', driverId),
          limit(50)
        );
        const fallbackSnap = await getDocs(qFallback);
        return fallbackSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      } catch (e) {
        console.error('Fallback driver rides query failed:', e);
        return [];
      }
    }
  },

  // Fetch safety violations / strikes recorded for driver
  async getDriverViolations(driverId: string): Promise<DriverViolationRecord[]> {
    try {
      const q = query(
        collection(db, 'violations'),
        where('driverId', '==', driverId),
        limit(20)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as DriverViolationRecord[];
    } catch (err) {
      console.warn(`Error fetching violations for driver ${driverId}:`, err);
      return [];
    }
  },

  // Record a safety violation or strike against driver
  async recordDriverStrike(
    driverId: string,
    driverName: string,
    reason: string,
    adminUser: { uid: string; email: string }
  ) {
    const driverRef = doc(db, 'drivers', driverId);
    const now = new Date().toISOString();

    await updateDoc(driverRef, {
      helmetStrikes: increment(1),
      updatedAt: now,
    });

    // Add violation record
    await addDoc(collection(db, 'violations'), {
      driverId,
      driverName,
      reason,
      strikeCount: 1,
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      createdAt: now,
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'RECORD_DRIVER_STRIKE',
      category: 'driver',
      targetId: driverId,
      targetType: 'driver',
      reason,
      details: { strikeAdded: 1, reason },
    });
  },

  // Approve driver
  async approveDriver(driverId: string, adminUser: { uid: string; email: string }) {
    const docRef = doc(db, 'drivers', driverId);
    await updateDoc(docRef, {
      approvalStatus: 'approved' as DriverApprovalStatus,
      'documents.verifiedAt': new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'APPROVE_DRIVER',
      category: 'driver',
      targetId: driverId,
      targetType: 'driver',
      details: { approvalStatus: 'approved' },
    });
  },

  // Reject driver application
  async rejectDriver(driverId: string, reason: string, adminUser: { uid: string; email: string }) {
    const docRef = doc(db, 'drivers', driverId);
    await updateDoc(docRef, {
      approvalStatus: 'rejected' as DriverApprovalStatus,
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'REJECT_DRIVER',
      category: 'driver',
      targetId: driverId,
      targetType: 'driver',
      reason,
      details: { approvalStatus: 'rejected', rejectionReason: reason },
    });
  },

  // Suspend driver
  async suspendDriver(driverId: string, reason: string, adminUser: { uid: string; email: string }) {
    const docRef = doc(db, 'drivers', driverId);
    await updateDoc(docRef, {
      approvalStatus: 'suspended' as DriverApprovalStatus,
      suspensionReason: reason,
      isOnline: false,
      updatedAt: new Date().toISOString(),
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'SUSPEND_DRIVER',
      category: 'driver',
      targetId: driverId,
      targetType: 'driver',
      reason,
      details: { approvalStatus: 'suspended', suspensionReason: reason },
    });
  },

  // Reactivate driver
  async reactivateDriver(driverId: string, adminUser: { uid: string; email: string }) {
    const docRef = doc(db, 'drivers', driverId);
    await updateDoc(docRef, {
      approvalStatus: 'approved' as DriverApprovalStatus,
      suspensionReason: null,
      updatedAt: new Date().toISOString(),
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'REACTIVATE_DRIVER',
      category: 'driver',
      targetId: driverId,
      targetType: 'driver',
      details: { approvalStatus: 'approved' },
    });
  },
};

