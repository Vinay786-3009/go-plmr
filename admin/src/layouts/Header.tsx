import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { notificationService } from '@/services/notificationService';
import type { AdminNotification } from '@/types';
import { formatDateTime } from '@/utils/formatters';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, claims, logout } = useAuth();
  const { success, error } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time notifications
  useEffect(() => {
    const unsub = notificationService.subscribeNotifications(
      (data) => setNotifications(data),
      () => setNotifications([])
    );
    return () => unsub();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      success('Logged out successfully');
      navigate('/login');
    } catch (err: any) {
      error('Logout failed', err.message);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(notifications);
  };

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Dashboard & Platform Metrics';
      case '/drivers':
        return 'Driver & Fleet Management';
      case '/customers':
        return 'Customer Management';
      case '/rides':
        return 'Ride Management';
      case '/live-monitoring':
        return 'Live GPS Tracking (Palamaner)';
      case '/fare-settings':
        return 'Vehicle Categories & Fare Settings';
      case '/payments':
        return 'Payments & Settlements';
      case '/helmet-compliance':
        return 'Bike Helmet Safety Compliance';
      case '/complaints':
        return 'Complaints & Support Tickets';
      case '/service-area':
        return 'Service Area & Geofencing';
      case '/notifications':
        return 'Platform Notifications';
      case '/audit-logs':
        return 'Administrative Audit Trail';
      case '/admin-setup':
        return 'Admin Setup & Custom Claims';
      default:
        return 'Admin Portal';
    }
  };

  return (
    <header className="glass-header px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left side: Hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-emerald-800 rounded-xl hover:bg-emerald-50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {getPageTitle(location.pathname)}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Go Plmr Operations • Palamaner, Andhra Pradesh
          </p>
        </div>
      </div>

      {/* Right side: Firebase badge, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Firebase Connected Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Project: go-plmr</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-emerald-800 rounded-xl hover:bg-emerald-50 border border-slate-200/60 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-emerald-100 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="badge badge-warning text-[10px]">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No platform alerts yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors ${
                        !n.read ? 'bg-emerald-50/40' : ''
                      }`}
                      onClick={() => {
                        notificationService.markAsRead(n.id);
                        if (n.targetUrl) navigate(n.targetUrl);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notifications');
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-emerald-50 border border-slate-200/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="hidden sm:block text-left pr-1">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {user?.email?.split('@')[0] || 'Administrator'}
              </p>
              <p className="text-[10px] font-semibold text-emerald-700">Go Plmr Admin</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-emerald-100 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 p-2">
              <div className="p-3 border-b border-slate-100 bg-slate-50/70 rounded-xl">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Custom Claim: {claims?.admin ? 'admin=true' : 'Firestore Auth'}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  UID: {user?.uid}
                </div>
              </div>

              <div className="py-1 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/admin-setup');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-lg transition-colors text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Admin Security Claims</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
