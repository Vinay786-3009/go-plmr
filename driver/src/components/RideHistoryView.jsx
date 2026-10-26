import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { rideService } from '../services/rideService';
import { 
  History, 
  Car, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Clock, 
  Loader2, 
  Filter 
} from 'lucide-react';

export const RideHistoryView = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'completed' | 'cancelled'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      if (!user) return;
      setLoading(true);
      try {
        const history = await rideService.getDriverRideHistory(user.uid, 50);
        if (isMounted) setRides(history);
      } catch (err) {
        console.error("Error fetching ride history:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => { isMounted = false; };
  }, [user]);

  const filtered = rides.filter(r => {
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Driver Trip History</h2>
          <p className="text-xs text-charcoal-400">All rides handled by your account</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-charcoal-800 text-charcoal-300 flex items-center justify-center border border-charcoal-700">
          <History className="w-4 h-4" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-3 p-1 rounded-2xl bg-charcoal-900 border border-charcoal-800 text-xs font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`py-2 rounded-xl transition-all ${
            filter === 'all' ? 'bg-brand-500 text-charcoal-950 font-black shadow' : 'text-charcoal-400 hover:text-white'
          }`}
        >
          All ({rides.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`py-2 rounded-xl transition-all ${
            filter === 'completed' ? 'bg-brand-500 text-charcoal-950 font-black shadow' : 'text-charcoal-400 hover:text-white'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`py-2 rounded-xl transition-all ${
            filter === 'cancelled' ? 'bg-brand-500 text-charcoal-950 font-black shadow' : 'text-charcoal-400 hover:text-white'
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Ride Cards List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-charcoal-400 text-xs gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
          <span>Loading trip records...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-charcoal-900 border border-charcoal-800 rounded-3xl space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-charcoal-800 flex items-center justify-center text-charcoal-500">
            <Car className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-white">No trips found</p>
          <p className="text-[11px] text-charcoal-400">
            Rides you accept and complete or cancel will appear in this history list.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ride) => {
            const isCompleted = ride.status === 'completed';
            const isCancelled = ride.status === 'cancelled';
            const timeStr = ride.timestamps?.requestedAt
              ? new Date(ride.timestamps.requestedAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recent';

            const earnings = Number(ride.fare?.driverEarnings || Math.max(0, Number(ride.fare?.totalFare || 0) - Number(ride.fare?.platformCommission || 0)));

            return (
              <div
                key={ride.id}
                className="p-4 rounded-3xl bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 transition-colors space-y-3"
              >
                {/* Header: Date and Status Badge */}
                <div className="flex items-center justify-between pb-2 border-b border-charcoal-800">
                  <div className="flex items-center gap-1.5 text-xs text-charcoal-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeStr}</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isCompleted
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isCancelled
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-charcoal-800 text-charcoal-300'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{ride.status}</span>
                  </span>
                </div>

                {/* Route */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-charcoal-300 truncate">{ride.pickup?.address || 'Pickup'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    <span className="text-white font-medium truncate">{ride.dropoff?.address || 'Destination'}</span>
                  </div>
                </div>

                {/* Cancellation Note */}
                {isCancelled && ride.cancellationReason && (
                  <p className="text-[11px] text-rose-400/90 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                    Reason: {ride.cancellationReason}
                  </p>
                )}

                {/* Footer: Customer & Earnings */}
                <div className="flex items-center justify-between pt-2 border-t border-charcoal-800 text-xs">
                  <span className="text-charcoal-400 text-[11px]">
                    Passenger: <strong className="text-white">{ride.customerName || 'Rider'}</strong>
                  </span>
                  <div>
                    {isCompleted ? (
                      <span className="font-black text-brand-400 text-sm">₹{earnings}</span>
                    ) : (
                      <span className="text-charcoal-500 text-xs">₹0</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
