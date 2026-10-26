import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { rideService } from '../../services/rideService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Clock,
  MapPin,
  Calendar,
  ArrowRight,
  Bike,
  Zap,
  Car,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const RideHistoryPage = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const data = await rideService.getCustomerRideHistory(user.uid, 40);
      setRides(data);
    } catch (err) {
      console.error('Failed to load ride history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'bike':
        return Bike;
      case 'cab':
        return Car;
      default:
        return Zap;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', className: 'badge-success' };
      case 'cancelled':
        return { label: 'Cancelled', className: 'badge-danger' };
      case 'ride_started':
        return { label: 'In Progress', className: 'badge-success animate-pulse' };
      case 'driver_assigned':
      case 'driver_arriving':
        return { label: 'Driver Assigned', className: 'badge-info' };
      case 'requested':
      case 'searching':
        return { label: 'Searching', className: 'badge-warning' };
      default:
        return { label: status, className: 'badge-neutral' };
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading your GO PLMR ride history..." />;
  }

  return (
    <div className="flex flex-col px-4 py-4 pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Trip Activity</h2>
          <p className="text-xs text-slate-500">Your ride history in Palamaner</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* Ride Cards List */}
      {rides.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Rides Yet"
          description="You haven't booked any rides with GO PLMR yet. Ready to travel in Palamaner?"
          actionLabel="Book a Ride Now"
          onAction={() => window.location.assign('/')}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rides.map((ride) => {
            const Icon = getCategoryIcon(ride.vehicleCategory);
            const status = getStatusBadge(ride.status);
            const dateStr = ride.timestamps?.requestedAt
              ? new Date(ride.timestamps.requestedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent Trip';

            return (
              <Link
                key={ride.id}
                to={`/rides/${ride.id}`}
                className="glass-card p-4 rounded-3xl border border-slate-200/90 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.99] group"
              >
                {/* Header Row: Category, Date, Status */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 capitalize">
                        GO {ride.vehicleCategory}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                {/* Locations Summary */}
                <div className="my-3 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1 flex-shrink-0"></div>
                    <span className="text-slate-700 line-clamp-1 font-medium">{ride.pickup?.address}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-600 mt-1 flex-shrink-0"></div>
                    <span className="text-slate-700 line-clamp-1 font-medium">{ride.dropoff?.address}</span>
                  </div>
                </div>

                {/* Footer: Fare & View Link */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-400 font-medium">Fare:</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      ₹{ride.fare?.totalFare || 0}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">
                      ({ride.paymentMethod || 'cash'})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
