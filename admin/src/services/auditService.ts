import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase/firebase';
import type { AuditLogRecord } from '@/types';

export const auditService = {
  async logAction(params: {
    adminUid: string;
    adminEmail: string;
    action: string;
    category: AuditLogRecord['category'];
    targetId?: string;
    targetType?: string;
    details?: Record<string, any>;
    reason?: string;
  }) {
    try {
      const logsRef = collection(db, 'auditLogs');
      await addDoc(logsRef, {
        adminUid: params.adminUid,
        adminEmail: params.adminEmail,
        action: params.action,
        category: params.category,
        targetId: params.targetId || null,
        targetType: params.targetType || null,
        details: params.details || null,
        reason: params.reason || null,
        timestamp: new Date().toISOString(),
        serverCreatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to record audit log:', error);
      // Non-blocking for UI, but logged to console
    }
  },

  async getRecentLogs(limitCount = 100): Promise<AuditLogRecord[]> {
    try {
      const logsRef = collection(db, 'auditLogs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditLogRecord[];
    } catch (error) {
      console.warn('Could not fetch audit logs (may require index or permissions):', error);
      return [];
    }
  },
};
