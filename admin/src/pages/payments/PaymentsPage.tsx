import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee,
  Receipt,
  Download,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  CreditCard,
  FileSpreadsheet,
  Banknote,
  Smartphone,
  Wallet,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { DriverSettlement, RidePaymentRecord, SettlementStatus } from '@/types';
import {
  formatCurrency,
  formatDateTime,
  formatPhone,
  getSettlementStatusBadge,
} from '@/utils/formatters';
import { exportToCSV } from '@/utils/exportCsv';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'settlements' | 'transactions'>('settlements');

  // Settlements state
  const [settlements, setSettlements] = useState<DriverSettlement[]>([]);
  const [settlementsLoading, setSettlementsLoading] = useState(true);
  const [settlementSearch, setSettlementSearch] = useState('');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState<string>('all');
  const [settlementPage, setSettlementPage] = useState(1);

  // Transactions (Cash vs UPI) state
  const [payments, setPayments] = useState<RidePaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentPage, setPaymentPage] = useState(1);

  const itemsPerPage = 10;

  // Settle Payout Modal state
  const [settlingRecord, setSettlingRecord] = useState<DriverSettlement | null>(null);
  const [txRef, setTxRef] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setSettlementsLoading(true);
    const unsubSettlements = paymentService.subscribeSettlements(
      (data) => {
        setSettlements(data);
        setSettlementsLoading(false);
      },
      (err) => {
        console.error('Error fetching settlements:', err);
        setSettlementsLoading(false);
      }
    );

    setPaymentsLoading(true);
    const unsubPayments = paymentService.subscribeRidePayments(
      (data) => {
        setPayments(data);
        setPaymentsLoading(false);
      },
      (err) => {
        console.error('Error fetching ride payments:', err);
        setPaymentsLoading(false);
      }
    );

    return () => {
      unsubSettlements();
      unsubPayments();
    };
  }, []);

  // Filtered settlements
  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      const q = settlementSearch.toLowerCase();
      const matchesSearch =
        s.driverName?.toLowerCase().includes(q) ||
        s.driverPhone?.includes(q) ||
        s.upiId?.toLowerCase().includes(q) ||
        s.transactionReference?.toLowerCase().includes(q);

      const matchesStatus = settlementStatusFilter === 'all' || s.status === settlementStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [settlements, settlementSearch, settlementStatusFilter]);

  // Filtered ride payment transactions
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = paymentSearch.toLowerCase();
      const matchesSearch =
        p.rideId.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.driverName && p.driverName.toLowerCase().includes(q));

      const matchesMethod = paymentMethodFilter === 'all' || p.paymentMethod === paymentMethodFilter;
      const matchesStatus = paymentStatusFilter === 'all' || p.paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [payments, paymentSearch, paymentMethodFilter, paymentStatusFilter]);

  // Aggregate stats
  const totals = useMemo(() => {
    let gross = 0;
    let commission = 0;
    let driverNet = 0;
    let pendingSettlementsCount = 0;

    settlements.forEach((s) => {
      gross += Number(s.grossEarnings || 0);
      commission += Number(s.platformCommissionDeducted || 0);
      driverNet += Number(s.netPayoutAmount || 0);
      if (s.status === 'pending') pendingSettlementsCount++;
    });

    let totalCash = 0;
    let totalUPI = 0;
    let rideFaresTotal = 0;
    payments.forEach((p) => {
      rideFaresTotal += Number(p.totalFare || 0);
      if (p.paymentMethod === 'cash') totalCash += Number(p.totalFare || 0);
      if (p.paymentMethod === 'upi') totalUPI += Number(p.totalFare || 0);
    });

    return {
      gross: gross || rideFaresTotal,
      commission,
      driverNet,
      pendingSettlementsCount,
      totalCash,
      totalUPI,
      totalTransactions: payments.length,
    };
  }, [settlements, payments]);

  const settlementTotalPages = Math.ceil(filteredSettlements.length / itemsPerPage) || 1;
  const paginatedSettlements = filteredSettlements.slice(
    (settlementPage - 1) * itemsPerPage,
    settlementPage * itemsPerPage
  );

  const paymentTotalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = filteredPayments.slice(
    (paymentPage - 1) * itemsPerPage,
    paymentPage * itemsPerPage
  );

  const handleProcessSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingRecord || !user || !txRef.trim()) return;
    setActionLoading(true);
    try {
      await paymentService.markSettlementAsPaid(
        settlingRecord.id,
        {
          transactionReference: txRef.trim(),
          notes: settleNotes.trim(),
        },
        {
          uid: user.uid,
          email: user.email || 'admin@goplmr.com',
        }
      );
      success('Settlement Recorded', `Payment reference ${txRef} saved to audit ledger.`);
      setSettlingRecord(null);
      setTxRef('');
      setSettleNotes('');
    } catch (err: any) {
      error('Settlement update failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'settlements') {
      if (settlements.length === 0) return;
      const exportRows = settlements.map((s) => ({
        'Settlement ID': s.id,
        'Driver Name': s.driverName,
        'Driver Phone': s.driverPhone,
        'UPI ID': s.upiId || '—',
        'Bank Account': s.bankAccount || '—',
        'Total Rides': s.totalRides,
        'Cash Collected': s.totalCollectedCash,
        'UPI Collected': s.totalDirectUPI,
        'Gross Earnings': s.grossEarnings,
        'Platform Commission': s.platformCommissionDeducted,
        'Net Payout': s.netPayoutAmount,
        Status: s.status,
        'Settled Date': s.settledAt || '—',
        'Transaction Ref': s.transactionReference || '—',
        'Admin Email': s.settledByEmail || '—',
      }));
      exportToCSV('GoPlmr_Settlements_Report', exportRows);
      success('Report Exported', 'Settlements CSV downloaded successfully.');
    } else {
      if (payments.length === 0) return;
      const exportRows = payments.map((p) => ({
        'Ride ID': p.rideId,
        'Customer Name': p.customerName,
        'Driver Name': p.driverName,
        Category: p.vehicleCategory,
        'Total Fare': p.totalFare,
        'Platform Commission': p.platformCommission,
        'Driver Net': p.driverEarnings,
        'Payment Method': p.paymentMethod.toUpperCase(),
        'Payment Status': p.paymentStatus,
        Timestamp: p.timestamp,
      }));
      exportToCSV('GoPlmr_Ride_Payment_Ledger', exportRows);
      success('Report Exported', 'Ride payments ledger CSV downloaded successfully.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Payments, Ledger & Driver Settlements
          </h2>
          <p className="text-xs text-slate-500">
            Audit recorded ride fares, distinguish Cash vs UPI collection, track platform commission, and process driver payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={activeTab === 'settlements' ? settlements.length === 0 : payments.length === 0}
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <span className="text-xs font-semibold text-slate-500">Gross Ride Earnings</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(totals.gross)}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
            <span className="flex items-center gap-1 text-emerald-800 font-semibold">
              <Banknote className="w-3.5 h-3.5" /> Cash: {formatCurrency(totals.totalCash)}
            </span>
            <span className="flex items-center gap-1 text-blue-700 font-semibold">
              <Smartphone className="w-3.5 h-3.5" /> UPI: {formatCurrency(totals.totalUPI)}
            </span>
          </div>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs font-semibold text-slate-500">Platform Commission</span>
          <div className="text-2xl font-extrabold text-emerald-800 mt-2">
            {formatCurrency(totals.commission)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Go Plmr platform share</p>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs font-semibold text-slate-500">Driver Net Payouts</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(totals.driverNet)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Disbursed or due to drivers</p>
        </div>

        <div className={`glass-card p-5 ${totals.pendingSettlementsCount > 0 ? 'bg-amber-50/40 border-amber-200' : ''}`}>
          <span className="text-xs font-semibold text-slate-500">Pending Settlements</span>
          <div className="text-2xl font-extrabold text-amber-700 mt-2">
            {totals.pendingSettlementsCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting payout authorization</p>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('settlements')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'settlements'
              ? 'text-emerald-800 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Driver Settlements & Payouts ({settlements.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'text-emerald-800 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Ride Payment Transactions — Cash vs UPI ({payments.length})</span>
        </button>
      </div>

      {/* TAB 1: Settlements */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <SearchInput
              value={settlementSearch}
              onChange={setSettlementSearch}
              placeholder="Search driver name, phone, UPI, tx ref..."
              className="w-full sm:w-72"
            />

            <select
              value={settlementStatusFilter}
              onChange={(e) => setSettlementStatusFilter(e.target.value)}
              className="input-field py-2 text-xs w-full sm:w-auto"
            >
              <option value="all">All Settlement Statuses</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
              <option value="processing">Processing</option>
            </select>
          </div>

          {/* Settlements Table */}
          {settlementsLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filteredSettlements.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Settlement Records Found"
              description={
                settlementSearch || settlementStatusFilter !== 'all'
                  ? 'No settlement records match your filters.'
                  : 'Driver payout cycles and settlement ledgers will populate here as drivers complete rides.'
              }
              instruction="Settlement ledgers are stored under the 'settlements' collection in Cloud Firestore."
            />
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3.5">Driver</th>
                      <th className="px-4 py-3.5">Payout Method</th>
                      <th className="px-4 py-3.5">Rides / Period</th>
                      <th className="px-4 py-3.5">Commission Deducted</th>
                      <th className="px-4 py-3.5">Net Payout</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedSettlements.map((item) => {
                      const badge = getSettlementStatusBadge(item.status);
                      const isPending = item.status === 'pending';
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-900">{item.driverName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{formatPhone(item.driverPhone)}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            {item.upiId ? (
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">UPI</span>
                                <span className="font-mono text-slate-800">{item.upiId}</span>
                              </div>
                            ) : item.bankAccount ? (
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Bank A/C</span>
                                <span className="font-mono text-slate-800">{item.bankAccount}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Cash Settlement</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-800">{item.totalRides || 0} rides</span>
                            <p className="text-[10px] text-slate-400">{item.periodStart} to {item.periodEnd}</p>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-emerald-800">
                            {formatCurrency(item.platformCommissionDeducted)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {formatCurrency(item.netPayoutAmount)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`badge ${badge.className}`}>{badge.text}</span>
                            {item.transactionReference && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">
                                Ref: {item.transactionReference}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {isPending ? (
                              <button
                                onClick={() => setSettlingRecord(item)}
                                className="btn-primary text-[11px] px-3 py-1.5"
                              >
                                Mark Paid
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatDateTime(item.settledAt)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={settlementPage}
                totalPages={settlementTotalPages}
                onPageChange={setSettlementPage}
                totalItems={filteredSettlements.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Ride Payment Transactions (Cash vs UPI) */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <SearchInput
              value={paymentSearch}
              onChange={setPaymentSearch}
              placeholder="Search Ride ID, customer, or driver..."
              className="w-full sm:w-72"
            />

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="input-field py-2 text-xs flex-1 sm:flex-initial"
              >
                <option value="all">All Payment Methods</option>
                <option value="cash">Cash on Delivery</option>
                <option value="upi">UPI / Online</option>
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="input-field py-2 text-xs flex-1 sm:flex-initial"
              >
                <option value="all">All Payment Statuses</option>
                <option value="completed">Completed / Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Ride Payments Table */}
          {paymentsLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No Ride Payment Transactions Found"
              description={
                paymentSearch || paymentMethodFilter !== 'all' || paymentStatusFilter !== 'all'
                  ? 'No ride payments match your search criteria.'
                  : 'Individual ride payment transactions will stream here in real-time as rides are booked and completed.'
              }
              instruction="Transaction records are extracted directly from the 'rides' collection."
            />
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3.5">Ride / Customer</th>
                      <th className="px-4 py-3.5">Driver & Vehicle</th>
                      <th className="px-4 py-3.5">Payment Mode</th>
                      <th className="px-4 py-3.5">Gross Fare</th>
                      <th className="px-4 py-3.5">Commission</th>
                      <th className="px-4 py-3.5">Driver Earnings</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{p.customerName}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                            ID: {p.rideId.slice(0, 10)}...
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800">{p.driverName || '—'}</p>
                          <span className="badge badge-info text-[10px] uppercase font-bold mt-0.5 inline-block">
                            {p.vehicleCategory}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {p.paymentMethod === 'upi' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                              <Smartphone className="w-3 h-3" /> UPI / Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                              <Banknote className="w-3 h-3" /> Cash
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 text-sm">
                          {formatCurrency(p.totalFare)}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-emerald-800">
                          {formatCurrency(p.platformCommission)}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800">
                          {formatCurrency(p.driverEarnings)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`badge ${
                              p.paymentStatus === 'completed'
                                ? 'badge-success'
                                : p.paymentStatus === 'failed'
                                ? 'badge-danger'
                                : 'badge-warning'
                            }`}
                          >
                            {p.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-[11px] text-slate-500">
                          {formatDateTime(p.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={paymentPage}
                totalPages={paymentTotalPages}
                onPageChange={setPaymentPage}
                totalItems={filteredPayments.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Settle Payout Modal */}
      {settlingRecord && (
        <Modal
          isOpen={Boolean(settlingRecord)}
          onClose={() => {
            setSettlingRecord(null);
            setTxRef('');
            setSettleNotes('');
          }}
          title="Process Driver Settlement"
          subtitle={`Driver: ${settlingRecord.driverName}`}
          maxWidth="md"
        >
          <form onSubmit={handleProcessSettlement} className="space-y-4 text-xs">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Net Payout Amount:</span>
                <strong className="text-emerald-950 text-sm">
                  {formatCurrency(settlingRecord.netPayoutAmount)}
                </strong>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Payout Destination:</span>
                <strong className="text-slate-800 font-mono">
                  {settlingRecord.upiId || settlingRecord.bankAccount || 'Direct Cash'}
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank / UPI Transaction Reference Number (Required)
              </label>
              <input
                type="text"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="e.g. UPI/1234567890/HDFC or NEFT Reference"
                required
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Settlement Notes
              </label>
              <textarea
                rows={2}
                value={settleNotes}
                onChange={(e) => setSettleNotes(e.target.value)}
                placeholder="Optional audit notes regarding bank transfer or reconciliation..."
                className="input-field"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSettlingRecord(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !txRef.trim()}
                className="btn-primary text-xs px-4 py-2"
              >
                {actionLoading ? 'Recording...' : 'Confirm & Mark Settled'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
