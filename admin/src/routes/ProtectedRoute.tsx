import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, RefreshCw, KeyRound, LogOut } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { user, isAdmin, loading, refreshClaims, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50/50 via-slate-50 to-teal-50/30">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl animate-bounce shadow-lg">
          GP
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 animate-pulse tracking-wide uppercase">
          Verifying Go Plmr Admin Session...
        </p>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but lacks admin claims or permissions
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50/60 via-slate-50 to-teal-50/30">
        <div className="glass-panel p-8 max-w-lg w-full text-center shadow-2xl border-emerald-200/80 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-amber-50/50">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Admin Privilege Verification Required
          </h2>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            You are signed in as <strong className="text-slate-900">{user.email}</strong>, but this account has not been granted administrator custom claims yet.
          </p>

          <div className="mt-5 p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-left text-xs space-y-2 text-slate-700 font-mono text-[11px]">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 font-sans">
              <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
              <span>How to provision this account:</span>
            </div>
            <p>1. Open your terminal in the project root.</p>
            <p className="text-emerald-700 bg-emerald-50/70 p-1.5 rounded">
              node scripts/set-admin-claim.js {user.uid}
            </p>
            <p>2. Or add a document in Firestore collection <code className="text-emerald-800 font-bold">admins/{user.uid}</code> with <code className="text-emerald-800 font-bold">isActive: true</code>.</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => refreshClaims()}
              className="btn-primary w-full sm:w-auto text-xs px-4 py-2.5 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-check Permissions</span>
            </button>

            <button
              onClick={() => logout()}
              className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5 flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
