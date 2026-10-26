import React, { useState } from 'react';
import { useRide } from '../context/RideContext';
import { 
  Phone, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Car, 
  IndianRupee,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const ActiveRideCard = () => {
  const { 
    activeRide, 
    markArriving, 
    startTrip, 
    completeTrip, 
    cancelTrip, 
    actionLoading 
  } = useRide();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');
  const [error, setError] = useState(null);

  if (!activeRide) return null;

  const status = activeRide.status;
  const pickup = activeRide.pickup;
  const dropoff = activeRide.dropoff;
  const fare = activeRide.fare;

  const totalFare = Number(fare?.totalFare || 0);
  const driverEarnings = Number(fare?.driverEarnings || Math.max(0, totalFare - Number(fare?.platformCommission || 0)));

  // Target for navigation
  const nextTarget = status === 'ride_started' ? dropoff : pickup;
  const googleMapsUrl = nextTarget?.latitude && nextTarget?.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${nextTarget.latitude},${nextTarget.longitude}&travelmode=driving`
    : null;

  const handleAction = async (actionFn) => {
    setError(null);
    try {
      await actionFn();
    } catch (err) {
      setError(err.message || "Failed to update trip status.");
    }
  };

  const handleConfirmCancel = async () => {
    setError(null);
    try {
      await cancelTrip(cancelReason);
      setCancelModalOpen(false);
    } catch (err) {
      setError(err.message || "Could not cancel ride.");
    }
  };

  return (
    <div className="bg-charcoal-900 border border-brand-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
      {/* Active Ride Status Header */}
      <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse" />
          <span className="text-xs font-black tracking-wider text-brand-400 uppercase">
            {status === 'driver_assigned' && 'Assigned to Customer'}
            {status === 'driver_arriving' && 'Arriving at Pickup'}
            {status === 'ride_started' && 'Trip In Progress'}
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-charcoal-800 border border-charcoal-700 text-[11px] font-mono text-charcoal-300">
          ID: {activeRide.id?.slice(0, 8)}
        </span>
      </div>

      {/* Customer Info & Direct Call */}
      <div className="p-3.5 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/80 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-white">{activeRide.customerName || 'Passenger'}</p>
          <p className="text-[11px] text-charcoal-400">{activeRide.customerPhone || 'Contact available'}</p>
          <span className="inline-block mt-1 text-[10px] text-brand-400 font-semibold uppercase">
            {activeRide.vehicleCategory}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeRide.customerPhone && (
            <a
              href={`tel:${activeRide.customerPhone}`}
              className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
              title="Call Passenger"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}

          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-2xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 flex items-center justify-center shadow-lg shadow-brand-500/20 transition-transform active:scale-95"
              title="Turn-by-turn Navigation in Google Maps"
            >
              <Navigation className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Route & Progress Cards */}
      <div className="space-y-2 p-3.5 rounded-2xl bg-charcoal-800/50 border border-charcoal-800 text-xs">
        {/* Pickup */}
        <div className="flex items-start gap-2.5">
          <div className="mt-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Pickup Location</span>
            <p className="text-white font-medium truncate">{pickup?.address || 'Pickup point'}</p>
          </div>
        </div>

        <div className="ml-1 w-0.5 h-3 bg-charcoal-700 border-l border-dashed border-charcoal-600" />

        {/* Dropoff */}
        <div className="flex items-start gap-2.5">
          <div className="mt-1 w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold text-rose-400 uppercase">Destination</span>
            <p className="text-white font-medium truncate">{dropoff?.address || 'Destination point'}</p>
          </div>
        </div>
      </div>

      {/* Fare Banner */}
      <div className="px-4 py-2.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-between text-xs">
        <div>
          <span className="text-charcoal-400 text-[10px]">Your Net Payout:</span>
          <p className="text-base font-black text-white">₹{driverEarnings}</p>
        </div>
        <div className="text-right">
          <span className="text-charcoal-400 text-[10px]">Total Customer Fare:</span>
          <p className="font-bold text-brand-300">₹{totalFare}</p>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lifecycle Stage Buttons */}
      <div className="space-y-2 pt-1">
        {status === 'driver_assigned' && (
          <button
            onClick={() => handleAction(markArriving)}
            disabled={actionLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-black text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            <span>{actionLoading ? 'Updating...' : 'ARRIVED AT PICKUP LOCATION'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {status === 'driver_arriving' && (
          <button
            onClick={() => handleAction(startTrip)}
            disabled={actionLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <span>{actionLoading ? 'Starting Trip...' : 'PASSENGER ONBOARD — START TRIP'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {status === 'ride_started' && (
          <button
            onClick={() => handleAction(completeTrip)}
            disabled={actionLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionLoading ? 'Completing...' : 'ARRIVED AT DESTINATION — COMPLETE TRIP'}</span>
          </button>
        )}

        {/* Cancel button */}
        <button
          onClick={() => setCancelModalOpen(true)}
          disabled={actionLoading}
          className="w-full py-2.5 text-xs text-charcoal-400 hover:text-rose-400 transition-colors font-semibold"
        >
          Cancel Ride
        </button>
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm">Select Reason to Cancel</h3>
            <p className="text-xs text-charcoal-400">
              Only cancel if necessary. Frequent cancellations affect driver rating in Palamaner.
            </p>

            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white outline-none focus:border-brand-500"
            >
              <option value="Customer requested cancellation">Customer requested cancellation</option>
              <option value="Customer unreachable by phone">Customer unreachable by phone</option>
              <option value="Vehicle issue or breakdown">Vehicle issue or breakdown</option>
              <option value="Road blockage or extreme weather">Road blockage or extreme weather</option>
              <option value="Incorrect pickup location">Incorrect pickup location</option>
            </select>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-charcoal-800 text-charcoal-300 font-bold text-xs hover:bg-charcoal-700"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={actionLoading}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
