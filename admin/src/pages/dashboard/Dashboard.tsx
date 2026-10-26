import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Car,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { statsService, type DashboardData } from '@/services/statsService';
import { formatCurrency, formatDateTime, getRideStatusBadge, getDriverApprovalBadge } from '@/utils/formatters';
import { MetricSkeleton, CardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7d' | '30d'>('all');

  const fetchStats = async (range: 'all' | 'today' | '7d' | '30d' = dateRange) => {
    setLoading(true);
    setError(null);
    try {
      const result = await statsService.getDashboardData(range);
      setData(result);
    } catch (err: any) {
      console.error('Failed to load dashboard metrics:', err);
      setError(err.message || 'Could not fetch metrics from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(dateRange);
  }, [dateRange]);

  const metrics = data?.metrics || {
    totalCustomers: 0,
    totalDrivers: 0,
    pendingDriverApplications: 0,
    approvedDrivers: 0,
    activeRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalFareRecorded: 0,
    totalCommissionEarned: 0,
    totalDriverEarnings: 0,
    pendingComplaints: 0,
    pendingSettlements: 0,
  };

  const statCards = [
    {
      title: 'Total Customers',
      value: metrics.totalCustomers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      link: '/customers',
      subtitle: 'Registered riders',
    },
    {
      title: 'Total Drivers',
      value: metrics.totalDrivers,
      icon: Car,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      link: '/drivers',
      subtitle: `${metrics.approvedDrivers} Approved`,
    },
    {
      title: 'Pending Driver Apps',
      value: metrics.pendingDriverApplications,
      icon: Clock,
      color: metrics.pendingDriverApplications > 0 ? 'text-amber-600' : 'text-slate-600',
      bg: metrics.pendingDriverApplications > 0 ? 'bg-amber-50' : 'bg-slate-50',
      highlight: metrics.pendingDriverApplications > 0,
      link: '/drivers?status=pending',
      subtitle: 'Awaiting doc review',
    },
    {
      title: 'Active Rides',
      value: metrics.activeRides,
      icon: TrendingUp,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      link: '/rides',
      subtitle: 'Live in Palamaner',
    },
    {
      title: 'Completed Rides',
      value: metrics.completedRides,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      link: '/rides?status=completed',
      subtitle: 'Finished trips',
    },
    {
      title: 'Cancelled Rides',
      value: metrics.cancelledRides,
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      link: '/rides?status=cancelled',
      subtitle: 'Customer/Driver drop',
    },
    {
      title: 'Gross Ride Revenue',
      value: formatCurrency(metrics.totalFareRecorded),
      icon: IndianRupee,
      color: 'text-emerald-800',
      bg: 'bg-emerald-100/50',
      isText: true,
      link: '/payments',
      subtitle: `Comm: ${formatCurrency(metrics.totalCommissionEarned)}`,
    },
    {
      title: 'Driver Net Earnings',
      value: formatCurrency(metrics.totalDriverEarnings),
      icon: IndianRupee,
      color: 'text-indigo-700',
      bg: 'bg-indigo-50',
      isText: true,
      link: '/payments',
      subtitle: 'Net after commissions',
    },
  ];


  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Palamaner Operations Dashboard
          </h2>
          <p className="text-xs text-slate-500">
            Real-time platform status calculated directly from Firestore data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setDateRange('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                dateRange === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateRange('today')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                dateRange === 'today'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('7d')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                dateRange === '7d'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                dateRange === '30d'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            onClick={() => fetchStats(dateRange)}
            disabled={loading}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchStats(dateRange)} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <MetricSkeleton key={i} />)
          : statCards.map((card, idx) => (
              <Link
                key={idx}
                to={card.link}
                className={`glass-card glass-card-hover p-4 sm:p-5 flex flex-col justify-between group ${
                  card.highlight ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/30' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-800 transition-colors">
                    {card.title}
                  </span>
                  <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {card.value}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium truncate">{card.subtitle}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
      </div>


      {/* Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ride Status Distribution */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ride Status Distribution</h3>
              <p className="text-xs text-slate-500">Live breakdown by lifecycle state</p>
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {loading ? (
              <CardSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.statusDistribution || []}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(data?.statusDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} rides`, 'Count']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
            {(data?.statusDistribution || []).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <strong className="text-slate-900">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Activity & Revenue Summary */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Booking Velocity</h3>
              <p className="text-xs text-slate-500">Rides recorded over recent dates</p>
            </div>
          </div>

          <div className="h-56 w-full">
            {loading ? (
              <CardSkeleton />
            ) : data?.activityTrend && data.activityTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.activityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="rides" name="Total Rides" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <Car className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 font-medium">No ride activity recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Bookings created in the User App will chart here in real-time.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 text-slate-500">
            <span>Commission Platform Cut: <strong className="text-emerald-700">{formatCurrency(metrics.totalCommissionEarned)}</strong></span>
            <Link to="/rides" className="font-semibold text-emerald-700 hover:underline">
              View All Rides →
            </Link>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Pending Approvals & Recent Rides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Driver Approvals Widget */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Pending Driver Verification</h3>
            </div>
            <Link
              to="/drivers?status=pending"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View All ({metrics.pendingDriverApplications})
            </Link>
          </div>

          {loading ? (
            <CardSkeleton />
          ) : data?.pendingDrivers && data.pendingDrivers.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.pendingDrivers.map((driver) => (
                <div key={driver.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-200/60">
                      {driver.fullName?.charAt(0) || 'D'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{driver.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {driver.vehicleCategory?.toUpperCase()} • {driver.phoneNumber}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/drivers?select=${driver.id}`}
                    className="btn-secondary text-[11px] px-2.5 py-1 shrink-0"
                  >
                    Review Docs
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800">All Driver Applications Processed</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                New driver registrations from Go Plmr Driver App will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Recent Rides Table Widget */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Rides</h3>
            <Link to="/rides" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              View All Rides
            </Link>
          </div>

          {loading ? (
            <CardSkeleton />
          ) : data?.recentRides && data.recentRides.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentRides.map((ride) => {
                const badge = getRideStatusBadge(ride.status);
                return (
                  <div key={ride.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {ride.customerName || 'Customer'}
                        </span>
                        <span className={`badge ${badge.className} text-[10px]`}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {ride.pickup?.address || 'Palamaner'} → {ride.dropoff?.address || 'Destination'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(ride.fare?.totalFare)}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {formatDateTime(ride.timestamps?.requestedAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800">No Rides Recorded Yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Trips requested through Go Plmr User App will show here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
