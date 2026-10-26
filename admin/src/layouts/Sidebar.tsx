import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  Compass,
  MapPin,
  CircleDollarSign,
  Receipt,
  ShieldAlert,
  MessageSquareWarning,
  Sliders,
  Bell,
  ScrollText,
  KeyRound,
  X,
  ChevronRight,
} from 'lucide-react';
import { PALAMANER_COORDINATES } from '@/services/firebase/firebase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  collapsed,
}) => {
  const navGroups = [
    {
      group: 'Overview & Operations',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/live-monitoring', label: 'Live Map Tracking', icon: Compass },
        { path: '/rides', label: 'Rides Management', icon: Car },
      ],
    },
    {
      group: 'User & Fleet Management',
      items: [
        { path: '/drivers', label: 'Drivers & Fleet', icon: Car },
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/helmet-compliance', label: 'Helmet Safety', icon: ShieldAlert },
      ],
    },
    {
      group: 'Financial & Pricing',
      items: [
        { path: '/fare-settings', label: 'Fare Settings', icon: CircleDollarSign },
        { path: '/payments', label: 'Payouts & Settlements', icon: Receipt },
      ],
    },
    {
      group: 'Support & Configuration',
      items: [
        { path: '/complaints', label: 'Complaints & Support', icon: MessageSquareWarning },
        { path: '/service-area', label: 'Service Area (Palamaner)', icon: MapPin },
        { path: '/notifications', label: 'Notifications', icon: Bell },
        { path: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
        { path: '/admin-setup', label: 'Admin Security Setup', icon: KeyRound },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-emerald-100/60 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center font-extrabold text-lg shadow-md ring-2 ring-emerald-400/30">
            GP
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight">Go Plmr</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-700/80 text-emerald-100 border border-emerald-600">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 font-medium">
              {PALAMANER_COORDINATES.cityName}, AP
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {navGroups.map((grp, idx) => (
          <div key={idx} className="space-y-1.5">
            <h5 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {grp.group}
            </h5>
            <div className="space-y-1">
              {grp.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/70'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-emerald-100/50 bg-slate-50/70 text-center">
        <div className="text-[11px] font-medium text-slate-500">
          Go Plmr • Palamaner, AP
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          v1.0.0 Production Admin
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-emerald-100 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass-sidebar shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
};
