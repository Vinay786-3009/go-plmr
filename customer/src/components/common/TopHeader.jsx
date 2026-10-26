import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';

export const TopHeader = ({ onOpenDrawer }) => {
  const { user, profile, emailVerified } = useAuth();

  return (
    <header className="yellow-header">
      {/* Left: Hamburger Menu */}
      <button
        onClick={onOpenDrawer}
        className="p-1.5 -ml-1 rounded-xl text-slate-900 hover:bg-black/10 transition-colors"
        aria-label="Open Navigation Menu"
      >
        <Menu className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Center: Brand */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-slate-900 text-[#F9D342] flex items-center justify-center font-black text-xs shadow-sm">
          GO
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-black text-base tracking-tight text-slate-900">PLMR</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/10 text-slate-900">
              Rider
            </span>
          </div>
          <span className="text-[10px] text-slate-800 font-semibold leading-none">
            Palamaner, AP
          </span>
        </div>
      </Link>

      {/* Right: User / Help */}
      <div className="flex items-center gap-1.5">
        <Link
          to="/support"
          className="p-1.5 rounded-xl text-slate-900 hover:bg-black/10 transition-colors"
          title="Help & FAQs"
        >
          <HelpCircle className="w-5 h-5 stroke-[2.2]" />
        </Link>

        {user ? (
          <Link
            to="/profile"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs shadow-sm border border-black/20"
          >
            {(profile?.fullName || user.email || 'U')[0].toUpperCase()}
          </Link>
        ) : (
          <Link
            to="/login"
            className="text-xs font-black text-slate-900 bg-white hover:bg-slate-100 px-3 py-1 rounded-full shadow-sm"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
};
