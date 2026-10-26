import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  ExternalLink,
  Camera,
  Car,
} from 'lucide-react';
import { helmetService } from '@/services/helmetService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { HelmetVerificationRecord, HelmetReviewStatus } from '@/types';
import { formatDateTime } from '@/utils/formatters';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';

export const HelmetCompliancePage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [records, setRecords] = useState<HelmetVerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected verification record for reviewing
  const [selectedRecord, setSelectedRecord] = useState<HelmetVerificationRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = helmetService.subscribeHelmetRecords(
      (data) => {
        setRecords(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching helmet records:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        rec.driverName?.toLowerCase().includes(q) ||
        rec.vehiclePlate?.toLowerCase().includes(q) ||
        rec.rideId?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleReviewAction = async (status: HelmetReviewStatus, addStrike: boolean) => {
    if (!selectedRecord || !user) return;
    setActionLoading(true);
    try {
      await helmetService.reviewRecord(
        selectedRecord.id,
        {
          status,
          reviewNotes: reviewNotes.trim(),
          addStrike,
          driverId: selectedRecord.driverId,
        },
        {
          uid: user.uid,
          email: user.email || 'admin@goplmr.com',
        }
      );

      success(
        'Compliance Review Updated',
        addStrike ? '1 Safety Strike added to driver profile.' : `Status updated to ${status}.`
      );
      setSelectedRecord(null);
      setReviewNotes('');
    } catch (err: any) {
      error('Review update failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status: HelmetReviewStatus) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending Review', class: 'badge-warning' };
      case 'approved':
        return { text: 'Helmet Compliant', class: 'badge-success' };
      case 'warning_issued':
        return { text: 'Warning Issued', class: 'badge-warning' };
      case 'strike_applied':
        return { text: 'Strike Applied (Violation)', class: 'badge-danger' };
      case 'rejected':
        return { text: 'Invalid Evidence', class: 'badge-neutral' };
      default:
        return { text: status, class: 'badge-neutral' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Bike Helmet Safety & Verification
            </h2>
            <span className="badge badge-success">Palamaner Two-Wheelers</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit photo evidence uploaded by bike drivers before trip departure to enforce safety rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search driver, bike plate, ride ID..."
            className="w-full sm:w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-xs w-auto"
          >
            <option value="all">All Compliance Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved Compliant</option>
            <option value="warning_issued">Warning Issued</option>
            <option value="strike_applied">Strike Applied</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No Helmet Verification Records"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'No records match your filters.'
              : 'Bike helmet verification selfies uploaded by drivers before starting bike rides in Palamaner will appear here.'
          }
          instruction="Stored in the 'helmetVerifications' collection in Cloud Firestore."
        />
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3.5">Driver / Bike</th>
                  <th className="px-4 py-3.5">Ride Reference</th>
                  <th className="px-4 py-3.5">Photo Evidence</th>
                  <th className="px-4 py-3.5">Review Status</th>
                  <th className="px-4 py-3.5">Uploaded Time</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map((record) => {
                  const chip = getStatusChip(record.status);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{record.driverName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{record.vehiclePlate}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700">
                        #{record.rideId?.slice(-6).toUpperCase() || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        {record.photoUrl ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={record.photoUrl}
                              alt="Helmet Selfie"
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                            />
                            <span className="text-[11px] text-emerald-700 font-semibold">Selfie Attached</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No image file</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${chip.class}`}>{chip.text}</span>
                        {record.strikeAdded && (
                          <span className="ml-1.5 badge badge-danger text-[10px]">+1 Strike</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {formatDateTime(record.timestamp)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setReviewNotes(record.reviewNotes || '');
                          }}
                          className="btn-secondary text-[11px] px-2.5 py-1.5 flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Review</span>
                        </button>
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
            totalItems={filteredRecords.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Review & Audit Modal */}
      {selectedRecord && (
        <Modal
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          title={`Review Helmet Evidence: ${selectedRecord.driverName}`}
          subtitle={`Plate: ${selectedRecord.vehiclePlate} • Ride #${selectedRecord.rideId?.slice(-6).toUpperCase()}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Image Preview Box */}
            <div className="p-4 bg-slate-900 rounded-2xl text-center">
              {selectedRecord.photoUrl ? (
                <div className="space-y-2">
                  <img
                    src={selectedRecord.photoUrl}
                    alt="Driver Helmet"
                    className="max-h-72 mx-auto rounded-xl object-contain shadow-lg"
                  />
                  <a
                    href={selectedRecord.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline pt-1"
                  >
                    <span>Open High-Res Photo in New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="py-12 text-slate-400">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No photo evidence attached to this verification record.</p>
                </div>
              )}
            </div>

            {/* Review Notes Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Review Notes & Safety Remarks
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Helmet properly strapped, ISI certification mark visible..."
                className="input-field"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="btn-secondary text-xs px-3.5 py-2"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReviewAction('warning_issued', false)}
                  className="btn-secondary text-amber-700 border-amber-300 hover:bg-amber-50 text-xs px-3 py-2"
                >
                  Issue Warning
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReviewAction('strike_applied', true)}
                  className="btn-danger text-xs px-3 py-2 flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Apply Strike (+1)</span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReviewAction('approved', false)}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Compliant</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
