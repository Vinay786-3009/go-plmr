import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { rideService } from '../services/rideService';
import { PALAMANER_CONFIG } from '../firebase/config';

const RideContext = createContext(null);

export const RideProvider = ({ children }) => {
  const { user, driverProfile, approvalStatus } = useAuth();

  const [isOnline, setIsOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState([]);
  const [allOpenRides, setAllOpenRides] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({ all: 0, auto: 0, bike: 0, cab: 0 });
  const [categoryFilter, setCategoryFilter] = useState('all'); // Default 'all' so driver never misses customer bookings!
  const [rideQueryError, setRideQueryError] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(PALAMANER_CONFIG.center);
  const [gpsError, setGpsError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newRideAlert, setNewRideAlert] = useState(null);

  const watchIdRef = useRef(null);
  const lastLocationUpdateRef = useRef(0);
  const prevRideCountRef = useRef(0);

  // Synchronize local online state with driverProfile
  useEffect(() => {
    if (driverProfile) {
      setIsOnline(Boolean(driverProfile.isOnline));
    }
  }, [driverProfile?.isOnline]);

  // Listen to Active Ride if activeRideId exists on driverProfile
  useEffect(() => {
    if (!user || !driverProfile?.activeRideId) {
      setActiveRide(null);
      return;
    }

    const unsubscribe = rideService.subscribeActiveRide(
      driverProfile.activeRideId,
      (ride) => {
        setActiveRide(ride);
      },
      (err) => console.error("Active ride error:", err)
    );

    return () => unsubscribe();
  }, [user, driverProfile?.activeRideId]);

  // Listen to Available Rides when Online and Approved
  useEffect(() => {
    if (!user || approvalStatus !== 'approved' || !isOnline || activeRide) {
      setAvailableRides([]);
      setAllOpenRides([]);
      setCategoryCounts({ all: 0, auto: 0, bike: 0, cab: 0 });
      prevRideCountRef.current = 0;
      return;
    }

    setRideQueryError(null);
    const unsubscribe = rideService.subscribeAvailableRides(
      categoryFilter,
      (matchingRides, meta) => {
        setRideQueryError(null);
        setAvailableRides(matchingRides);
        if (meta) {
          setAllOpenRides(meta.allOpenRides || []);
          if (meta.categoryCounts) setCategoryCounts(meta.categoryCounts);
        }

        // Chime or alert if new rides appeared in matching category
        if (matchingRides.length > prevRideCountRef.current && matchingRides.length > 0) {
          const newest = matchingRides[0];
          setNewRideAlert(newest);
          playChime();
        }
        prevRideCountRef.current = matchingRides.length;
      },
      (err) => {
        console.error("Available rides error:", err);
        setRideQueryError(err.message || "Failed to load incoming ride requests.");
      }
    );

    return () => unsubscribe();
  }, [user, approvalStatus, isOnline, activeRide, categoryFilter]);

  // GPS Location Watcher: active when driver is online OR has an active ride
  useEffect(() => {
    const shouldTrack = Boolean(user && approvalStatus === 'approved' && (isOnline || activeRide));

    if (!shouldTrack) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setGpsError(null);
        const { latitude, longitude, heading, speed } = position.coords;
        const newCoords = {
          lat: latitude,
          lng: longitude,
          heading: heading || 0,
          speed: speed || 0
        };

        setCurrentLocation({ lat: latitude, lng: longitude });

        // Throttle Firestore updates to every 4 seconds to save battery and quota
        const now = Date.now();
        if (now - lastLocationUpdateRef.current >= 4000) {
          lastLocationUpdateRef.current = now;
          rideService.updateDriverLiveLocation(user.uid, activeRide?.id || null, newCoords);
        }
      },
      (err) => {
        console.warn("GPS Location error:", err.message);
        setGpsError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [user, approvalStatus, isOnline, activeRide?.id]);

  // Audio chime for ride notification using Web Audio API (no external sound file needed)
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn("Chime error:", e);
    }
  };

  // Actions
  const toggleOnline = async () => {
    if (approvalStatus !== 'approved') {
      throw new Error("You cannot go online until your account is approved by admin.");
    }
    setActionLoading(true);
    try {
      const nextState = !isOnline;
      await rideService.setDriverOnlineStatus(user.uid, nextState);
      setIsOnline(nextState);
    } finally {
      setActionLoading(false);
    }
  };

  const acceptRide = async (rideId) => {
    setActionLoading(true);
    try {
      const result = await rideService.acceptRide(rideId, driverProfile);
      setNewRideAlert(null);
      return result;
    } finally {
      setActionLoading(false);
    }
  };

  const markArriving = async () => {
    if (!activeRide) return;
    setActionLoading(true);
    try {
      await rideService.markDriverArriving(activeRide.id, user.uid);
    } finally {
      setActionLoading(false);
    }
  };

  const startTrip = async () => {
    if (!activeRide) return;
    setActionLoading(true);
    try {
      await rideService.startTrip(activeRide.id, user.uid);
    } finally {
      setActionLoading(false);
    }
  };

  const completeTrip = async () => {
    if (!activeRide) return;
    setActionLoading(true);
    try {
      const res = await rideService.completeTrip(activeRide.id, user.uid);
      return res;
    } finally {
      setActionLoading(false);
    }
  };

  const cancelTrip = async (reason) => {
    if (!activeRide) return;
    setActionLoading(true);
    try {
      await rideService.cancelTripByDriver(activeRide.id, user.uid, reason);
    } finally {
      setActionLoading(false);
    }
  };

  const value = {
    isOnline,
    toggleOnline,
    availableRides,
    allOpenRides,
    categoryCounts,
    categoryFilter,
    setCategoryFilter,
    rideQueryError,
    activeRide,
    currentLocation,
    gpsError,
    actionLoading,
    newRideAlert,
    setNewRideAlert,
    acceptRide,
    markArriving,
    startTrip,
    completeTrip,
    cancelTrip
  };

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error("useRide must be used within a RideProvider");
  }
  return context;
};
