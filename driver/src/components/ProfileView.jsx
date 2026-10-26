import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Car, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Phone, 
  Mail, 
  LogOut, 
  MapPin, 
  ExternalLink,
  AlertTriangle 
} from 'lucide-react';

export const ProfileView = () => {
  const { user, driverProfile, approvalStatus, logout } = useAuth();

  if (!driverProfile) return null;

  const vehicle = driverProfile.vehicleDetails || {};
  const documents = driverProfile.documents || {};
  const strikes = driverProfile.helmetStrikes || 0;

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="relative w-20 h-20 mx-auto rounded-full bg-brand-500/20 border-2 border-brand-500/40 text-brand-400 flex items-center justify-center font-bold text-2xl overflow-hidden shadow-xl shadow-brand-500/10">
          {driverProfile.photoUrl || driverProfile.profileImageUrl ? (
            <img src={driverProfile.photoUrl || driverProfile.profileImageUrl} alt="Driver" className="w-full h-full object-cover" />
          ) : (
            (driverProfile.fullName || 'D')[0].toUpperCase()
          )}
        </div>

        <div>
          <h2 className="text-lg font-black text-white">{driverProfile.fullName || 'Partner Driver'}</h2>
          <p className="text-xs text-charcoal-400">{driverProfile.email}</p>
        </div>

        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          approvalStatus === 'approved' 
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
        }`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Status: {approvalStatus}</span>
        </span>
      </div>

      {/* Helmet Compliance Warning if strikes recorded */}
      {strikes > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <span className="font-bold">Helmet Compliance Strikes: {strikes}/3</span>
            <p className="text-[11px] text-rose-300/80 mt-0.5">
              Admin recorded compliance strikes. Receiving 3 strikes leads to temporary driver suspension in Palamaner.
            </p>
          </div>
        </div>
      )}

      {/* Vehicle Info Card */}
      <div className="p-4 rounded-3xl bg-charcoal-900 border border-charcoal-800 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-charcoal-800 text-xs font-bold text-white">
          <Car className="w-4 h-4 text-brand-400" />
          <span>Vehicle Details</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-charcoal-400 block">Category</span>
            <span className="font-bold text-brand-400 uppercase">{driverProfile.vehicleCategory || 'Auto'}</span>
          </div>
          <div>
            <span className="text-[10px] text-charcoal-400 block">Plate Number</span>
            <span className="font-mono font-bold text-white">{vehicle.plateNumber || 'AP 03 XX 0000'}</span>
          </div>
          <div>
            <span className="text-[10px] text-charcoal-400 block">Make & Model</span>
            <span className="text-white">{vehicle.makeModel || '—'}</span>
          </div>
          <div>
            <span className="text-[10px] text-charcoal-400 block">Color / Year</span>
            <span className="text-white">{vehicle.color || '—'} ({vehicle.year || '—'})</span>
          </div>
        </div>
      </div>

      {/* Documents Status */}
      <div className="p-4 rounded-3xl bg-charcoal-900 border border-charcoal-800 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-charcoal-800 text-xs font-bold text-white">
          <FileText className="w-4 h-4 text-brand-400" />
          <span>Driver Documents</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-charcoal-800/50">
            <div>
              <span className="font-medium text-white block">Driving License</span>
              <span className="text-[10px] text-charcoal-400 font-mono">{documents.dlNumber || 'Submitted'}</span>
            </div>
            {documents.dlUrl ? (
              <a
                href={documents.dlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-brand-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[10px] text-emerald-400 font-bold">On Record</span>
            )}
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-charcoal-800/50">
            <div>
              <span className="font-medium text-white block">Registration Certificate (RC)</span>
              <span className="text-[10px] text-charcoal-400 font-mono">{documents.rcNumber || 'Submitted'}</span>
            </div>
            {documents.rcUrl ? (
              <a
                href={documents.rcUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-brand-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[10px] text-emerald-400 font-bold">On Record</span>
            )}
          </div>
        </div>
      </div>

      {/* Palamaner Support Center Card */}
      <div className="p-4 rounded-3xl bg-charcoal-900 border border-charcoal-800 space-y-2.5 text-xs">
        <span className="font-bold text-white block">Palamaner Partner Support</span>
        <div className="space-y-1.5 text-charcoal-300 text-[11px]">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-brand-400" />
            <span>Driver Helpline: +91 94400 00000</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-brand-400" />
            <span>Support: support@go-plmr.com</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-brand-400" />
            <span>Palamaner Town Center, Andhra Pradesh - 517408</span>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <button
        onClick={logout}
        className="w-full py-3.5 px-4 rounded-2xl bg-charcoal-900 hover:bg-rose-950/40 border border-charcoal-800 hover:border-rose-800/50 text-rose-400 font-bold text-xs transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of GO PLMR Driver App</span>
      </button>
    </div>
  );
};
