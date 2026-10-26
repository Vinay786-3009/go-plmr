import {
  collection,
  doc,
  getDocs,
  updateDoc,
  increment,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { auditService } from './auditService';
import type { HelmetVerificationRecord, HelmetReviewStatus } from '@/types';

export const helmetService = {
  subscribeHelmetRecords(
    onUpdate: (records: HelmetVerificationRecord[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const colRef = collection(db, 'helmetVerifications');
    const q = query(colRef, orderBy('timestamp', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as HelmetVerificationRecord[];
        onUpdate(records);
      },
      (error) => {
        console.error('Error in helmet records subscription:', error);
        onError(error);
      }
    );
  },

  async getHelmetRecords(): Promise<HelmetVerificationRecord[]> {
    try {
      const colRef = collection(db, 'helmetVerifications');
      const q = query(colRef, orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as HelmetVerificationRecord[];
    } catch (error) {
      console.warn('Error fetching helmet records:', error);
      return [];
    }
  },

  async reviewRecord(
    recordId: string,
    params: {
      status: HelmetReviewStatus;
      reviewNotes?: string;
      addStrike: boolean;
      driverId: string;
    },
    adminUser: { uid: string; email: string }
  ) {
    const docRef = doc(db, 'helmetVerifications', recordId);
    const now = new Date().toISOString();

    await updateDoc(docRef, {
      status: params.status,
      reviewNotes: params.reviewNotes || null,
      strikeAdded: params.addStrike,
      reviewingAdminUid: adminUser.uid,
      reviewingAdminEmail: adminUser.email,
      reviewedAt: now,
    });

    // If a strike was applied, increment helmetStrikes in the driver's profile
    if (params.addStrike && params.driverId) {
      try {
        const driverRef = doc(db, 'drivers', params.driverId);
        await updateDoc(driverRef, {
          helmetStrikes: increment(1),
          updatedAt: now,
        });
      } catch (err) {
        console.warn('Could not increment driver helmet strikes:', err);
      }
    }

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'REVIEW_HELMET_COMPLIANCE',
      category: 'driver',
      targetId: recordId,
      targetType: 'helmetVerification',
      details: params,
    });
  },
};
