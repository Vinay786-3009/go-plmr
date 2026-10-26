import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollText,
  Search,
  Download,
  ShieldCheck,
  Clock,
  Filter,
  Eye,
  FileCode,
} from 'lucide-react';
import { auditService } from '@/services/auditService';
import { useToast } from '@/context/ToastContext';
import type { AuditLogRecord } from '@/types';
import { formatDateTime } from '@/utils/formatters';
import { exportToCSV } from '@/utils/exportCsv';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const { success } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getRecentLogs(200);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        log.action?.toLowerCase().includes(q) ||
        log.adminEmail?.toLowerCase().includes(q) ||
        log.adminUid?.toLowerCase().includes(q) ||
        log.targetId?.toLowerCase().includes(q) ||
        log.reason?.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'all' || log.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [logs, searchQuery, categoryFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    if (logs.length === 0) return;
    const exportRows = logs.map((l) => ({
      'Log ID': l.id,
      'Admin Email': l.adminEmail,
      'Admin UID': l.adminUid,
      Action: l.action,
      Category: l.category,
      'Target ID': l.targetId || '—',
      Reason: l.reason || '—',
      Timestamp: l.timestamp,
      Details: JSON.stringify(l.details || {}),
    }));
    exportToCSV('GoPlmr_AuditLogs', exportRows);
    success('Audit Trail Exported', 'CSV file downloaded.');
  };

  const getCategoryBadge = (cat: AuditLogRecord['category']) => {
    switch (cat) {
      case 'driver':
        return 'badge-success';
      case 'customer':
        return 'badge-info';
      case 'fare':
        return 'badge-warning';
      case 'settlement':
        return 'badge-success';
      case 'complaint':
        return 'badge-warning';
      case 'service_area':
        return 'badge-info';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Administrative Audit Log & Trail
            </h2>
            <span className="badge badge-success flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Immutable Record</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically timestamped ledger of every driver approval, fare adjustment, suspension, and payout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search admin, action, target ID, reason..."
          className="w-full sm:w-80"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field py-2 text-xs w-full sm:w-auto"
        >
          <option value="all">All Audit Categories</option>
          <option value="driver">Driver Actions</option>
          <option value="customer">Customer Actions</option>
          <option value="fare">Fare Configurations</option>
          <option value="settlement">Settlements & Payouts</option>
          <option value="complaint">Complaint Resolutions</option>
          <option value="service_area">Service Area Updates</option>
          <option value="auth">Authentication & Roles</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} columns={5} />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No Audit Logs Recorded Yet"
          description={
            searchQuery || categoryFilter !== 'all'
              ? 'No audit log entries match your filter criteria.'
              : 'Every administrative action performed in the Go Plmr Admin Panel will automatically record here.'
          }
          instruction="Stored in the 'auditLogs' collection in Cloud Firestore."
        />
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3.5">Action / Category</th>
                  <th className="px-4 py-3.5">Administrator</th>
                  <th className="px-4 py-3.5">Target Record</th>
                  <th className="px-4 py-3.5">Reason / Remarks</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                          {log.action}
                        </span>
                        <span className={`badge ${getCategoryBadge(log.category)} text-[10px]`}>
                          {log.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-800 truncate max-w-[160px]">{log.adminEmail}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">UID: {log.adminUid}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">
                      {log.targetId ? (
                        <span title={log.targetId}>
                          {log.targetType ? `${log.targetType}: ` : ''}
                          {log.targetId.slice(0, 12)}...
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                      {log.reason || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn-secondary text-[11px] px-2.5 py-1.5"
                      >
                        Inspect
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
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* JSON Inspector Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Record: ${selectedLog.action}`}
          subtitle={`By ${selectedLog.adminEmail} • ${formatDateTime(selectedLog.timestamp)}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <p><strong>Action Type:</strong> <code className="text-emerald-800 font-bold">{selectedLog.action}</code></p>
              <p><strong>Category:</strong> <span className="capitalize">{selectedLog.category}</span></p>
              <p><strong>Target Record ID:</strong> <code className="font-mono text-slate-700">{selectedLog.targetId || 'N/A'}</code></p>
              {selectedLog.reason && (
                <p><strong>Recorded Reason:</strong> <span className="text-slate-800">{selectedLog.reason}</span></p>
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-700" />
                <span>Raw Payload / Mutation Diff</span>
              </h4>
              <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-64 leading-relaxed">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
