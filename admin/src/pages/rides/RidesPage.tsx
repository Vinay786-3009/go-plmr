import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Car,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ShieldCheck,
  Ban,
  Eye,
  ArrowRight,
  User,
} from 'lucide-react';
import { rideService } from '@/services/rideService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { RideRecord, RideStatus, VehicleCategoryType } from '@/types';
import {
  formatCurrency,
  formatDateTime,
  formatPhone,
  getRideStatusBadge,
  getVehicleCategoryLabel,
} from '@/utils/formatters';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';

export const RidesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [rides, setRides] = useState<RideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected ride for detail view
  const [selectedRide, setSelectedRide] = useState<RideRecord | null>(null);

  // Admin cancellation modal
  const [cancellingRide, setCancellingRide] = useState<RideRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = rideService.subscribeRides(
      {
        status: statusFilter as any,
        vehicleCategory: categoryFilter as any,
      },
      (data) => {
        setRides(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching rides:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [statusFilter, categoryFilter]);

  const filteredRides = useMemo(() => {
    const now = new Date();
    let cutoffIso: string | null = null;
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      cutoffIso = today.toISOString();
    } else if (dateFilter === '7d') {
      cutoffIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (dateFilter === '30d') {
      cutoffIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    return rides.filter((ride) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        ride.id?.toLowerCase().includes(q) ||
        ride.customerName?.toLowerCase().includes(q) ||
        ride.customerPhone?.includes(q) ||
        ride.driverName?.toLowerCase().includes(q) ||
        ride.driverPhone?.includes(q) ||
        ride.pickup?.address?.toLowerCase().includes(q) ||
        ride.dropoff?.address?.toLowerCase().includes(q);

      const matchesDate = !cutoffIso || (ride.timestamps?.requestedAt || '') >= cutoffIso;

      return matchesSearch && matchesDate;
    });
  }, [rides, searchQuery, dateFilter]);

  const totalPages = Math.ceil(filteredRides.length / itemsPerPage) || 1;
  const paginatedRides = filteredRides.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAdminCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingRide || !user || !cancelReason.trim()) return;
    setActionLoading(true);
    try {
      await rideService.cancelRideByAdmin(cancellingRide.id, cancelReason.trim(), {
        uid: user.uid,
        email: user.email || 'admin@goplmr.com',
      });
      success('Ride Cancelled by Admin', 'Cancellation reason and admin action logged to audit trail.');
      setCancellingRide(null);
      setCancelReason('');
      if (selectedRide?.id === cancellingRide.id) {
        setSelectedRide((prev) =>
          prev ? { ...prev, status: 'cancelled', cancellationReason: cancelReason, cancelledBy: 'admin' } : null
        );
      }
    } catch (err: any) {
      error('Cancellation failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Ride Bookings & Trip History
          </h2>
          <p className="text-xs text-slate-500">
            Monitor real-time ride states, route details, fares, and cancellation reasons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search ride ID, rider, driver, route..."
            className="w-full sm:w-64"
          />

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="input-field py-2 text-xs w-auto"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7d">Past 7 Days</option>
            <option value="30d">Past 30 Days</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-xs w-auto"
          >
            <option value="all">All Ride Statuses</option>
            <option value="requested">Requested</option>
            <option value="searching">Searching Driver</option>
            <option value="driver_assigned">Driver Assigned</option>
            <option value="driver_arriving">Driver Arriving</option>
            <option value="ride_started">Ride Started</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field py-2 text-xs w-auto"
          >
            <option value="all">All Vehicles</option>
            <option value="bike">Bike</option>
            <option value="auto">Auto</option>
            <option value="cab">Cab</option>
          </select>
        </div>
      </div>


      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : filteredRides.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No Rides Found"
          description={
            searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'No rides match the selected filters.'
              : 'No rides have been requested yet. Trips created in the Go Plmr User App will appear here in real time.'
          }
          instruction="Ride records are stored under the 'rides' collection in Cloud Firestore."
        />
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Ride ID / Time</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Driver</th>
                  <th className="px-4 py-3.5">Vehicle</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Fare</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRides.map((ride) => {
                  const badge = getRideStatusBadge(ride.status);
                  const isLive = ['requested', 'searching', 'driver_assigned', 'driver_arriving', 'ride_started'].includes(
                    ride.status
                  );
                  return (
                    <tr key={ride.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900 block truncate max-w-[120px]">
                          #{ride.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(ride.timestamps?.requestedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 truncate">{ride.customerName || 'Customer'}</p>
                        <p className="text-[11px] text-slate-500">{formatPhone(ride.customerPhone)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {ride.driverName ? (
                          <>
                            <p className="font-semibold text-slate-800 truncate">{ride.driverName}</p>
                            <p className="text-[11px] text-slate-500">{formatPhone(ride.driverPhone)}</p>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800">
                          {getVehicleCategoryLabel(ride.vehicleCategory)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${badge.className}`}>{badge.text}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(ride.fare?.totalFare)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {ride.paymentMethod?.toUpperCase()} • {ride.paymentStatus}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedRide(ride)}
                            className="btn-secondary text-[11px] px-2.5 py-1.5 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Details</span>
                          </button>

                          {isLive && (
                            <button
                              onClick={() => setCancellingRide(ride)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Admin Cancel Ride"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredRides.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Ride Details Modal */}
      {selectedRide && (
        <Modal
          isOpen={Boolean(selectedRide)}
          onClose={() => setSelectedRide(null)}
          title={`Ride Record: #${selectedRide.id.slice(-8).toUpperCase()}`}
          subtitle={`Status: ${getRideStatusBadge(selectedRide.status).text}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs">
            {/* Status & Cancellation Info */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Lifecycle State:</span>
                <span className={`badge ${getRideStatusBadge(selectedRide.status).className}`}>
                  {getRideStatusBadge(selectedRide.status).text}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">OTP Security:</span>
                <span
                  className={`font-semibold ${
                    selectedRide.otpVerified ? 'text-emerald-700' : 'text-amber-600'
                  }`}
                >
                  {selectedRide.otpVerified ? '✓ Verified at Pickup' : '○ Pending Start'}
                </span>
              </div>
            </div>

            {selectedRide.cancellationReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Cancelled by {selectedRide.cancelledBy || 'Platform'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">Reason: {selectedRide.cancellationReason}</p>
              </div>
            )}

            {/* Route Addresses */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Trip Route (Palamaner, AP)</span>
              </h4>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700 block">Pickup Location</span>
                    <p className="text-slate-600 text-[11px]">{selectedRide.pickup?.address || 'Pickup Point'}</p>
                    {selectedRide.pickup?.latitude && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        Lat: {selectedRide.pickup.latitude}, Lng: {selectedRide.pickup.longitude}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700 block">Dropoff Destination</span>
                    <p className="text-slate-600 text-[11px]">{selectedRide.dropoff?.address || 'Destination'}</p>
                    {selectedRide.dropoff?.latitude && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        Lat: {selectedRide.dropoff.latitude}, Lng: {selectedRide.dropoff.longitude}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fare Breakdown Grid */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-700" />
                <span>Financial & Fare Breakdown</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 text-[10px] block">Base Fare</span>
                  <strong className="text-slate-800">{formatCurrency(selectedRide.fare?.baseFare)}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 text-[10px] block">Distance Fare</span>
                  <strong className="text-slate-800">{formatCurrency(selectedRide.fare?.distanceFare)}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 text-[10px] block">Booking Fee</span>
                  <strong className="text-slate-800">{formatCurrency(selectedRide.fare?.bookingFee)}</strong>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-emerald-700 text-[10px] block font-semibold">Total Fare</span>
                  <strong className="text-emerald-950 text-sm">{formatCurrency(selectedRide.fare?.totalFare)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">Platform Commission:</span>
                  <strong className="text-emerald-700">{formatCurrency(selectedRide.fare?.platformCommission)}</strong>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">Driver Payout:</span>
                  <strong className="text-slate-800">{formatCurrency(selectedRide.fare?.driverEarnings)}</strong>
                </div>
              </div>
            </div>

            {/* Timestamps Timeline */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>Lifecycle Timestamps</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                <p>Requested: <strong className="text-slate-800">{formatDateTime(selectedRide.timestamps?.requestedAt)}</strong></p>
                <p>Assigned: <strong className="text-slate-800">{formatDateTime(selectedRide.timestamps?.assignedAt)}</strong></p>
                <p>Arrived: <strong className="text-slate-800">{formatDateTime(selectedRide.timestamps?.arrivingAt)}</strong></p>
                <p>Started: <strong className="text-slate-800">{formatDateTime(selectedRide.timestamps?.startedAt)}</strong></p>
                <p>Completed: <strong className="text-slate-800">{formatDateTime(selectedRide.timestamps?.completedAt)}</strong></p>
                <p>Cancelled: <strong className="text-slate-800">{formatDateTime(selectedRide.timestamps?.cancelledAt)}</strong></p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRide(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Cancellation Modal */}
      <Modal
        isOpen={Boolean(cancellingRide)}
        onClose={() => {
          setCancellingRide(null);
          setCancelReason('');
        }}
        title="Admin Cancellation of Ride"
        subtitle={`Ride ID: #${cancellingRide?.id.slice(-8).toUpperCase()}`}
        maxWidth="md"
      >
        <form onSubmit={handleAdminCancel} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason (Required)
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Driver emergency, system dispatch correction, road blockage in Palamaner..."
              required
              className="input-field"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setCancellingRide(null);
                setCancelReason('');
              }}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !cancelReason.trim()}
              className="btn-danger text-xs px-4 py-2"
            >
              {actionLoading ? 'Cancelling...' : 'Confirm Admin Cancellation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
