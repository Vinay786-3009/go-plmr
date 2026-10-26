import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export const supportService = {
  /**
   * Submit a customer support ticket or ride issue
   * Stores document in exact 'complaints' collection expected by GO PLMR Admin
   */
  async submitTicket({
    raisedByUid,
    raisedByName,
    raisedByPhone = '',
    rideId = null,
    category = 'other',
    subject,
    description,
    priority = 'medium',
  }) {
    if (!raisedByUid || !subject || !description) {
      throw new Error('Please fill in all required complaint fields.');
    }

    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const complaintData = {
      ticketNumber,
      rideId: rideId || undefined,
      raisedByUid,
      raisedByName: raisedByName || 'Customer',
      raisedByPhone,
      raisedByRole: 'customer',
      category, // 'fare' | 'driver_behavior' | 'safety' | 'lost_item' | 'cancellation' | 'other'
      priority, // 'low' | 'medium' | 'high' | 'urgent'
      subject,
      description,
      status: 'open',
      internalNotes: [],
      createdAt: now,
    };

    const docRef = await addDoc(collection(db, 'complaints'), complaintData);
    return { id: docRef.id, ...complaintData };
  },

  /**
   * Get tickets submitted by this customer
   */
  async getCustomerTickets(customerId) {
    try {
      const q = query(
        collection(db, 'complaints'),
        where('raisedByUid', '==', customerId)
      );
      const snap = await getDocs(q);
      const tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      tickets.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return tickets;
    } catch (e) {
      console.warn('Failed to load customer tickets:', e);
      return [];
    }
  },
};
