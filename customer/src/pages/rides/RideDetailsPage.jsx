import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { rideService } from '../../services/rideService';
import { MapView } from '../../components/map/MapView';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  User,
  Shield,
  LifeBuoy,
  ArrowLeft,
  Loader2,
  Share2,
} from 'lucide-react';

export const RideDetailsPage = () => {
  const { rideId } = useParams();
  const { user } = useAuth();
  const { success, error, warning } = useToast();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancelling, setCancelling] = useState(false);

  // Subscribe to real-time updates for this ride
  useEffect(() => {
    if (!rideId) return;

    setLoading(true);
    const unsubscribe = rideService.subscribeToRide(
      rideId,
      async (updatedRide) => {
        setRide(updatedRide);
        setLoading(false);

        // If driver assigned, load driver's genuine details
        if (updatedRide?.driverId) {
          try {
            const driverInfo = await rideService.getDriverDetails(updatedRide.driverId);
            setDriver(driverInfo);
          } catch (e) {
            console.warn('Could not load driver details:', e);
          }
        } else {
          setDriver(null);
        }
      },
      (err) => {
        console.error('Error in ride tracking subscription:', err);
        error('Failed to receive live ride updates.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [rideId]);

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading live ride details..." />;
  }

  if (!ride) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Ride Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          The requested ride could not be retrieved or has been removed.
        </p>
        <Link to="/" className="btn-primary mt-6 text-xs px-4 py-2.5">
          Return to Booking
        </Link>
      </div>
    );
  }

  // Determine status display details
  const getStatusBadge = (status) => {
    switch (status) {
      case 'requested':
      case 'searching':
        return {
          title: 'Searching for Driver',
          badgeClass: 'badge-warning',
          desc: 'Broadcasting to verified GO PLMR drivers in Palamaner...',
          step: 1,
        };
      case 'driver_assigned':
        return {
          title: 'Driver Assigned',
          badgeClass: 'badge-info',
          desc: 'A driver has accepted your trip request.',
          step: 2,
        };
      case 'driver_arriving':
        return {
          title: 'Driver Arriving',
          badgeClass: 'badge-info',
          desc: 'Driver is reaching your pickup point.',
          step: 3,
        };
      case 'ride_started':
        return {
          title: 'Trip in Progress',
          badgeClass: 'badge-success',
          desc: 'Your ride is in progress. Have a safe journey!',
          step: 4,
        };
      case 'completed':
        return {
          title: 'Trip Completed',
          badgeClass: 'badge-success',
          desc: 'Thank you for riding with GO PLMR!',
          step: 5,
        };
      case 'cancelled':
        return {
          title: 'Trip Cancelled',
          badgeClass: 'badge-danger',
          desc: ride.cancellationReason
            ? `Reason: ${ride.cancellationReason}`
            : 'This trip was cancelled.',
          step: 0,
        };
      default:
        return {
          title: status,
          badgeClass: 'badge-neutral',
          desc: 'Status updated',
          step: 1,
        };
    }
  };

  const statusInfo = getStatusBadge(ride.status);
  const isCancellable = ['requested', 'searching', 'driver_assigned', 'driver_arriving'].includes(ride.status);

  // Handle Cancel Ride Confirmation
  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await rideService.cancelRideByCustomer(ride.id, cancelReason);
      success('Ride cancelled successfully.');
      setShowCancelModal(false);
    } catch (err) {
      console.error('Cancellation failed:', err);
      error(err.message || 'Could not cancel ride.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="flex flex-col pb-24">
      {/* Top Navigation */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-30">
        <Link to="/rides" className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-800">Trip Tracking</span>
          <span className="text-[10px] text-slate-400 font-mono">ID: {ride.id.slice(0, 8)}</span>
        </div>
        <Link
          to={`/support?rideId=${ride.id}`}
          className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
          title="Trip Support"
        >
          <LifeBuoy className="w-5 h-5" />
        </Link>
      </div>

      {/* Map View */}
      <div className="px-4 pt-3">
        <MapView
          pickup={ride.pickup}
          dropoff={ride.dropoff}
          height="220px"
          interactive={false}
        />
      </div>

      {/* Live Status Card */}
      <div className="px-4 -mt-4 relative z-20">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90">
          <div className="flex items-center justify-between mb-2">
            <span className={`badge ${statusInfo.badgeClass}`}>
              {statusInfo.title}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {ride.vehicleCategory}
            </span>
          </div>

          <p className="text-sm font-bold text-slate-800 leading-snug">{statusInfo.desc}</p>

          {/* Stepper Progress Bar (when active) */}
          {ride.status !== 'cancelled' && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-0"></div>
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-500 -z-0"
                  style={{ width: `${Math.min(100, Math.max(0, (statusInfo.step - 1) * 25))}%` }}
                ></div>

                {['Requested', 'Assigned', 'Arriving', 'Started', 'Done'].map((st, idx) => {
                  const stepNum = idx + 1;
                  const isDone = statusInfo.step >= stepNum;
                  const isCurrent = statusInfo.step === stepNum;

                  return (
                    <div key={st} className="flex flex-col items-center z-10">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white border-2 border-slate-200 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`}
                      >
                        {isDone ? '✓' : stepNum}
                      </div>
                      <span className="text-[9px] font-medium text-slate-400 mt-1">{st}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assigned Driver Card (Only if real driver assigned) */}
      <div className="px-4 mt-3">
        {ride.driverId ? (
          <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-lg border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {driver?.fullName ? driver.fullName[0].toUpperCase() : 'D'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {driver?.fullName || ride.driverName || 'Assigned Driver'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="text-amber-400">★ {driver?.ratings?.average || '4.8'}</span>
                    <span>•</span>
                    <span>Verified Driver</span>
                  </div>
                </div>
              </div>

              {(driver?.phoneNumber || ride.driverPhone) && (
                <a
                  href={`tel:${driver?.phoneNumber || ride.driverPhone}`}
                  className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition-colors"
                  title="Call Driver"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>

            {driver?.vehicleDetails && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                <span>Vehicle: <b>{driver.vehicleDetails.makeModel || 'Auto/Cab'}</b></span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
                  {driver.vehicleDetails.plateNumber}
                </span>
              </div>
            )}
          </div>
        ) : ride.status === 'requested' || ride.status === 'searching' ? (
          <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">Waiting for Driver Acceptance</h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Nearby drivers in Palamaner have been notified of your pickup request.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Trip Information Card */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Trip Summary
          </h4>

          {/* Locations */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 flex-shrink-0"></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup</span>
                <span className="text-xs font-semibold text-slate-800">{ride.pickup?.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-600 mt-1 flex-shrink-0"></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dropoff</span>
                <span className="text-xs font-semibold text-slate-800">{ride.dropoff?.address}</span>
              </div>
            </div>
          </div>

          {/* Fare & Payment Breakdown */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</span>
              <span className="text-xs font-bold text-slate-800 uppercase">
                {ride.paymentMethod || 'cash'} ({ride.paymentStatus || 'pending'})
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Total</span>
              <span className="text-lg font-black text-emerald-700">₹{ride.fare?.totalFare || 0}</span>
            </div>
          </div>
        </div>

        {/* Cancellation Action (Only if cancellable) */}
        {isCancellable && (
          <div className="mt-4">
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn-danger w-full py-3.5 text-xs font-bold flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Trip Request</span>
            </button>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel This Ride?"
        message="Are you sure you want to cancel your ride request? This will notify the dispatch system in Palamaner."
        confirmText="Yes, Cancel Ride"
        cancelText="Keep Ride"
        confirmVariant="danger"
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
};
