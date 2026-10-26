import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  Car,
  Users,
  AlertTriangle,
  Receipt,
  ExternalLink,
} from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { useToast } from '@/context/ToastContext';
import type { AdminNotification } from '@/types';
import { formatDateTime } from '@/utils/formatters';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const { success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const unsub = notificationService.subscribeNotifications(
      (data) => {
        setNotifications(data);
        setLoading(false);
      },
      () => {
        setNotifications([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(notifications);
    success('All notifications marked as read');
  };

  const handleNotificationClick = async (notif: AdminNotification) => {
    if (!notif.read) {
      await notificationService.markAsRead(notif.id);
    }
    if (notif.targetUrl) {
      navigate(notif.targetUrl);
    }
  };

  const filteredNotifs = filterUnreadOnly
    ? notifications.filter((n) => !n.read)
    : notifications;

  const getNotifIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'driver_application':
        return <Car className="w-4 h-4 text-emerald-600" />;
      case 'ride_incident':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'complaint':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'settlement':
        return <Receipt className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Platform Notifications & Activity Feed
          </h2>
          <p className="text-xs text-slate-500">
            Real-time administrative alerts for driver applications, incidents, and complaints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={filterUnreadOnly}
              onChange={(e) => setFilterUnreadOnly(e.target.checked)}
              className="rounded text-emerald-700 accent-emerald-700"
            />
            <span>Unread Only</span>
          </label>

          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="btn-secondary text-xs px-3.5 py-2"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredNotifs.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications Yet"
          description={
            filterUnreadOnly
              ? 'You have caught up with all platform notifications.'
              : 'Alerts for driver verification, customer disputes, and settlements will stream here in real time.'
          }
          instruction="Stored in the 'notifications' collection in Cloud Firestore."
        />
      ) : (
        <div className="glass-panel divide-y divide-slate-100 overflow-hidden">
          {filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors ${
                !notif.read ? 'bg-emerald-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                  {getNotifIcon(notif.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                    {!notif.read && (
                      <span className="badge badge-warning text-[10px]">Unread</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">
                    {formatDateTime(notif.createdAt)}
                  </span>
                </div>
              </div>

              {notif.targetUrl && (
                <span className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 shrink-0">
                  <span>View</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
