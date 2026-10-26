import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Home,
  Shield,
  CreditCard,
  Clock,
  Heart,
  Gift,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  X,
  User,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const SideDrawer = ({ isOpen, onClose }) => {
  const { user, profile, emailVerified, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
    success('Logged out successfully.');
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home, color: 'text-emerald-500 bg-emerald-50' },
    { to: '/rides', label: 'My Rides', icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { to: '/places', label: 'Saved Places & Favorites', icon: Heart, color: 'text-rose-500 bg-rose-50' },
    { to: '/verify-email', label: 'Safety & Verification', icon: Shield, color: 'text-sky-500 bg-sky-50', badge: emailVerified ? 'Verified' : 'Verify' },
    { to: '/profile', label: 'Payments & Settings', icon: CreditCard, color: 'text-indigo-500 bg-indigo-50' },
    { to: '/support', label: 'Support & Complaints', icon: HelpCircle, color: 'text-pink-500 bg-pink-50' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
        {/* User Profile Header (Yellow header like Ride-Karo / Rapido) */}
        <div className="bg-[#F9D342] p-5 pb-6 text-slate-900 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-800 hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {user ? (
            <div className="flex items-center gap-3.5 mt-2">
              <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
                {(profile?.fullName || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-slate-900 leading-tight">
                  {profile?.fullName || 'GO PLMR Rider'}
                </span>
                <span className="text-xs text-slate-800/80 font-medium truncate max-w-[160px]">
                  {user.email}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  {emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-white/70 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3 text-amber-700" />
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-lg font-black text-slate-900">Welcome to GO PLMR</span>
              <p className="text-xs text-slate-800/80">Palamaner's favorite bike & auto ride service</p>
              <Link
                to="/login"
                onClick={onClose}
                className="btn-black text-xs py-2 px-4 inline-flex items-center justify-center mt-2"
              >
                Sign In / Register
              </Link>
            </div>
          )}
        </div>

        {/* Menu Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badge === 'Verified'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          <div className="pt-2 my-2 border-t border-slate-100" />

          {/* Quick Support & Info */}
          <Link
            to="/support"
            onClick={onClose}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-100 text-slate-700 text-xs font-bold"
          >
            <HelpCircle className="w-5 h-5 text-slate-500" />
            <span>Support & Complaints</span>
          </Link>

          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-rose-50 text-rose-600 text-xs font-bold text-left transition-colors"
            >
              <LogOut className="w-5 h-5 text-rose-500" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Bottom Version */}
        <div className="p-4 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
          GO PLMR Customer v1.0.0 • Palamaner, AP
        </div>
      </div>
    </div>
  );
};
