import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { rideService } from '../services/rideService';
import { 
  IndianRupee, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Car, 
  ArrowUpRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export const EarningsView = () => {
  const { user } = useAuth();
  const [filterPeriod, setFilterPeriod] = useState('today'); // 'today' | 'week' | 'all'
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDriverRides() {
      if (!user) return;
      setLoading(true);
      try {
        const history = await rideService.getDriverRideHistory(user.uid, 100);
        if (isMounted) setRides(history);
      } catch (e) {
        console.error("Error loading driver earnings:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDriverRides();
    return () => { isMounted = false; };
  }, [user]);

  // Filter rides based on period
  const completedRides = rides.filter(r => r.status === 'completed');

  const filteredRides = completedRides.filter(ride => {
    if (filterPeriod === 'all') return true;

    const rideTime = ride.timestamps?.completedAt || ride.timestamps?.requestedAt;
    if (!rideTime) return false;

    const rideDate = new Date(rideTime);
    const now = new Date();

    if (filterPeriod === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return rideDate.getTime() >= todayStart;
    }

    if (filterPeriod === 'week') {
      const weekStart = now.getTime() - (7 * 24 * 60 * 60 * 1000);
      return rideDate.getTime() >= weekStart;
    }

    return true;
  });

  // Calculate strict aggregates from real ride records
  const totalCompletedTrips = filteredRides.length;
  let totalGrossFare = 0;
  let totalCommission = 0;
  let totalDriverEarnings = 0;

  filteredRides.forEach(r => {
    const gross = Number(r.fare?.totalFare || 0);
    const comm = Number(r.fare?.platformCommission || 0);
    const earn = Number(r.fare?.driverEarnings || Math.max(0, gross - comm));

    totalGrossFare += gross;
    totalCommission += comm;
    totalDriverEarnings += earn;
  });

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Driver Partner Earnings</h2>
          <p className="text-xs text-charcoal-400">Actual payouts based on completed trips in Palamaner</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
          <IndianRupee className="w-5 h-5" />
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="grid grid-cols-3 p-1 rounded-2xl bg-charcoal-900 border border-charcoal-800 text-xs font-bold">
        <button
          onClick={() => setFilterPeriod('today')}
          className={`py-2 rounded-xl transition-all ${
            filterPeriod === 'today' ? 'bg-brand-500 text-charcoal-950 font-black shadow' : 'text-charcoal-400 hover:text-white'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setFilterPeriod('week')}
          className={`py-2 rounded-xl transition-all ${
            filterPeriod === 'week' ? 'bg-brand-500 text-charcoal-950 font-black shadow' : 'text-charcoal-400 hover:text-white'
          }`}
        >
          Past 7 Days
        </button>
        <button
          onClick={() => setFilterPeriod('all')}
          className={`py-2 rounded-xl transition-all ${
            filterPeriod === 'all' ? 'bg-brand-500 text-charcoal-950 font-black shadow' : 'text-charcoal-400 hover:text-white'
          }`}
        >
          All Time
        </button>
      </div>

      {/* Main Net Payout Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-charcoal-950 border border-brand-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider">
            Net Driver Payout
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold">
            Settlement Ready
          </span>
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className="text-2xl font-bold text-brand-400">₹</span>
          <span className="text-4xl font-black text-white tracking-tight">{totalDriverEarnings}</span>
        </div>

        <p className="text-[11px] text-charcoal-400 mt-1">
          Earned across <strong>{totalCompletedTrips}</strong> completed {totalCompletedTrips === 1 ? 'trip' : 'trips'}
        </p>

        {/* Breakdown sub-cards */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-charcoal-800 text-xs">
          <div className="p-2.5 rounded-xl bg-charcoal-800/60 border border-charcoal-800">
            <span className="text-[10px] text-charcoal-400 block">Gross Customer Fares</span>
            <span className="font-bold text-white text-sm">₹{totalGrossFare}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-charcoal-800/60 border border-charcoal-800">
            <span className="text-[10px] text-charcoal-400 block">Platform Commission</span>
            <span className="font-bold text-rose-400 text-sm">- ₹{totalCommission}</span>
          </div>
        </div>
      </div>

      {/* Completed Trips List */}
      <div className="space-y-2.5 pt-2">
        <h3 className="text-xs font-bold text-charcoal-300 uppercase tracking-wider">
          Completed Trips Breakdown ({filteredRides.length})
        </h3>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-charcoal-400 text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
            <span>Loading earnings records...</span>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="p-8 text-center bg-charcoal-900 border border-charcoal-800 rounded-3xl space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-charcoal-800 flex items-center justify-center text-charcoal-500">
              <Car className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-white">No completed trips in this period</p>
            <p className="text-[11px] text-charcoal-400">
              Go online on the dashboard and accept rides in Palamaner to record real earnings.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRides.map((ride) => {
              const rideEarnings = Number(ride.fare?.driverEarnings || Math.max(0, Number(ride.fare?.totalFare || 0) - Number(ride.fare?.platformCommission || 0)));
              const dateStr = ride.timestamps?.completedAt 
                ? new Date(ride.timestamps.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Recent';

              return (
                <div
                  key={ride.id}
                  className="p-3.5 rounded-2xl bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 transition-colors flex items-center justify-between"
                >
                  <div className="overflow-hidden space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 text-[10px] font-bold uppercase">
                        {ride.vehicleCategory || 'Ride'}
                      </span>
                      <span className="text-[10px] text-charcoal-400">{dateStr}</span>
                    </div>
                    <p className="text-xs font-medium text-white truncate max-w-[200px]">
                      {ride.dropoff?.address || ride.pickup?.address || 'Trip in Palamaner'}
                    </p>
                    <p className="text-[10px] text-charcoal-500">
                      Customer: {ride.customerName || 'Rider'} • Total ₹{ride.fare?.totalFare || 0}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-emerald-400">+₹{rideEarnings}</span>
                    <span className="block text-[10px] text-charcoal-500">Cash / Paid</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
