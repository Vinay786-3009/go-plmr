import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MapView } from '../../components/map/MapView';
import { LocationInputCard } from '../../components/booking/LocationInputCard';
import { RideSelectionBottomSheet } from '../../components/booking/RideSelectionBottomSheet';
import { PaymentMethodsModal } from '../../components/booking/PaymentMethodsModal';
import { ActiveRideBanner } from '../../components/booking/ActiveRideBanner';
import { rideService } from '../../services/rideService';
import { fareService } from '../../services/fareService';
import { geocodingService } from '../../services/geocodingService';
import { placesService } from '../../services/placesService';
import { Navigation, Loader2 } from 'lucide-react';

export const Home = () => {
  const { user, profile, emailVerified } = useAuth();
  const { success, error, warning, info } = useToast();
  const navigate = useNavigate();

  // Location States
  const [pickup, setPickup] = useState(geocodingService.getDefaultPickup());
  const [dropoff, setDropoff] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Booking & Fares
  const [selectedCategory, setSelectedCategory] = useState('bike');
  const [activeFares, setActiveFares] = useState({});
  const [calculatedFares, setCalculatedFares] = useState({});
  const [tripDistanceKm, setTripDistanceKm] = useState(1.2);
  const [tripDurationMins, setTripDurationMins] = useState(5);

  // Payment Selection (Supported: 'cash' | 'upi')
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Active Ride and Saved Places
  const [activeRide, setActiveRide] = useState(null);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  // 1. Initial Load of Fares & Saved Places
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const fares = await fareService.getAllActiveFares();
        if (isMounted) setActiveFares(fares);

        if (user) {
          const places = await placesService.getSavedPlaces(user.uid);
          if (isMounted) setSavedPlaces(places);
        }
      } catch (err) {
        console.warn('Error loading initial data:', err);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Real-time active ride subscription (persists and recovers on refresh)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = rideService.subscribeActiveRide(
      user.uid,
      (ride) => {
        setActiveRide(ride);
      },
      (err) => {
        console.warn('Active ride listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 3. Distance & Fare Calculations from actual coordinates
  useEffect(() => {
    const dist = pickup?.latitude && dropoff?.latitude
      ? geocodingService.calculateDistanceKm(
          pickup.latitude,
          pickup.longitude,
          dropoff.latitude,
          dropoff.longitude
        )
      : 1.2;

    setTripDistanceKm(dist);

    const duration = geocodingService.estimateDurationMinutes(dist, selectedCategory);
    setTripDurationMins(duration);

    const computed = {};
    ['bike', 'auto', 'cab'].forEach((cat) => {
      const config = activeFares[cat];
      if (config) {
        computed[cat] = fareService.calculateFare(dist, duration, config);
      }
    });
    setCalculatedFares(computed);
  }, [pickup, dropoff, activeFares, selectedCategory]);

  // Request GPS Location (Rule #3: Current-location control)
  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      warning('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLocation({ latitude: lat, longitude: lng });

        const address = await geocodingService.reverseGeocode(lat, lng);
        setPickup({
          name: 'My GPS Location',
          address,
          latitude: lat,
          longitude: lng,
        });

        setGpsLoading(false);
        success('GPS location detected in Palamaner.');
      },
      (err) => {
        console.warn('GPS permission error:', err);
        setGpsLoading(false);
        info('Location access denied. You can select pickup manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Map Click to Set Location
  const handleMapClick = async ({ latitude, longitude }) => {
    const address = await geocodingService.reverseGeocode(latitude, longitude);
    if (!dropoff) {
      setDropoff({
        name: 'Selected Pin Drop',
        address,
        latitude,
        longitude,
      });
      info('Destination pinned on map.');
    } else {
      setPickup({
        name: 'Selected Pin Drop',
        address,
        latitude,
        longitude,
      });
      info('Pickup pinned on map.');
    }
  };

  // Confirm and create real ride booking in Firestore
  const handleRequestRide = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!emailVerified) {
      warning('Please verify your email address before booking.');
      navigate('/verify-email');
      return;
    }

    if (!dropoff) {
      warning('Please enter a destination in Palamaner.');
      return;
    }

    setBookingLoading(true);

    try {
      const currentFare = calculatedFares[selectedCategory];

      const newRide = await rideService.createRideBooking({
        customerId: user.uid,
        customerName: profile?.fullName || user.displayName || 'GO PLMR Rider',
        customerPhone: profile?.phoneNumber || '',
        pickup,
        dropoff,
        vehicleCategory: selectedCategory,
        fare: currentFare,
        paymentMethod,
      });

      success('Ride requested! Searching for available drivers...');
      navigate(`/rides/${newRide.id}`);
    } catch (err) {
      console.error('Ride booking failed:', err);
      error(err.message || 'Could not place ride request.');
    } finally {
      setBookingLoading(false);
    }
  };

  const currentTotalAmount = calculatedFares[selectedCategory]?.totalFare || 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative pb-16">
      {/* Active Ride Banner if trip is currently ongoing */}
      {activeRide && (
        <div className="px-4 pt-3 relative z-30">
          <ActiveRideBanner ride={activeRide} />
        </div>
      )}

      {/* Main Interactive Map (Occupying large screen area) */}
      <div className="flex-1 w-full relative min-h-[380px]">
        <MapView
          pickup={pickup}
          dropoff={dropoff}
          currentLocation={currentLocation}
          onMapClick={handleMapClick}
          height="100%"
        />

        {/* Current-Location Control at Map's Upper Right (Rule #3) */}
        <button
          type="button"
          onClick={handleRequestGps}
          disabled={gpsLoading}
          aria-label="Locate Current Position"
          className="absolute top-4 right-4 z-20 w-11 h-11 rounded-full bg-white text-slate-800 shadow-md border border-slate-200/90 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
          title="Current GPS Location"
        >
          {gpsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          ) : (
            <Navigation className="w-5 h-5 text-emerald-600" />
          )}
        </button>

        {/* Floating Pickup & Dropoff Card (🟢 Pickup, 🔴 Dropoff) */}
        <div className="absolute top-4 left-3 right-16 z-20">
          <LocationInputCard
            pickup={pickup}
            dropoff={dropoff}
            onPickupChange={setPickup}
            onDropoffChange={setDropoff}
            savedPlaces={savedPlaces}
            onRequestGps={handleRequestGps}
            gpsLoading={gpsLoading}
          />
        </div>
      </div>

      {/* Ride Booking Bottom Sheet (Rule #4) */}
      <div className="relative z-30 -mt-2">
        <RideSelectionBottomSheet
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          fares={calculatedFares}
          distanceKm={tripDistanceKm}
          durationMinutes={tripDurationMins}
          paymentMethod={paymentMethod}
          onOpenPaymentModal={() => setShowPaymentModal(true)}
          onRequestRide={handleRequestRide}
          loading={bookingLoading}
          dropoffSelected={Boolean(dropoff)}
        />
      </div>

      {/* Payment Methods Modal (Supported: Cash & Driver UPI QR - Rule #9) */}
      <PaymentMethodsModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={currentTotalAmount}
        selectedPayment={paymentMethod}
        onSelectPayment={(m) => setPaymentMethod(m)}
      />
    </div>
  );
};
