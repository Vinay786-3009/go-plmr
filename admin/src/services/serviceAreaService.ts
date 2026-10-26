import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  limit,
} from 'firebase/firestore';
import { db, PALAMANER_COORDINATES } from './firebase/firebase';
import { auditService } from './auditService';
import type { ServiceAreaConfig } from '@/types';

export const serviceAreaService = {
  async getServiceAreaConfig(): Promise<ServiceAreaConfig> {
    try {
      const colRef = collection(db, 'serviceAreas');
      const q = query(colRef, limit(1));
      const snap = await getDocs(q);

      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as ServiceAreaConfig;
      }
    } catch (error) {
      console.warn('Error fetching service area configuration:', error);
    }

    // Default configuration for Palamaner, AP
    return {
      id: 'palamaner-main',
      name: 'Palamaner Urban & Rural Belt',
      centerLat: PALAMANER_COORDINATES.lat,
      centerLng: PALAMANER_COORDINATES.lng,
      radiusKm: PALAMANER_COORDINATES.defaultRadiusKm,
      isActive: true,
      stateBorderRestriction: {
        enabled: true,
        state: 'Andhra Pradesh',
      },
      blockedZones: [],
      updatedByUid: 'system',
      updatedByEmail: 'system@goplmr.com',
      updatedAt: new Date().toISOString(),
    };
  },

  async saveServiceAreaConfig(
    config: Omit<ServiceAreaConfig, 'updatedByUid' | 'updatedByEmail' | 'updatedAt'>,
    adminUser: { uid: string; email: string }
  ) {
    const docRef = doc(db, 'serviceAreas', config.id || 'palamaner-main');
    const now = new Date().toISOString();
    const dataToSave: ServiceAreaConfig = {
      ...config,
      id: config.id || 'palamaner-main',
      updatedByUid: adminUser.uid,
      updatedByEmail: adminUser.email,
      updatedAt: now,
    };

    await setDoc(docRef, dataToSave, { merge: true });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'UPDATE_SERVICE_AREA_SETTINGS',
      category: 'service_area',
      targetId: dataToSave.id,
      targetType: 'serviceArea',
      details: dataToSave,
    });

    return dataToSave;
  },
};
