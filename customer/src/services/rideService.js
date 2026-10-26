import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

export const rideService = {
  /**
   * Create a new ride booking
   * Stores document in exact 'rides' collection expected by GO PLMR Admin
   */
  async createRideBooking({
    customerId,
    customerName,
    customerPhone,
    pickup,
    dropoff,
    vehicleCategory,
    fare,
    paymentMethod = 'cash',
  }) {
    if (!customerId) throw new Error('Customer ID is required.');
    if (!pickup?.address || !dropoff?.address) throw new Error('Pickup and dropoff locations are required.');

    const now = new Date().toISOString();
    const ridesRef = collection(db, 'rides');

    const rideData = {
      customerId,
      customerName: customerName || 'GO PLMR Rider',
      customerPhone: customerPhone || '',
      vehicleCategory, // 'bike' | 'auto' | 'cab'
      status: 'requested', // Initial state
      pickup: {
        address: pickup.address,
        latitude: Number(pickup.latitude),
        longitude: Number(pickup.longitude),
      },
      dropoff: {
        address: dropoff.address,
        latitude: Number(dropoff.latitude),
        longitude: Number(dropoff.longitude),
      },
      fare: {
        baseFare: fare.baseFare,
        distanceFare: fare.distanceFare,
        timeFare: fare.timeFare || 0,
        bookingFee: fare.bookingFee,
        platformCommission: fare.platformCommission,
        driverEarnings: fare.driverEarnings,
        totalFare: fare.totalFare,
        distanceKm: fare.distanceKm,
        durationMinutes: fare.durationMinutes,
      },
      paymentMethod, // 'cash' | 'upi'
      paymentStatus: 'pending',
      otpVerified: false,
      timestamps: {
        requestedAt: now,
      },
    };

    const docRef = await addDoc(ridesRef, rideData);

    // Increment customer ride count in user profile
    try {
      const userRef = doc(db, 'users', customerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentCount = userSnap.data().totalRidesAsCustomer || 0;
        await updateDoc(userRef, {
          totalRidesAsCustomer: currentCount + 1,
          updatedAt: now,
        });
      }
    } catch (e) {
      console.warn('Could not increment customer total rides counter:', e);
    }

    return { id: docRef.id, ...rideData };
  },

  /**
   * Subscribe to real-time updates for a single ride
   */
  subscribeToRide(rideId, onUpdate, onError) {
    if (!rideId) return () => {};
    const docRef = doc(db, 'rides', rideId);

    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate({ id: snap.id, ...snap.data() });
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.error('Error listening to ride updates:', error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Subscribe to customer's active ride (real-time listener)
   * Recovers active ride on reload/reopen
   */
  subscribeActiveRide(customerId, onUpdate, onError) {
    if (!customerId) return () => {};
    const ridesRef = collection(db, 'rides');

    // Query active ride states
    const activeStatuses = ['requested', 'searching', 'driver_assigned', 'driver_arriving', 'ride_started'];
    const q = query(
      ridesRef,
      where('customerId', '==', customerId),
      where('status', 'in', activeStatuses),
      limit(1)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          onUpdate({ id: docSnap.id, ...docSnap.data() });
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.warn('Error in active ride subscription:', error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Get single ride by ID
   */
  async getRideById(rideId) {
    const docRef = doc(db, 'rides', rideId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  /**
   * Get customer's past ride history
   */
  async getCustomerRideHistory(customerId, limitCount = 30) {
    try {
      const ridesRef = collection(db, 'rides');
      const q = query(
        ridesRef,
        where('customerId', '==', customerId),
        orderBy('timestamps.requestedAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn('Ride history indexed query fallback:', err);
      // Fallback query without orderBy in case composite index is still building in Firestore
      try {
        const qFallback = query(
          collection(db, 'rides'),
          where('customerId', '==', customerId),
          limit(limitCount)
        );
        const snapFallback = await getDocs(qFallback);
        const rides = snapFallback.docs.map((d) => ({ id: d.id, ...d.data() }));
        rides.sort((a, b) => {
          const tA = a.timestamps?.requestedAt || '';
          const tB = b.timestamps?.requestedAt || '';
          return tB.localeCompare(tA);
        });
        return rides;
      } catch (fallbackErr) {
        console.error('Failed to fetch ride history:', fallbackErr);
        return [];
      }
    }
  },

  /**
   * Allow customer to cancel a ride
   * Permitted only before trip has started ('requested', 'searching', or 'driver_assigned')
   */
  async cancelRideByCustomer(rideId, reason = 'Cancelled by rider') {
    const docRef = doc(db, 'rides', rideId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      throw new Error('Ride not found.');
    }

    const currentData = snap.data();
    const cancellableStatuses = ['requested', 'searching', 'driver_assigned', 'driver_arriving'];

    if (!cancellableStatuses.includes(currentData.status)) {
      throw new Error(`Cannot cancel ride in '${currentData.status}' status. Trip is already active or finished.`);
    }

    const now = new Date().toISOString();
    await updateDoc(docRef, {
      status: 'cancelled',
      cancelledBy: 'customer',
      cancellationReason: reason,
      'timestamps.cancelledAt': now,
    });

    return { id: rideId, status: 'cancelled' };
  },

  /**
   * Fetch assigned driver details (from 'drivers' collection)
   */
  async getDriverDetails(driverId) {
    if (!driverId) return null;
    try {
      const snap = await getDoc(doc(db, 'drivers', driverId));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        id: snap.id,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        vehicleDetails: data.vehicleDetails,
        ratings: data.ratings || { average: 4.8, count: 12 },
        profileImageUrl: data.profileImageUrl,
      };
    } catch (e) {
      console.warn('Failed to load driver details:', e);
      return null;
    }
  },
};
