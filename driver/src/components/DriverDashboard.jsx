import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { rideService } from '../services/rideService';
import { LiveMap } from './LiveMap';
import { ActiveRideCard } from './ActiveRideCard';
import { IncomingRideModal } from './IncomingRideModal';
import { 
  Power, 
  MapPin, 
  Navigation, 
  Car, 
  Bike,
  IndianRupee, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Radio,
  ArrowRight,
  Filter,
  Layers
} from 'lucide-react';

export const DriverDashboard = ({ onNavigateTab }) => {
  const { user, driverProfile } = useAuth();
  const { 
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
    acceptRide 
  } = useRide();

  const [todayRides, setTodayRides] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch today's completed rides for real stats
  useEffect(() => {
    let isMounted = true;
    async function fetchTodayStats() {
      if (!user) return;
      try {
        const history = await rideService.getDriverRideHistory(user.uid, 50);
        if (!isMounted) return;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const todayCompleted = history.filter(r => {
          if (r.status !== 'completed') return false;
          const t = r.timestamps?.completedAt || r.timestamps?.requestedAt;
          return t && new Date(t).getTime() >= startOfToday;
        });

        setTodayRides(todayCompleted);
      } catch (e) {
        console.warn("Could not fetch today stats:", e);
      } finally {
        if (isMounted) setStatsLoading(false);
      }
    }

    fetchTodayStats();
    // Refresh stats when activeRide completes
    return () => { isMounted = false; };
  }, [user, activeRide?.status]);

  // Compute today's actual figures from real records
  const completedCount = todayRides.length;
  let todayEarnings = 0;
  todayRides.forEach(r => {
    const gross = Number(r.fare?.totalFare || 0);
    const comm = Number(r.fare?.platformCommission || 0);
    const net = Number(r.fare?.driverEarnings || Math.max(0, gross - comm));
    todayEarnings += net;
  });

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* GPS Warning Banner if any */}
      {gpsError && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>GPS Notice: {gpsError}. Ensure device location is enabled.</span>
        </div>
      )}

      {/* Online / Offline Quick Control Banner */}
      <div className="p-4 rounded-3xl bg-charcoal-900 border border-charcoal-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
            isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-charcoal-800 text-charcoal-500'
          }`}>
            <Power className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">
                {isOnline ? 'You Are Online' : 'You Are Offline'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-charcoal-600'}`} />
            </div>
            <p className="text-[11px] text-charcoal-400">
              {isOnline ? 'Ready to accept passenger trips in Palamaner' : 'Go online to receive incoming ride requests'}
            </p>
          </div>
        </div>

        <button
          onClick={toggleOnline}
          disabled={actionLoading || Boolean(activeRide)}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-md active:scale-95 ${
            isOnline
              ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
              : 'bg-brand-500 hover:bg-brand-400 text-charcoal-950 shadow-brand-500/20'
          } ${activeRide ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
        </button>
      </div>

      {/* Real Stats Cards (Strictly from real data) */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          onClick={() => onNavigateTab('earnings')}
          className="p-4 rounded-3xl bg-charcoal-900 border border-charcoal-800 hover:border-brand-500/40 cursor-pointer transition-all space-y-1 shadow-lg"
        >
          <div className="flex items-center justify-between text-charcoal-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Earnings</span>
            <IndianRupee className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white">
            <span className="text-brand-400 text-lg">₹</span>
            {todayEarnings}
          </p>
          <p className="text-[10px] text-charcoal-500">Real net payout</p>
        </div>

        <div 
          onClick={() => onNavigateTab('history')}
          className="p-4 rounded-3xl bg-charcoal-900 border border-charcoal-800 hover:border-brand-500/40 cursor-pointer transition-all space-y-1 shadow-lg"
        >
          <div className="flex items-center justify-between text-charcoal-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Trips</span>
            <Car className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white">{completedCount}</p>
          <p className="text-[10px] text-charcoal-500">Completed in Palamaner</p>
        </div>
      </div>

      {/* Interactive Live Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-charcoal-300 uppercase tracking-wider">
            {activeRide ? 'Active Trip Route' : 'Palamaner Live Area'}
          </span>
          <span className="text-[11px] text-brand-400 font-semibold flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>OpenStreetMap</span>
          </span>
        </div>

        <LiveMap
          driverLocation={currentLocation}
          activeRide={activeRide}
          className="h-60 sm:h-72"
        />
      </div>

      {/* If Active Ride is in Progress */}
      {activeRide ? (
        <div className="space-y-2 animate-in fade-in duration-200">
          <h3 className="text-xs font-bold text-brand-400 uppercase tracking-wider px-1">
            Current Ongoing Trip
          </h3>
          <ActiveRideCard />
        </div>
      ) : isOnline ? (
        /* If Online and Searching for Rides */
        <div className="space-y-3">
          {/* Header Card */}
          <div className="p-4 rounded-3xl bg-charcoal-900 border border-charcoal-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-7 h-7 rounded-full bg-brand-500/20 animate-ping absolute" />
                <span className="w-4 h-4 rounded-full bg-brand-500 relative" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Searching for Ride Requests...</p>
                <p className="text-[11px] text-charcoal-400">
                  Listening to Palamaner service area • Filter: <span className="text-brand-400 font-bold uppercase">{categoryFilter}</span>
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-charcoal-800 text-[11px] font-mono text-brand-400 font-bold border border-charcoal-700">
              {availableRides.length} Available
            </span>
          </div>

          {/* Category Filter Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-charcoal-900 border border-charcoal-800 overflow-x-auto text-xs">
            {[
              { id: 'all', label: 'All Requests', count: categoryCounts?.all ?? availableRides.length },
              { id: 'auto', label: 'Auto', count: categoryCounts?.auto ?? 0 },
              { id: 'bike', label: 'Bike', count: categoryCounts?.bike ?? 0 },
              { id: 'cab', label: 'Cab', count: categoryCounts?.cab ?? 0 }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all text-xs ${
                  categoryFilter === tab.id
                    ? 'bg-brand-500 text-charcoal-950 shadow-md font-black'
                    : 'text-charcoal-400 hover:text-white hover:bg-charcoal-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  categoryFilter === tab.id ? 'bg-charcoal-950/20 text-charcoal-950 font-bold' : 'bg-charcoal-800 text-charcoal-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Notice if Query Error */}
          {rideQueryError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Stream note: {rideQueryError}</span>
            </div>
          )}

          {/* Alert if customer requested a ride in another vehicle category */}
          {categoryFilter !== 'all' && (categoryCounts?.all || 0) > 0 && availableRides.length === 0 && (
            <div className="p-4 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{categoryCounts.all} open ride request(s) waiting in Palamaner!</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                A customer requested a ride in a different category (e.g. 
                {categoryCounts.bike > 0 ? ' Bike' : ''}
                {categoryCounts.auto > 0 ? ' Auto' : ''}
                {categoryCounts.cab > 0 ? ' Cab' : ''}). Switch to "All Requests" to view and accept it.
              </p>
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black text-xs transition-all shadow-sm flex items-center gap-1"
              >
                <span>Switch to All Requests ({categoryCounts.all}) →</span>
              </button>
            </div>
          )}

          {/* List of Available Eligible Requests */}
          {availableRides.length === 0 ? (
            <div className="p-8 text-center bg-charcoal-900/60 border border-charcoal-800/80 rounded-3xl space-y-2">
              <p className="text-xs font-bold text-white">No pending requests right now</p>
              <p className="text-[11px] text-charcoal-400">
                When customers book via the Customer app, requests will appear here instantly with a notification chime.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-800 text-[10px] text-charcoal-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Listening to Palamaner Service Area • Filter: {categoryFilter.toUpperCase()}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">
                  Available Requests ({availableRides.length})
                </h4>
                <span className="text-[10px] text-brand-400 font-semibold">
                  Live Dispatch Active
                </span>
              </div>
              {availableRides.map((ride) => {
                const totalFare = Number(ride.fare?.totalFare || 0);
                const earnings = Number(ride.fare?.driverEarnings || Math.max(0, totalFare - Number(ride.fare?.platformCommission || 0)));
                const isBike = (ride.vehicleCategory || '').toLowerCase() === 'bike';
                const isAuto = (ride.vehicleCategory || '').toLowerCase() === 'auto';

                return (
                  <div
                    key={ride.id}
                    className="p-4 rounded-3xl bg-charcoal-900 border border-charcoal-800 hover:border-brand-500/50 transition-all space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                          isBike 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                            : isAuto
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        }`}>
                          {isBike ? <Bike className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
                          <span>{ride.vehicleCategory || 'Ride'}</span>
                        </span>
                        {ride.customerName && (
                          <span className="text-xs text-charcoal-400 font-medium truncate max-w-[120px]">
                            • {ride.customerName}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400">₹{earnings}</span>
                        <span className="text-[10px] text-charcoal-400 block">Payout (₹{totalFare} fare)</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-charcoal-300 truncate">From: {ride.pickup?.address || 'Pickup in Palamaner'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                        <span className="text-white font-medium truncate">To: {ride.dropoff?.address || 'Dropoff in Palamaner'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => acceptRide(ride.id)}
                      disabled={actionLoading}
                      className="w-full py-3 px-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>{actionLoading ? 'Accepting Trip...' : 'ACCEPT THIS RIDE'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* If Offline */
        <div className="p-8 text-center bg-charcoal-900 border border-charcoal-800 rounded-3xl space-y-3">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-charcoal-800 flex items-center justify-center text-charcoal-500">
            <Power className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">You are Currently Offline</h3>
            <p className="text-xs text-charcoal-400 max-w-xs mx-auto mt-1">
              Switch your status to Online to start receiving rides and earning across Palamaner.
            </p>
          </div>
          <button
            onClick={toggleOnline}
            disabled={actionLoading}
            className="py-3 px-6 rounded-2xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-black text-xs transition-all shadow-lg shadow-brand-500/20 active:scale-95"
          >
            GO ONLINE NOW
          </button>
        </div>
      )}

      {/* Incoming Ride Alert Modal popup */}
      {newRideAlert && (
        <IncomingRideModal
          ride={newRideAlert}
          onClose={() => setNewRideAlert(null)}
        />
      )}
    </div>
  );
};
