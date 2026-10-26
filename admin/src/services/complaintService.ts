import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  arrayUnion,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { auditService } from './auditService';
import type { ComplaintRecord, ComplaintStatus } from '@/types';

export const complaintService = {
  subscribeComplaints(
    onUpdate: (complaints: ComplaintRecord[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const colRef = collection(db, 'complaints');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const complaints = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ComplaintRecord[];
        onUpdate(complaints);
      },
      (error) => {
        console.error('Error in complaints subscription:', error);
        onError(error);
      }
    );
  },

  async getComplaints(): Promise<ComplaintRecord[]> {
    try {
      const colRef = collection(db, 'complaints');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ComplaintRecord[];
    } catch (error) {
      console.warn('Error fetching complaints:', error);
      return [];
    }
  },

  async getComplaintById(id: string): Promise<ComplaintRecord | null> {
    const docRef = doc(db, 'complaints', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ComplaintRecord;
  },

  async updateComplaintStatus(
    id: string,
    params: {
      status: ComplaintStatus;
      resolutionNotes?: string;
      refundAmount?: number;
    },
    adminUser: { uid: string; email: string }
  ) {
    const docRef = doc(db, 'complaints', id);
    const now = new Date().toISOString();
    await updateDoc(docRef, {
      status: params.status,
      resolutionNotes: params.resolutionNotes || null,
      refundAmount: params.refundAmount || 0,
      resolvedAt: params.status === 'resolved' || params.status === 'rejected' ? now : null,
      updatedAt: now,
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'UPDATE_COMPLAINT_STATUS',
      category: 'complaint',
      targetId: id,
      targetType: 'complaint',
      details: params,
    });
  },

  async addInternalNote(
    id: string,
    noteText: string,
    adminUser: { uid: string; email: string }
  ) {
    const docRef = doc(db, 'complaints', id);
    const noteObj = {
      id: Math.random().toString(36).substring(2, 9),
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      note: noteText,
      createdAt: new Date().toISOString(),
    };

    await updateDoc(docRef, {
      internalNotes: arrayUnion(noteObj),
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'ADD_COMPLAINT_INTERNAL_NOTE',
      category: 'complaint',
      targetId: id,
      targetType: 'complaint',
      details: { note: noteText },
    });
  },

  async assignComplaint(
    id: string,
    assignee: { uid: string; email: string },
    adminUser: { uid: string; email: string }
  ) {
    const docRef = doc(db, 'complaints', id);
    await updateDoc(docRef, {
      assignedToUid: assignee.uid,
      assignedToEmail: assignee.email,
      status: 'under_review',
      updatedAt: new Date().toISOString(),
    });

    await auditService.logAction({
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      action: 'ASSIGN_COMPLAINT',
      category: 'complaint',
      targetId: id,
      targetType: 'complaint',
      details: { assignedToUid: assignee.uid, assignedToEmail: assignee.email },
    });
  },
};
