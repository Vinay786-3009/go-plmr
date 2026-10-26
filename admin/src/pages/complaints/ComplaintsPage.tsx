import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquareWarning,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  User,
  Car,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { complaintService } from '@/services/complaintService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { ComplaintRecord, ComplaintStatus, ComplaintCategory, ComplaintPriority } from '@/types';
import { formatCurrency, formatDateTime, getComplaintStatusBadge } from '@/utils/formatters';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';

export const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected complaint for support workbench modal
  const [selectedTicket, setSelectedTicket] = useState<ComplaintRecord | null>(null);
  const [newNote, setNewNote] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = complaintService.subscribeComplaints(
      (data) => {
        setComplaints(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching complaints:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredComplaints = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return complaints.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.ticketNumber?.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.raisedByName?.toLowerCase().includes(q) ||
        c.rideId?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;

      let matchesDate = true;
      if (dateFilter !== 'all' && c.createdAt) {
        const itemTime = new Date(c.createdAt).getTime();
        if (dateFilter === 'today') {
          matchesDate = itemTime >= todayStart;
        } else if (dateFilter === '7d') {
          matchesDate = itemTime >= sevenDaysAgo;
        } else if (dateFilter === '30d') {
          matchesDate = itemTime >= thirtyDaysAgo;
        }
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesDate;
    });
  }, [complaints, searchQuery, statusFilter, categoryFilter, priorityFilter, dateFilter]);

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage) || 1;
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !user || !newNote.trim()) return;
    setActionLoading(true);
    try {
      await complaintService.addInternalNote(selectedTicket.id, newNote.trim(), {
        uid: user.uid,
        email: user.email || 'admin@goplmr.com',
      });
      success('Internal Note Added');
      setNewNote('');
      // Refresh local selectedTicket
      const updated = await complaintService.getComplaintById(selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    } catch (err: any) {
      error('Failed to add note', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (status: 'resolved' | 'rejected') => {
    if (!selectedTicket || !user) return;
    if (status === 'resolved' && !resolutionNotes.trim()) {
      error('Resolution note required', 'Please provide resolution remarks before closing.');
      return;
    }
    setActionLoading(true);
    try {
      await complaintService.updateComplaintStatus(
        selectedTicket.id,
        {
          status,
          resolutionNotes: resolutionNotes.trim() || 'Closed by administrator',
          refundAmount: Number(refundAmount) || 0,
        },
        {
          uid: user.uid,
          email: user.email || 'admin@goplmr.com',
        }
      );
      success(`Ticket ${status === 'resolved' ? 'Resolved' : 'Rejected'}`, 'Audit trail updated.');
      setSelectedTicket(null);
      setResolutionNotes('');
      setRefundAmount(0);
    } catch (err: any) {
      error('Resolution update failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadge = (p: ComplaintPriority) => {
    switch (p) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Complaints & Customer Support
          </h2>
          <p className="text-xs text-slate-500">
            Investigate rider and driver disputes, record internal notes, and process refund decisions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search ticket #, subject, rider..."
            className="w-full sm:w-64"
          />

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="input-field py-2 text-xs w-auto"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-xs w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-field py-2 text-xs w-auto"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          icon={MessageSquareWarning}
          title="No Support Tickets Found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'No complaint records match your filters.'
              : 'Customer support tickets and ride incident reports will populate here when submitted from the apps.'
          }
          instruction="Tickets are stored under the 'complaints' collection in Cloud Firestore."
        />
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3.5">Ticket #</th>
                  <th className="px-4 py-3.5">Raised By</th>
                  <th className="px-4 py-3.5">Subject & Category</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedComplaints.map((ticket) => {
                  const badge = getComplaintStatusBadge(ticket.status);
                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        {ticket.ticketNumber || `#TKT-${ticket.id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{ticket.raisedByName}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{ticket.raisedByRole}</p>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">{ticket.subject}</p>
                        <span className="text-[10px] text-slate-400 capitalize">
                          Category: {ticket.category?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge border text-[10px] uppercase font-bold ${getPriorityBadge(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${badge.className}`}>{badge.text}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {formatDateTime(ticket.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setResolutionNotes(ticket.resolutionNotes || '');
                            setRefundAmount(ticket.refundAmount || 0);
                          }}
                          className="btn-secondary text-[11px] px-2.5 py-1.5"
                        >
                          Workbench
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
            totalItems={filteredComplaints.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Support Workbench Modal */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket ${selectedTicket.ticketNumber || `#${selectedTicket.id.slice(-6).toUpperCase()}`}: ${selectedTicket.subject}`}
          subtitle={`Raised by ${selectedTicket.raisedByName} (${selectedTicket.raisedByRole})`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`badge ${getComplaintStatusBadge(selectedTicket.status).className}`}>
                  {getComplaintStatusBadge(selectedTicket.status).text}
                </span>
                <span className={`badge border text-[10px] font-bold uppercase ${getPriorityBadge(selectedTicket.priority)}`}>
                  Priority: {selectedTicket.priority}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed text-xs pt-1">{selectedTicket.description}</p>
              {selectedTicket.rideId && (
                <p className="text-[11px] text-slate-500 font-mono pt-1">
                  Associated Ride ID: <strong>{selectedTicket.rideId}</strong>
                </p>
              )}
            </div>

            {/* Internal Staff Notes Feed */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Internal Staff Discussion & History
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(!selectedTicket.internalNotes || selectedTicket.internalNotes.length === 0) ? (
                  <p className="text-slate-400 italic text-[11px]">No staff notes recorded yet.</p>
                ) : (
                  selectedTicket.internalNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <strong className="text-emerald-800">{note.adminEmail}</strong>
                        <span>{formatDateTime(note.createdAt)}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-xs">{note.note}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type an internal admin note..."
                  className="input-field py-2 text-xs"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !newNote.trim()}
                  className="btn-primary text-xs px-3 py-2 shrink-0 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            </div>

            {/* Resolution Box */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Resolution & Financial Adjustment
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Resolution Remarks (Required to close)
                  </label>
                  <input
                    type="text"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="e.g. Fare recalculated, driver warned, refund credited..."
                    className="input-field py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Refund Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="input-field py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleResolve('rejected')}
                  className="btn-secondary text-rose-600 border-rose-200 text-xs px-3 py-2"
                >
                  Reject Complaint
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleResolve('resolved')}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolve & Close Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
