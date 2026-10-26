import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  FileText, 
  Phone, 
  Car, 
  LogOut,
  RefreshCw
} from 'lucide-react';

export const ApprovalStatusGate = () => {
  const { driverProfile, approvalStatus, logout } = useAuth();

  const isPending = approvalStatus === 'pending';
  const isRejected = approvalStatus === 'rejected';
  const isSuspended = approvalStatus === 'suspended';

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        
        {/* Dynamic Status Icon */}
        {isPending && (
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
        )}

        {isRejected && (
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <XCircle className="w-10 h-10" />
          </div>
        )}

        {isSuspended && (
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-10 h-10" />
          </div>
        )}

        {/* Title & Description */}
        <div className="space-y-2">
          {isPending && (
            <>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Application Submitted
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Under Admin Review</h2>
              <p className="text-xs text-charcoal-400 leading-relaxed">
                Your driver partner registration is currently being verified by the GO PLMR Admin team in Palamaner. You will gain access as soon as your documents are approved.
              </p>
            </>
          )}

          {isRejected && (
            <>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Application Declined
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Verification Declined</h2>
              <p className="text-xs text-charcoal-400 leading-relaxed">
                Unfortunately, your application could not be approved at this time.
              </p>
              {driverProfile?.rejectionReason && (
                <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left">
                  <span className="font-bold">Reason:</span> {driverProfile.rejectionReason}
                </div>
              )}
            </>
          )}

          {isSuspended && (
            <>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Account Suspended
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Service Suspended</h2>
              <p className="text-xs text-charcoal-400 leading-relaxed">
                Your driver account has been suspended by the platform administration.
              </p>
              {driverProfile?.suspensionReason && (
                <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left">
                  <span className="font-bold">Reason:</span> {driverProfile.suspensionReason}
                </div>
              )}
            </>
          )}
        </div>

        {/* Real-time sync banner */}
        <div className="p-3 rounded-2xl bg-charcoal-800/80 border border-charcoal-700 flex items-center justify-center gap-2 text-[11px] text-charcoal-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Real-time Live Sync active — this page updates automatically</span>
        </div>

        {/* Submitted Profile Details Summary */}
        {driverProfile && (
          <div className="p-4 rounded-2xl bg-charcoal-800/40 border border-charcoal-800 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-charcoal-700/60">
              <span className="text-charcoal-400">Driver Partner</span>
              <span className="font-bold text-white">{driverProfile.fullName || '—'}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-charcoal-700/60">
              <span className="text-charcoal-400">Category</span>
              <span className="font-bold text-brand-400 uppercase">{driverProfile.vehicleCategory || '—'}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-charcoal-700/60">
              <span className="text-charcoal-400">Plate Number</span>
              <span className="font-mono font-bold text-white">{driverProfile.vehicleDetails?.plateNumber || 'Pending'}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-charcoal-700/60">
              <span className="text-charcoal-400">Vehicle</span>
              <span className="text-charcoal-300">{driverProfile.vehicleDetails?.makeModel || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-charcoal-400">Driving License</span>
              <span className="font-mono text-emerald-400">
                {driverProfile.documents?.dlNumber ? `Uploaded (${driverProfile.documents.dlNumber})` : 'Submitted'}
              </span>
            </div>
          </div>
        )}

        {/* Palamaner Support Info */}
        <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-left space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-brand-400">
            <Phone className="w-3.5 h-3.5" />
            <span>Palamaner Partner Support</span>
          </div>
          <p className="text-[11px] text-charcoal-300">
            For urgent document verification or queries, contact the GO PLMR Palamaner helpdesk at <strong>+91 94400 00000</strong> or visit the local partner center.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2">
          <button
            onClick={logout}
            className="w-full py-3 px-4 rounded-2xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
