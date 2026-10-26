import React, { useState, useEffect } from 'react';
import { useRide } from '../context/RideContext';
import { 
  MapPin, 
  Navigation, 
  IndianRupee, 
  Clock, 
  Check, 
  X, 
  Car, 
  Bike, 
  AlertCircle 
} from 'lucide-react';

export const IncomingRideModal = ({ ride, onClose }) => {
  const { acceptRide, actionLoading } = useRide();
  const [timeLeft, setTimeLeft] = useState(30);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      onClose();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onClose]);

  if (!ride) return null;

  const totalFare = Number(ride.fare?.totalFare || 0);
  const driverEarnings = Number(ride.fare?.driverEarnings || Math.max(0, totalFare - Number(ride.fare?.platformCommission || 0)));
  const distanceKm = ride.fare?.distanceKm || '—';

  const handleAccept = async () => {
    setError(null);
    try {
      await acceptRide(ride.id);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to accept ride. It may have been taken by another driver.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-charcoal-900 border border-brand-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-brand-500/10 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header with Countdown */}
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-400 animate-ping" />
            <span className="text-xs font-black tracking-wider text-brand-400 uppercase">
              Incoming Ride Request
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-charcoal-800 border border-charcoal-700 text-xs font-mono font-bold text-white">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Fare Highlight Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-500/20 via-brand-500/10 to-transparent border border-brand-500/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-brand-300 font-semibold uppercase tracking-wider">Driver Payout</p>
            <div className="flex items-center text-2xl font-black text-white">
              <span className="text-brand-400 text-xl font-normal">₹</span>
              <span>{driverEarnings}</span>
            </div>
            <p className="text-[10px] text-charcoal-400">Total Fare: ₹{totalFare}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded-lg bg-charcoal-800 text-xs font-bold text-white border border-charcoal-700 uppercase">
              {ride.vehicleCategory || 'Ride'}
            </span>
            <p className="text-[11px] text-charcoal-400 mt-1">{distanceKm} km trip</p>
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-charcoal-800/60 border border-charcoal-800">
          {/* Pickup */}
          <div className="flex items-start gap-3">
            <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Pickup</p>
              <p className="text-xs text-white font-medium truncate">{ride.pickup?.address || 'Palamaner Pickup'}</p>
            </div>
          </div>

          <div className="ml-2.5 w-0.5 h-4 bg-charcoal-700 border-l border-dashed border-charcoal-600" />

          {/* Dropoff */}
          <div className="flex items-start gap-3">
            <div className="mt-1 w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Destination</p>
              <p className="text-xs text-white font-medium truncate">{ride.dropoff?.address || 'Palamaner Destination'}</p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="py-3 px-4 rounded-2xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>

          <button
            onClick={handleAccept}
            disabled={actionLoading}
            className="py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-black text-sm transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{actionLoading ? 'Accepting...' : 'ACCEPT RIDE'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
