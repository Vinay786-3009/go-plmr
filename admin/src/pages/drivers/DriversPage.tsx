import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Car,
  Search,
  CheckCircle2,
  XCircle,
  Ban,
  RefreshCw,
  Eye,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Star,
  Phone,
  Mail,
  CreditCard,
  ExternalLink,
  IndianRupee,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  PlusCircle,
} from 'lucide-react';
import { driverService } from '@/services/driverService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { DriverProfile, DriverApprovalStatus, VehicleCategoryType, DriverViolationRecord } from '@/types';
import {
  formatCurrency,
  formatDateTime,
  formatPhone,
  getDriverApprovalBadge,
  getVehicleCategoryLabel,
  getRideStatusBadge,
} from '@/utils/formatters';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';

export const DriversPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles'>('drivers');
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected driver for details modal
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [driverModalTab, setDriverModalTab] = useState<'profile' | 'rides' | 'violations'>('profile');
  const [driverRides, setDriverRides] = useState<any[]>([]);
  const [driverViolations, setDriverViolations] = useState<DriverViolationRecord[]>([]);
  const [subDataLoading, setSubDataLoading] = useState(false);

  // Modals for Actions
  const [rejectingDriver, setRejectingDriver] = useState<DriverProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendingDriver, setSuspendingDriver] = useState<DriverProfile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [confirmApprove, setConfirmApprove] = useState<DriverProfile | null>(null);
  const [addingStrikeDriver, setAddingStrikeDriver] = useState<DriverProfile | null>(null);
  const [strikeReason, setStrikeReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Subscribe to drivers
  useEffect(() => {
    setLoading(true);
    const unsub = driverService.subscribeDrivers(
      (data) => {
        setDrivers(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching drivers:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Handle URL param selection
  useEffect(() => {
    const selectedId = searchParams.get('select');
    if (selectedId && drivers.length > 0) {
      const found = drivers.find((d) => d.id === selectedId);
      if (found) handleOpenDriverModal(found);
    }
  }, [searchParams, drivers]);

  const handleOpenDriverModal = async (driver: DriverProfile) => {
    setSelectedDriver(driver);
    setDriverModalTab('profile');
    setSubDataLoading(true);
    try {
      const [rides, violations] = await Promise.all([
        driverService.getDriverRides(driver.id),
        driverService.getDriverViolations(driver.id),
      ]);
      setDriverRides(rides);
      setDriverViolations(violations);
    } catch (err) {
      console.warn('Could not load driver sub-data:', err);
    } finally {
      setSubDataLoading(false);
    }
  };

  // Filtered drivers list
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch =
        driver.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.phoneNumber?.includes(searchQuery) ||
        driver.uid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.vehicleDetails?.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || driver.approvalStatus === statusFilter;
      const matchesCategory = categoryFilter === 'all' || driver.vehicleCategory === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [drivers, searchQuery, statusFilter, categoryFilter]);

  // Flattened vehicle list for Vehicles Tab
  const fleetVehicles = useMemo(() => {
    return drivers.map((d) => ({
      id: d.id,
      driverId: d.id,
      driverName: d.fullName,
      driverPhone: d.phoneNumber,
      driverStatus: d.approvalStatus,
      category: d.vehicleCategory,
      plateNumber: d.vehicleDetails?.plateNumber || 'Pending Registration',
      makeModel: d.vehicleDetails?.makeModel || 'Not Specified',
      color: d.vehicleDetails?.color || '—',
      year: d.vehicleDetails?.year || '—',
      rcUrl: d.documents?.rcUrl,
      insuranceUrl: d.documents?.insuranceUrl,
      verifiedAt: d.documents?.verifiedAt,
      driverProfile: d,
    })).filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        v.plateNumber.toLowerCase().includes(q) ||
        v.makeModel.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        v.driverPhone.includes(q);

      const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [drivers, searchQuery, categoryFilter]);

  const totalPages = Math.ceil(
    (activeTab === 'drivers' ? filteredDrivers.length : fleetVehicles.length) / itemsPerPage
  ) || 1;

  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedVehicles = fleetVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Compute driver earnings from rides
  const driverFinancials = useMemo(() => {
    let gross = 0;
    let commission = 0;
    let net = 0;
    let completed = 0;

    driverRides.forEach((r) => {
      if (r.status === 'completed') {
        completed++;
        const total = Number(r.fare?.totalFare || 0);
        const comm = Number(r.fare?.platformCommission || 0);
        const earn = Number(r.fare?.driverEarnings || Math.max(0, total - comm));
        gross += total;
        commission += comm;
        net += earn;
      }
    });

    return { gross, commission, net, completed };
  }, [driverRides]);

  // Action handlers
  const handleApprove = async () => {
    if (!confirmApprove || !user) return;
    setActionLoading(true);
    try {
      await driverService.approveDriver(confirmApprove.id, {
        uid: user.uid,
        email: user.email || 'admin@goplmr.com',
      });
      success('Driver Approved', `${confirmApprove.fullName} has been granted verified driver status.`);
      setConfirmApprove(null);
      if (selectedDriver?.id === confirmApprove.id) {
        setSelectedDriver((prev) => (prev ? { ...prev, approvalStatus: 'approved' } : null));
      }
    } catch (err: any) {
      error('Approval failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDriver || !user || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await driverService.rejectDriver(rejectingDriver.id, rejectionReason.trim(), {
        uid: user.uid,
        email: user.email || 'admin@goplmr.com',
      });
      success('Driver Application Rejected', 'Rejection reason recorded in audit log.');
      setRejectingDriver(null);
      setRejectionReason('');
      if (selectedDriver?.id === rejectingDriver.id) {
        setSelectedDriver((prev) =>
          prev ? { ...prev, approvalStatus: 'rejected', rejectionReason } : null
        );
      }
    } catch (err: any) {
      error('Rejection failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingDriver || !user || !suspensionReason.trim()) return;
    setActionLoading(true);
    try {
      await driverService.suspendDriver(suspendingDriver.id, suspensionReason.trim(), {
        uid: user.uid,
        email: user.email || 'admin@goplmr.com',
      });
      success('Driver Suspended', `${suspendingDriver.fullName} has been suspended.`);
      setSuspendingDriver(null);
      setSuspensionReason('');
      if (selectedDriver?.id === suspendingDriver.id) {
        setSelectedDriver((prev) =>
          prev ? { ...prev, approvalStatus: 'suspended', suspensionReason } : null
        );
      }
    } catch (err: any) {
      error('Suspension failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (driver: DriverProfile) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await driverService.reactivateDriver(driver.id, {
        uid: user.uid,
        email: user.email || 'admin@goplmr.com',
      });
      success('Driver Reactivated', `${driver.fullName} is now active.`);
      if (selectedDriver?.id === driver.id) {
        setSelectedDriver((prev) => (prev ? { ...prev, approvalStatus: 'approved' } : null));
      }
    } catch (err: any) {
      error('Reactivation failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordStrike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingStrikeDriver || !user || !strikeReason.trim()) return;
    setActionLoading(true);
    try {
      await driverService.recordDriverStrike(
        addingStrikeDriver.id,
        addingStrikeDriver.fullName,
        strikeReason.trim(),
        {
          uid: user.uid,
          email: user.email || 'admin@goplmr.com',
        }
      );
      success('Safety Strike Recorded', `+1 Strike applied to ${addingStrikeDriver.fullName}.`);
      setAddingStrikeDriver(null);
      setStrikeReason('');
      if (selectedDriver?.id === addingStrikeDriver.id) {
        setSelectedDriver((prev) =>
          prev ? { ...prev, helmetStrikes: (prev.helmetStrikes || 0) + 1 } : null
        );
        const violations = await driverService.getDriverViolations(addingStrikeDriver.id);
        setDriverViolations(violations);
      }
    } catch (err: any) {
      error('Failed to record strike', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Driver & Fleet Management
          </h2>
          <p className="text-xs text-slate-500">
            Verify driver documents, manage vehicle assignments (Bike, Auto, Cab), and track violations.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('drivers');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'drivers'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Driver Profiles ({drivers.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('vehicles');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'vehicles'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Registered Vehicles ({fleetVehicles.length})
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={activeTab === 'drivers' ? 'Search driver name, phone, plate...' : 'Search plate, model, driver...'}
          className="w-full sm:w-72"
        />

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {activeTab === 'drivers' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field py-2 text-xs w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          )}

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field py-2 text-xs w-auto"
          >
            <option value="all">All Categories</option>
            <option value="bike">Bike</option>
            <option value="auto">Auto</option>
            <option value="cab">Cab</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: Drivers Table */}
      {activeTab === 'drivers' && (
        <>
          {loading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filteredDrivers.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No Drivers Found"
              description={
                searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No driver records match the selected search or filter criteria.'
                  : 'No drivers registered yet. Driver applications will appear here when users register through the Go Plmr Driver App.'
              }
              instruction="Drivers will be stored under the 'drivers' collection in Cloud Firestore."
            />
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Driver Info</th>
                      <th className="px-4 py-3.5">Vehicle</th>
                      <th className="px-4 py-3.5">Ratings / Rides</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Helmet Strikes</th>
                      <th className="px-4 py-3.5">Registered</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedDrivers.map((driver) => {
                      const badge = getDriverApprovalBadge(driver.approvalStatus);
                      return (
                        <tr key={driver.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                                {driver.fullName?.charAt(0) || 'D'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{driver.fullName}</p>
                                <p className="text-slate-500 text-[11px] font-mono">{formatPhone(driver.phoneNumber)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-800">
                              {getVehicleCategoryLabel(driver.vehicleCategory)}
                            </span>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {driver.vehicleDetails?.plateNumber || driver.vehicleDetails?.makeModel || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1 font-semibold text-slate-800">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>{driver.ratings?.average ? driver.ratings.average.toFixed(1) : 'New'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500">{driver.totalRides || 0} rides completed</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`badge ${badge.className}`}>{badge.text}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`font-semibold ${
                                (driver.helmetStrikes || 0) > 0 ? 'text-rose-600' : 'text-slate-600'
                              }`}
                            >
                              {driver.helmetStrikes || 0} / 3
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                            {formatDateTime(driver.createdAt)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenDriverModal(driver)}
                                className="btn-secondary text-[11px] px-2.5 py-1.5 flex items-center gap-1"
                                title="View Profile & Docs"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Details</span>
                              </button>

                              {driver.approvalStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => setConfirmApprove(driver)}
                                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Approve Driver"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setRejectingDriver(driver)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Reject Application"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {driver.approvalStatus === 'approved' && (
                                <button
                                  onClick={() => setSuspendingDriver(driver)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Suspend Driver"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}

                              {driver.approvalStatus === 'suspended' && (
                                <button
                                  onClick={() => handleReactivate(driver)}
                                  className="btn-primary text-[10px] px-2 py-1"
                                >
                                  Reactivate
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
                totalItems={filteredDrivers.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </>
      )}

      {/* VIEW 2: Registered Vehicles Table */}
      {activeTab === 'vehicles' && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Registration Plate</th>
                  <th className="px-4 py-3.5">Category & Specs</th>
                  <th className="px-4 py-3.5">Associated Driver</th>
                  <th className="px-4 py-3.5">RC & Insurance Documents</th>
                  <th className="px-4 py-3.5">Verification Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedVehicles.map((veh) => (
                  <tr key={veh.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-slate-900 text-xs block">{veh.plateNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">UID: {veh.driverId.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{getVehicleCategoryLabel(veh.category)}</div>
                      <div className="text-[11px] text-slate-500">{veh.makeModel} • {veh.color}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{veh.driverName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{formatPhone(veh.driverPhone)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {veh.rcUrl ? (
                          <a
                            href={veh.rcUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                          >
                            <span>RC Document</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">RC Pending</span>
                        )}

                        {veh.insuranceUrl && (
                          <a
                            href={veh.insuranceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                          >
                            <span>Insurance</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`badge ${getDriverApprovalBadge(veh.driverStatus).className}`}>
                        {veh.driverStatus === 'approved' ? 'Verified & Active' : getDriverApprovalBadge(veh.driverStatus).text}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenDriverModal(veh.driverProfile)}
                        className="btn-secondary text-[11px] px-2.5 py-1.5"
                      >
                        Inspect Driver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={fleetVehicles.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Comprehensive Driver Detail Modal */}
      {selectedDriver && (
        <Modal
          isOpen={Boolean(selectedDriver)}
          onClose={() => setSelectedDriver(null)}
          title={`Driver Profile: ${selectedDriver.fullName}`}
          subtitle={`UID: ${selectedDriver.uid}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <button
                onClick={() => setDriverModalTab('profile')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  driverModalTab === 'profile'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50'
                }`}
              >
                Profile & Documents
              </button>
              <button
                onClick={() => setDriverModalTab('rides')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  driverModalTab === 'rides'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50'
                }`}
              >
                Ride History & Earnings ({driverRides.length})
              </button>
              <button
                onClick={() => setDriverModalTab('violations')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  driverModalTab === 'violations'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50'
                }`}
              >
                Safety Strikes & Violations ({selectedDriver.helmetStrikes || 0})
              </button>
            </div>

            {/* TAB 1: Profile & Documents */}
            {driverModalTab === 'profile' && (
              <div className="space-y-4">
                {/* Status Banner */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Current Status:</span>
                    <span className={`badge ${getDriverApprovalBadge(selectedDriver.approvalStatus).className}`}>
                      {getDriverApprovalBadge(selectedDriver.approvalStatus).text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Online Status:</span>
                    <span
                      className={`font-semibold ${
                        selectedDriver.isOnline ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {selectedDriver.isOnline ? '● Online' : '○ Offline'}
                    </span>
                  </div>
                </div>

                {selectedDriver.rejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                    <strong className="font-semibold">Rejection Reason:</strong> {selectedDriver.rejectionReason}
                  </div>
                )}

                {selectedDriver.suspensionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                    <strong className="font-semibold">Suspension Reason:</strong> {selectedDriver.suspensionReason}
                  </div>
                )}

                {/* Grid of Profile Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact & Personal */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Contact Information
                    </h4>
                    <div className="text-xs space-y-1.5 text-slate-600">
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatPhone(selectedDriver.phoneNumber)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedDriver.email || 'No email registered'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Vehicle Specs */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Vehicle Details
                    </h4>
                    <div className="text-xs space-y-1 text-slate-600">
                      <p>Category: <strong className="text-slate-800">{getVehicleCategoryLabel(selectedDriver.vehicleCategory)}</strong></p>
                      <p>Plate: <strong className="text-slate-800">{selectedDriver.vehicleDetails?.plateNumber || '—'}</strong></p>
                      <p>Model: <strong className="text-slate-800">{selectedDriver.vehicleDetails?.makeModel || '—'}</strong></p>
                    </div>
                  </div>

                  {/* Banking & UPI */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 sm:col-span-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Payout & Banking Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px]">UPI ID</span>
                        <strong className="text-slate-800">{selectedDriver.bankDetails?.upiId || 'Not linked'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Account Number</span>
                        <strong className="text-slate-800">{selectedDriver.bankDetails?.accountNumber || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">IFSC Code</span>
                        <strong className="text-slate-800">{selectedDriver.bankDetails?.ifscCode || '—'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Verification Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>Uploaded Documents (Cloud Storage)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* DL */}
                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-center">
                      <p className="text-xs font-semibold text-slate-800">Driving License</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        DL: {selectedDriver.documents?.dlNumber || 'Pending'}
                      </p>
                      {selectedDriver.documents?.dlUrl ? (
                        <a
                          href={selectedDriver.documents.dlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          <span>View File</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 block mt-2">No file uploaded</span>
                      )}
                    </div>

                    {/* RC */}
                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-center">
                      <p className="text-xs font-semibold text-slate-800">Vehicle RC</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Registration Certificate</p>
                      {selectedDriver.documents?.rcUrl ? (
                        <a
                          href={selectedDriver.documents.rcUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          <span>View File</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 block mt-2">No file uploaded</span>
                      )}
                    </div>

                    {/* Insurance */}
                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-center">
                      <p className="text-xs font-semibold text-slate-800">Insurance Certificate</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Policy Document</p>
                      {selectedDriver.documents?.insuranceUrl ? (
                        <a
                          href={selectedDriver.documents.insuranceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          <span>View File</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 block mt-2">No file uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Ride History & Earnings */}
            {driverModalTab === 'rides' && (
              <div className="space-y-4">
                {/* Financial Summary Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Completed</span>
                    <strong className="text-slate-900 text-base">{driverFinancials.completed}</strong>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Gross Fares</span>
                    <strong className="text-slate-900 text-base">{formatCurrency(driverFinancials.gross)}</strong>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Commission Paid</span>
                    <strong className="text-emerald-700 text-base">{formatCurrency(driverFinancials.commission)}</strong>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-emerald-700 text-[10px] uppercase font-bold block">Net Earnings</span>
                    <strong className="text-emerald-950 text-base">{formatCurrency(driverFinancials.net)}</strong>
                  </div>
                </div>

                {/* Ride List */}
                {subDataLoading ? (
                  <p className="text-slate-400 text-center py-6">Loading driver ride history...</p>
                ) : driverRides.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                    No rides recorded for this driver yet.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {driverRides.map((ride: any) => {
                      const badge = getRideStatusBadge(ride.status);
                      return (
                        <div key={ride.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">#{ride.id.slice(-6).toUpperCase()}</span>
                              <span className={`badge ${badge.className} text-[10px]`}>{badge.text}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {ride.pickup?.address || 'Pickup'} → {ride.dropoff?.address || 'Dropoff'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <strong className="text-slate-900">{formatCurrency(ride.fare?.totalFare)}</strong>
                            <p className="text-[10px] text-slate-400">
                              Net: {formatCurrency(ride.fare?.driverEarnings || 0)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Safety Strikes & Violations */}
            {driverModalTab === 'violations' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base">
                      {selectedDriver.helmetStrikes || 0}
                    </div>
                    <div>
                      <strong className="text-slate-900 block text-xs">Active Safety Strikes (Out of 3)</strong>
                      <p className="text-[11px] text-slate-500">3 strikes automatically result in driver suspension.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAddingStrikeDriver(selectedDriver);
                      setStrikeReason('');
                    }}
                    className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Record Strike</span>
                  </button>
                </div>

                {driverViolations.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-700">Clean Safety Record</p>
                    <p className="text-[11px]">No formal violations or strikes logged for this driver.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {driverViolations.map((v) => (
                      <div key={v.id} className="p-3 bg-white border border-rose-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="badge badge-danger text-[10px]">+1 Strike Applied</span>
                          <span className="text-slate-400">{formatDateTime(v.createdAt)}</span>
                        </div>
                        <p className="text-slate-800 font-semibold">{v.reason}</p>
                        <p className="text-[10px] text-slate-400">Recorded by: {v.adminEmail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDriver(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close
              </button>

              {selectedDriver.approvalStatus === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingDriver(selectedDriver);
                      setSelectedDriver(null);
                    }}
                    className="btn-danger text-xs px-4 py-2"
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmApprove(selectedDriver);
                      setSelectedDriver(null);
                    }}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    Approve Driver
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog: Approve */}
      <ConfirmDialog
        isOpen={Boolean(confirmApprove)}
        onClose={() => setConfirmApprove(null)}
        onConfirm={handleApprove}
        title="Approve Driver Application"
        message={`Are you sure you want to approve ${confirmApprove?.fullName}? This will activate their profile and allow them to accept rides in Palamaner.`}
        confirmText="Yes, Approve Driver"
        variant="primary"
        loading={actionLoading}
      />

      {/* Modal: Rejection Reason */}
      <Modal
        isOpen={Boolean(rejectingDriver)}
        onClose={() => {
          setRejectingDriver(null);
          setRejectionReason('');
        }}
        title="Reject Driver Application"
        subtitle={`Driver: ${rejectingDriver?.fullName}`}
        maxWidth="md"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Rejection (Required)
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Expired driving license, blurred photo, invalid registration plate..."
              required
              className="input-field"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setRejectingDriver(null);
                setRejectionReason('');
              }}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !rejectionReason.trim()}
              className="btn-danger text-xs px-4 py-2"
            >
              {actionLoading ? 'Recording...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Suspension Reason */}
      <Modal
        isOpen={Boolean(suspendingDriver)}
        onClose={() => {
          setSuspendingDriver(null);
          setSuspensionReason('');
        }}
        title="Suspend Driver Account"
        subtitle={`Driver: ${suspendingDriver?.fullName}`}
        maxWidth="md"
      >
        <form onSubmit={handleSuspend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Suspension Reason (Required)
            </label>
            <textarea
              rows={3}
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="e.g. Safety violations, customer harassment report, repeated cancellations..."
              required
              className="input-field"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSuspendingDriver(null);
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

      {/* Modal: Record Strike / Violation */}
      <Modal
        isOpen={Boolean(addingStrikeDriver)}
        onClose={() => {
          setAddingStrikeDriver(null);
          setStrikeReason('');
        }}
        title="Record Safety Strike & Violation"
        subtitle={`Driver: ${addingStrikeDriver?.fullName}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordStrike} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Violation Description / Infraction Reason (Required)
            </label>
            <textarea
              rows={3}
              value={strikeReason}
              onChange={(e) => setStrikeReason(e.target.value)}
              placeholder="e.g. Helmet non-compliance, overcharging rider, reckless driving report..."
              required
              className="input-field"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setAddingStrikeDriver(null);
                setStrikeReason('');
              }}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !strikeReason.trim()}
              className="btn-danger text-xs px-4 py-2"
            >
              {actionLoading ? 'Applying...' : 'Apply +1 Strike'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

