import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { auditService } from './auditService';
import type { FareConfiguration, VehicleCategoryType } from '@/types';

export const fareService = {
  async getFareConfigurations(): Promise<FareConfiguration[]> {
    try {
      const colRef = collection(db, 'fareConfigurations');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FareConfiguration[];
    } catch (error) {
      console.warn('Error fetching fare configurations:', error);
      return [];
    }
  },

  async getActiveFare(vehicleCategory: VehicleCategoryType): Promise<FareConfiguration | null> {
    try {
      const colRef = collection(db, 'fareConfigurations');
      const q = query(
        colRef,
        where('vehicleCategory', '==', vehicleCategory),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as FareConfiguration;
    } catch (error) {
      console.warn(`Error fetching active fare for ${vehicleCategory}:`, error);
      return null;
    }
  },

  async saveNewFareConfiguration(
    fareData: Omit<FareConfiguration, 'id' | 'version' | 'createdAt' | 'updatedByUid' | 'updatedByEmail' | 'isActive'>,
    adminUser: { uid: string; email: string }
  ) {
    const colRef = collection(db, 'fareConfigurations');

    // Deactivate previous active configs for this vehicle category
    try {
      const activeQ = query(
        colRef,
        where('vehicleCategory', '==', fareData.vehicleCategory),
        where('isActive', '==', true)
      );
      const activeSnap = await getDocs(activeQ);
      for (const d of activeSnap.docs) {
        await updateDoc(doc(db, 'fareConfigurations', d.id), {
          isActive: false,
        });
      }
    } catch (err) {
      console.warn('Could not deactivate older fare configs:', err);
    }

    // Add new active version
    const newDoc = await addDoc(colRef, {
      ...fareData,
      isActive: true,
      version: Date.now(),
      updatedByUid: adminUser.uid,
      updatedByEmail: adminUser.email,
      createdAt: new Date().toISOString(),
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'UPDATE_FARE_CONFIGURATION',
      category: 'fare',
      targetId: newDoc.id,
      targetType: 'fareConfiguration',
      details: fareData,
    });

    return newDoc.id;
  },

  // Authoritative simulation helper
  calculateSimulatedFare(
    distanceKm: number,
    durationMinutes: number,
    config: {
      baseFare: number;
      minFare: number;
      perKmRate: number;
      perMinuteRate: number;
      bookingFee: number;
      platformCommissionPercent: number;
    }
  ) {
    const distanceFare = Math.max(0, distanceKm * config.perKmRate);
    const timeFare = Math.max(0, durationMinutes * config.perMinuteRate);
    const rawFare = config.baseFare + distanceFare + timeFare + config.bookingFee;
    const totalFare = Math.max(config.minFare, Math.round(rawFare));

    const platformCommission = Math.round(
      ((totalFare - config.bookingFee) * config.platformCommissionPercent) / 100 + config.bookingFee
    );
    const driverEarnings = Math.max(0, totalFare - platformCommission);

    return {
      baseFare: config.baseFare,
      distanceFare,
      timeFare,
      bookingFee: config.bookingFee,
      totalFare,
      platformCommission,
      driverEarnings,
    };
  },
};
