import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  runTransaction, 
  updateDoc, 
  getDoc, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const rideService = {
  /**
   * Real-time subscription to incoming available ride requests for drivers.
   * Matches vehicleCategory if specified and status == 'requested' or 'searching'.
   * Provides real-time category counts and open rides list.
   */
  subscribeAvailableRides(vehicleCategory, onUpdate, onError) {
    const ridesRef = collection(db, 'rides');

    const handleSnapshot = (snapshot) => {
      let rawRides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Only open, unassigned rides with status 'requested' or 'searching'
      const openRides = rawRides.filter(r => !r.driverId && ['requested', 'searching'].includes(r.status));

      // Calculate category counts across all open rides in Palamaner
      const categoryCounts = {
        all: openRides.length,
        auto: openRides.filter(r => (r.vehicleCategory || '').toLowerCase() === 'auto').length,
        bike: openRides.filter(r => (r.vehicleCategory || '').toLowerCase() === 'bike').length,
        cab: openRides.filter(r => ['cab', 'sedan', 'suv', 'car'].includes((r.vehicleCategory || '').toLowerCase())).length
      };

      // Filter by category if specified and not 'all'
      let matchingRides = openRides;
      if (vehicleCategory && vehicleCategory !== 'all') {
        const target = vehicleCategory.toLowerCase().trim();
        matchingRides = openRides.filter(r => {
          const cat = (r.vehicleCategory || '').toLowerCase().trim();
          if (target === 'cab') return ['cab', 'sedan', 'suv', 'car'].includes(cat);
          return cat === target;
        });
      }

      // Sort newest first
      matchingRides.sort((a, b) => {
        const tA = a.timestamps?.requestedAt || a.createdAt || '';
        const tB = b.timestamps?.requestedAt || b.createdAt || '';
        return tB.localeCompare(tA);
      });

      openRides.sort((a, b) => {
        const tA = a.timestamps?.requestedAt || a.createdAt || '';
        const tB = b.timestamps?.requestedAt || b.createdAt || '';
        return tB.localeCompare(tA);
      });

      onUpdate(matchingRides, {
        allOpenRides: openRides,
        totalOpenCount: openRides.length,
        categoryCounts
      });
    };

    // Primary query: check status in ['requested', 'searching']
    const q1 = query(
      ridesRef,
      where('status', 'in', ['requested', 'searching']),
      limit(50)
    );

    let unsubscribe = null;
    try {
      unsubscribe = onSnapshot(
        q1,
        handleSnapshot,
        (err) => {
          console.warn("Primary available rides query error, trying status == 'requested' fallback:", err.message);
          // Fallback query if 'in' operator fails
          try {
            const q2 = query(
              ridesRef,
              where('status', '==', 'requested'),
              limit(50)
            );
            unsubscribe = onSnapshot(
              q2,
              handleSnapshot,
              (fallbackErr) => {
                console.error("Fallback available rides query error:", fallbackErr);
                if (onError) onError(fallbackErr);
              }
            );
          } catch (e2) {
            if (onError) onError(e2);
          }
        }
      );
    } catch (err) {
      console.error("Error setting up ride listener:", err);
      if (onError) onError(err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  },

  /**
   * Real-time listener for the driver's currently active ride.
   */
  subscribeActiveRide(rideId, onUpdate, onError) {
    if (!rideId) {
      onUpdate(null);
      return () => {};
    }

    const rideRef = doc(db, 'rides', rideId);
    return onSnapshot(
      rideRef,
      (snap) => {
        if (!snap.exists()) {
          onUpdate(null);
        } else {
          onUpdate({ id: snap.id, ...snap.data() });
        }
      },
      (error) => {
        console.error(`Error listening to active ride ${rideId}:`, error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * ATOMIC RIDE ACCEPTANCE
   * Guarantees that only ONE driver can accept a given ride request.
   * Prevents race conditions and double bookings through Firestore transactions.
   */
  async acceptRide(rideId, driver) {
    if (!rideId) throw new Error("Ride ID is required.");
    if (!driver || !driver.uid) throw new Error("Driver credentials are required.");
    if (driver.approvalStatus !== 'approved') {
      throw new Error("Only admin-approved drivers are eligible to accept ride requests.");
    }

    const rideRef = doc(db, 'rides', rideId);
    const driverRef = doc(db, 'drivers', driver.uid);

    return await runTransaction(db, async (transaction) => {
      // 1. Check Driver state
      const driverDoc = await transaction.get(driverRef);
      if (!driverDoc.exists()) {
        throw new Error("Driver account record not found.");
      }
      const driverData = driverDoc.data();
      if (driverData.activeRideId) {
        throw new Error("You already have an active ride in progress. Complete it first.");
      }
      if (driverData.approvalStatus !== 'approved') {
        throw new Error("Your driver account is not in approved status.");
      }

      // 2. Read Ride state
      const rideDoc = await transaction.get(rideRef);
      if (!rideDoc.exists()) {
        throw new Error("Ride request no longer exists or was removed.");
      }

      const rideData = rideDoc.data();

      // 3. Verify ride is still available
      if (rideData.driverId && rideData.driverId !== driver.uid) {
        throw new Error("This ride has already been accepted by another driver.");
      }

      if (!['requested', 'searching'].includes(rideData.status)) {
        throw new Error(`Ride is no longer available (current status: ${rideData.status}).`);
      }

      const nowIso = new Date().toISOString();

      // 4. Atomically assign ride to this driver
      transaction.update(rideRef, {
        status: 'driver_assigned',
        driverId: driver.uid,
        driverName: driver.fullName || 'Partner Driver',
        driverPhone: driver.phoneNumber || '',
        driverPhotoUrl: driver.photoUrl || driver.profileImageUrl || '',
        vehicleCategory: driver.vehicleCategory || rideData.vehicleCategory || 'auto',
        vehicleDetails: {
          plateNumber: driver.vehicleDetails?.plateNumber || '',
          makeModel: driver.vehicleDetails?.makeModel || '',
          color: driver.vehicleDetails?.color || ''
        },
        'timestamps.assignedAt': nowIso,
        updatedAt: nowIso
      });

      // 5. Update driver document with activeRideId
      transaction.update(driverRef, {
        activeRideId: rideId,
        updatedAt: nowIso
      });

      return {
        rideId,
        status: 'driver_assigned',
        assignedAt: nowIso
      };
    });
  },

  /**
   * Transition: Driver Arriving at Pickup
   */
  async markDriverArriving(rideId, driverUid) {
    const rideRef = doc(db, 'rides', rideId);
    const snap = await getDoc(rideRef);
    if (!snap.exists()) throw new Error("Ride not found.");
    
    const ride = snap.data();
    if (ride.driverId !== driverUid) {
      throw new Error("Unauthorized: You are not assigned to this ride.");
    }
    if (ride.status !== 'driver_assigned') {
      throw new Error(`Cannot transition to arriving from status '${ride.status}'.`);
    }

    const nowIso = new Date().toISOString();
    await updateDoc(rideRef, {
      status: 'driver_arriving',
      'timestamps.arrivingAt': nowIso,
      updatedAt: nowIso
    });
  },

  /**
   * Transition: Trip Started (Passenger boarded)
   */
  async startTrip(rideId, driverUid) {
    const rideRef = doc(db, 'rides', rideId);
    const snap = await getDoc(rideRef);
    if (!snap.exists()) throw new Error("Ride not found.");
    
    const ride = snap.data();
    if (ride.driverId !== driverUid) {
      throw new Error("Unauthorized: You are not assigned to this ride.");
    }
    if (!['driver_assigned', 'driver_arriving'].includes(ride.status)) {
      throw new Error(`Cannot start trip from status '${ride.status}'.`);
    }

    const nowIso = new Date().toISOString();
    await updateDoc(rideRef, {
      status: 'ride_started',
      'timestamps.startedAt': nowIso,
      updatedAt: nowIso
    });
  },

  /**
   * Transition: Trip Completed (Arrived at destination)
   * Calculates actual earnings and clears activeRideId on driver document.
   */
  async completeTrip(rideId, driverUid) {
    const rideRef = doc(db, 'rides', rideId);
    const driverRef = doc(db, 'drivers', driverUid);

    return await runTransaction(db, async (transaction) => {
      const rideDoc = await transaction.get(rideRef);
      if (!rideDoc.exists()) throw new Error("Ride not found.");
      
      const ride = rideDoc.data();
      if (ride.driverId !== driverUid) {
        throw new Error("Unauthorized: You are not assigned to this ride.");
      }
      if (ride.status !== 'ride_started') {
        throw new Error("Cannot complete a trip that has not been started.");
      }

      const totalFare = Number(ride.fare?.totalFare || 0);
      const commission = Number(ride.fare?.platformCommission || 0);
      const driverEarnings = Number(ride.fare?.driverEarnings || Math.max(0, totalFare - commission));

      const nowIso = new Date().toISOString();

      transaction.update(rideRef, {
        status: 'completed',
        paymentStatus: 'paid',
        'fare.totalFare': totalFare,
        'fare.platformCommission': commission,
        'fare.driverEarnings': driverEarnings,
        'timestamps.completedAt': nowIso,
        updatedAt: nowIso
      });

      // Clear activeRideId on driver
      transaction.update(driverRef, {
        activeRideId: null,
        updatedAt: nowIso
      });

      return {
        rideId,
        status: 'completed',
        driverEarnings,
        completedAt: nowIso
      };
    });
  },

  /**
   * Transition: Cancel Trip
   * Can be initiated by driver with valid reason before completion.
   */
  async cancelTripByDriver(rideId, driverUid, reason = 'Cancelled by driver') {
    const rideRef = doc(db, 'rides', rideId);
    const driverRef = doc(db, 'drivers', driverUid);

    return await runTransaction(db, async (transaction) => {
      const rideDoc = await transaction.get(rideRef);
      if (!rideDoc.exists()) throw new Error("Ride not found.");
      
      const ride = rideDoc.data();
      if (ride.driverId !== driverUid) {
        throw new Error("Unauthorized: You are not assigned to this ride.");
      }
      if (['completed', 'cancelled'].includes(ride.status)) {
        throw new Error(`Cannot cancel a ride that is already ${ride.status}.`);
      }

      const nowIso = new Date().toISOString();

      transaction.update(rideRef, {
        status: 'cancelled',
        cancelledBy: 'driver',
        cancellationReason: reason,
        'timestamps.cancelledAt': nowIso,
        updatedAt: nowIso
      });

      transaction.update(driverRef, {
        activeRideId: null,
        updatedAt: nowIso
      });

      return { rideId, status: 'cancelled' };
    });
  },

  /**
   * Fetch Driver's Ride History
   */
  async getDriverRideHistory(driverUid, limitCount = 50) {
    if (!driverUid) return [];
    try {
      const ridesRef = collection(db, 'rides');
      const q = query(
        ridesRef,
        where('driverId', '==', driverUid),
        orderBy('timestamps.requestedAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("Falling back to unindexed driver rides query:", err);
      try {
        const ridesRef = collection(db, 'rides');
        const fallbackQ = query(
          ridesRef,
          where('driverId', '==', driverUid),
          limit(limitCount)
        );
        const snap = await getDocs(fallbackQ);
        const rides = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return rides.sort((a, b) => {
          const tA = a.timestamps?.requestedAt || '';
          const tB = b.timestamps?.requestedAt || '';
          return tB.localeCompare(tA);
        });
      } catch (e2) {
        console.error("Failed to load driver rides:", e2);
        return [];
      }
    }
  },

  /**
   * Update live driver GPS location on active ride doc and driver doc
   */
  async updateDriverLiveLocation(driverUid, activeRideId, { lat, lng, heading = 0, speed = 0 }) {
    if (!driverUid) return;
    const nowIso = new Date().toISOString();

    // 1. Update driver profile location
    try {
      const driverRef = doc(db, 'drivers', driverUid);
      await updateDoc(driverRef, {
        location: {
          lat: Number(lat),
          lng: Number(lng),
          heading: Number(heading || 0),
          speed: Number(speed || 0),
          updatedAt: nowIso
        },
        updatedAt: nowIso
      });
    } catch (e) {
      console.warn("Could not update driver doc location:", e);
    }

    // 2. If active ride, update ride doc so customer sees real driver marker moving
    if (activeRideId) {
      try {
        const rideRef = doc(db, 'rides', activeRideId);
        await updateDoc(rideRef, {
          driverLocation: {
            lat: Number(lat),
            lng: Number(lng),
            heading: Number(heading || 0),
            updatedAt: nowIso
          },
          updatedAt: nowIso
        });
      } catch (e) {
        console.warn("Could not update active ride live location:", e);
      }
    }
  },

  /**
   * Toggle Driver Online / Offline status
   */
  async setDriverOnlineStatus(driverUid, isOnline) {
    if (!driverUid) return;
    const driverRef = doc(db, 'drivers', driverUid);
    const nowIso = new Date().toISOString();
    await updateDoc(driverRef, {
      isOnline: Boolean(isOnline),
      updatedAt: nowIso
    });
  }
};
