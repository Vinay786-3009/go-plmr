import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { 
  Power, 
  User, 
  FileText, 
  IndianRupee, 
  History, 
  ShieldCheck, 
  AlertCircle,
  Menu,
  X
} from 'lucide-react';

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { user, driverProfile, approvalStatus, logout } = useAuth();
  const { isOnline, toggleOnline, actionLoading, activeRide } = useRide();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isApproved = approvalStatus === 'approved';

  return (
    <header className="sticky top-0 z-40 bg-charcoal-900/95 backdrop-blur-md border-b border-charcoal-800">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-charcoal-950 font-black shadow-md shadow-brand-500/20">
            <span className="text-base tracking-tighter">PLMR</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm tracking-tight">GO PLMR</span>
              <span className="bg-brand-500/20 text-brand-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-brand-500/30 uppercase tracking-wider">
                Driver
              </span>
            </div>
            <p className="text-[10px] text-charcoal-400 font-medium">Palamaner Partner</p>
          </div>
        </div>

        {/* Right Action: Online Toggle or Approval Badge */}
        <div className="flex items-center gap-2">
          {isApproved ? (
            <button
              onClick={toggleOnline}
              disabled={actionLoading || Boolean(activeRide)}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-xs transition-all shadow-sm ${
                isOnline
                  ? 'bg-emerald-500 text-charcoal-950 shadow-emerald-500/20 hover:bg-emerald-400'
                  : 'bg-charcoal-800 text-charcoal-300 border border-charcoal-700 hover:bg-charcoal-700'
              } ${activeRide ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-charcoal-950 animate-pulse' : 'bg-charcoal-500'
                }`}
              />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{approvalStatus.toUpperCase()}</span>
            </span>
          )}

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl text-charcoal-300 hover:text-white hover:bg-charcoal-800 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Dropdown Navigation Menu */}
      {menuOpen && (
        <div className="border-t border-charcoal-800 bg-charcoal-900/98 px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
          {driverProfile && (
            <div className="pb-2.5 mb-2 border-b border-charcoal-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-400 flex items-center justify-center font-bold text-sm overflow-hidden">
                {driverProfile.photoUrl || driverProfile.profileImageUrl ? (
                  <img src={driverProfile.photoUrl || driverProfile.profileImageUrl} alt="Driver" className="w-full h-full object-cover" />
                ) : (
                  (driverProfile.fullName || 'D')[0].toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{driverProfile.fullName || 'Driver Partner'}</p>
                <p className="text-[11px] text-charcoal-400 truncate">{driverProfile.phoneNumber || driverProfile.email}</p>
                <p className="text-[10px] text-brand-400 font-medium capitalize">
                  {driverProfile.vehicleCategory} • {driverProfile.vehicleDetails?.plateNumber || 'No Plate'}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => { setCurrentTab('dashboard'); setMenuOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              currentTab === 'dashboard' ? 'bg-brand-500 text-charcoal-950 font-bold' : 'text-charcoal-300 hover:bg-charcoal-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Dashboard & Map</span>
          </button>

          <button
            onClick={() => { setCurrentTab('earnings'); setMenuOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              currentTab === 'earnings' ? 'bg-brand-500 text-charcoal-950 font-bold' : 'text-charcoal-300 hover:bg-charcoal-800'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            <span>Today's Earnings & Payouts</span>
          </button>

          <button
            onClick={() => { setCurrentTab('history'); setMenuOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              currentTab === 'history' ? 'bg-brand-500 text-charcoal-950 font-bold' : 'text-charcoal-300 hover:bg-charcoal-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Trip History</span>
          </button>

          <button
            onClick={() => { setCurrentTab('profile'); setMenuOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              currentTab === 'profile' ? 'bg-brand-500 text-charcoal-950 font-bold' : 'text-charcoal-300 hover:bg-charcoal-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Driver Profile & Vehicle Docs</span>
          </button>

          <div className="pt-2 border-t border-charcoal-800">
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Power className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
