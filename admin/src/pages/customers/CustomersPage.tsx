import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Ban,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { customerService } from '@/services/customerService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { UserProfile, AccountStatus } from '@/types';
import { formatDateTime, formatPhone } from '@/utils/formatters';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected customer for modal
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);

  // Suspension modal state
  const [suspendingCustomer, setSuspendingCustomer] = useState<UserProfile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = customerService.subscribeCustomers(
      (data) => {
        setCustomers(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching customers:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phoneNumber?.includes(searchQuery) ||
        customer.uid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Modal tabs & sub-data
  const [modalTab, setModalTab] = useState<'overview' | 'rides' | 'complaints'>('overview');
  const [customerRides, setCustomerRides] = useState<any[]>([]);
  const [customerComplaints, setCustomerComplaints] = useState<any[]>([]);
  const [subDataLoading, setSubDataLoading] = useState(false);

  const handleOpenCustomerModal = async (cust: UserProfile) => {
    setSelectedCustomer(cust);
    setModalTab('overview');
    setSubDataLoading(true);
    try {
      const [rides, complaints] = await Promise.all([
        customerService.getCustomerRides(cust.uid),
        customerService.getCustomerComplaints(cust.uid),
      ]);
      setCustomerRides(rides);
      setCustomerComplaints(complaints);
    } catch (err) {
      console.warn('Could not load customer sub-data:', err);
    } finally {
      setSubDataLoading(false);
    }
  };

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingCustomer || !user || !suspensionReason.trim()) return;
    setActionLoading(true);
    try {
      await customerService.suspendCustomer(suspendingCustomer.uid, suspensionReason.trim(), {
        uid: user.uid,
        email: user.email || 'admin@goplmr.com',
      });
      success('Customer Account Suspended', `${suspendingCustomer.fullName}'s account has been restricted.`);
      setSuspendingCustomer(null);
      setSuspensionReason('');
      if (selectedCustomer?.uid === suspendingCustomer.uid) {
        setSelectedCustomer((prev) =>
          prev ? { ...prev, status: 'suspended', suspensionReason } : null
        );
      }
    } catch (err: any) {
      error('Suspension failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (cust: UserProfile) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await customerService.reactivateCustomer(cust.uid, {
        uid: user.uid,
        email: user.email || 'admin@goplmr.com',
      });
      success('Customer Account Reactivated', `${cust.fullName} is now active.`);
      if (selectedCustomer?.uid === cust.uid) {
        setSelectedCustomer((prev) => (prev ? { ...prev, status: 'active', suspensionReason: undefined } : null));
      }
    } catch (err: any) {
      error('Reactivation failed', err.message);
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
            Customer Account Management
          </h2>
          <p className="text-xs text-slate-500">
            View registered riders in Palamaner and administer account access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search name, phone, email, UID..."
            className="w-full sm:w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-xs w-auto"
          >
            <option value="all">All Accounts</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Customers Registered Yet"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'No customer records match your filter criteria.'
              : 'Customer profiles will appear here as users sign up through the Go Plmr User App.'
          }
          instruction="Customer profiles are stored in the 'users' collection in Cloud Firestore."
        />
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-4 py-3.5">Joined Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCustomers.map((cust) => {
                  const isSuspended = cust.status === 'suspended';
                  return (
                    <tr key={cust.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-200/60">
                            {cust.fullName?.charAt(0) || 'C'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{cust.fullName || 'Customer'}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">UID: {cust.uid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{formatPhone(cust.phoneNumber)}</p>
                        <p className="text-[11px] text-slate-500">{cust.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`badge ${
                            isSuspended ? 'badge-danger' : 'badge-success'
                          }`}
                        >
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {formatDateTime(cust.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenCustomerModal(cust)}
                            className="btn-secondary text-[11px] px-2.5 py-1.5 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Profile & History</span>
                          </button>

                          {isSuspended ? (
                            <button
                              onClick={() => handleReactivate(cust)}
                              className="btn-primary text-[10px] px-2.5 py-1.5"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => setSuspendingCustomer(cust)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Suspend Account"
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
            totalItems={filteredCustomers.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Comprehensive Customer Profile & History Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer: ${selectedCustomer.fullName || 'User'}`}
          subtitle={`UID: ${selectedCustomer.uid}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <button
                onClick={() => setModalTab('overview')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  modalTab === 'overview'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50'
                }`}
              >
                Overview & Contact
              </button>
              <button
                onClick={() => setModalTab('rides')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  modalTab === 'rides'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50'
                }`}
              >
                Ride History ({customerRides.length})
              </button>
              <button
                onClick={() => setModalTab('complaints')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  modalTab === 'complaints'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50'
                }`}
              >
                Complaints ({customerComplaints.length})
              </button>
            </div>

            {/* TAB 1: Overview */}
            {modalTab === 'overview' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-500">Account Status:</span>
                  <span className={`badge ${selectedCustomer.status === 'suspended' ? 'badge-danger' : 'badge-success'}`}>
                    {selectedCustomer.status === 'suspended' ? 'Suspended' : 'Active Account'}
                  </span>
                </div>

                {selectedCustomer.suspensionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                    <strong className="font-semibold">Suspension Reason:</strong> {selectedCustomer.suspensionReason}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Rides</span>
                    <strong className="text-slate-900 text-base">{customerRides.length}</strong>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Complaints Logged</span>
                    <strong className="text-slate-900 text-base">{customerComplaints.length}</strong>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Joined Go Plmr</span>
                    <strong className="text-slate-800 text-[11px] block truncate">{formatDateTime(selectedCustomer.createdAt)}</strong>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Profile Details
                  </h4>
                  <p className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phone: <strong>{formatPhone(selectedCustomer.phoneNumber)}</strong></span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email: <strong>{selectedCustomer.email || 'Not provided'}</strong></span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Registration: <strong>{formatDateTime(selectedCustomer.createdAt)}</strong></span>
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Ride History */}
            {modalTab === 'rides' && (
              <div className="space-y-3">
                {subDataLoading ? (
                  <p className="text-slate-400 text-center py-6">Loading rider trip history...</p>
                ) : customerRides.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                    No ride history found for this customer.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {customerRides.map((ride: any) => (
                      <div key={ride.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">#{ride.id.slice(-6).toUpperCase()}</span>
                            <span className="badge badge-neutral text-[10px] capitalize">{ride.status?.replace('_', ' ')}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {ride.pickup?.address || 'Pickup'} → {ride.dropoff?.address || 'Dropoff'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <strong className="text-slate-900">₹{ride.fare?.totalFare || 0}</strong>
                          <p className="text-[10px] text-slate-400">{formatDateTime(ride.timestamps?.requestedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Complaints */}
            {modalTab === 'complaints' && (
              <div className="space-y-3">
                {subDataLoading ? (
                  <p className="text-slate-400 text-center py-6">Loading complaints...</p>
                ) : customerComplaints.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                    No support complaints raised by this customer.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {customerComplaints.map((c: any) => (
                      <div key={c.id} className="p-3 hover:bg-slate-50 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{c.subject}</strong>
                          <span className="badge badge-warning text-[10px] capitalize">{c.status}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{c.description}</p>
                        <p className="text-[10px] text-slate-400">{formatDateTime(c.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              {selectedCustomer.status === 'suspended' ? (
                <button
                  type="button"
                  onClick={() => handleReactivate(selectedCustomer)}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  Reactivate Account
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSuspendingCustomer(selectedCustomer)}
                  className="btn-danger text-xs px-3 py-1.5"
                >
                  Suspend Account
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Customer Suspension Modal */}
      <Modal
        isOpen={Boolean(suspendingCustomer)}
        onClose={() => {
          setSuspendingCustomer(null);
          setSuspensionReason('');
        }}
        title="Suspend Customer Account"
        subtitle={`Customer: ${suspendingCustomer?.fullName}`}
        maxWidth="md"
      >
        <form onSubmit={handleSuspend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Suspension (Required)
            </label>
            <textarea
              rows={3}
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="e.g. Fraudulent cancellations, abuse towards drivers, payment chargebacks..."
              required
              className="input-field"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSuspendingCustomer(null);
                setSuspensionReason('');
              }}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !suspensionReason.trim()}
              className="btn-danger text-xs px-4 py-2"
            >
              {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

