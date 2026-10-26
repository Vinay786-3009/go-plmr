import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { PALAMANER_COORDINATES, isFirebaseConfigured } from '@/services/firebase/firebase';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const isConfigured = isFirebaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await login(email.trim(), password);
      success('Welcome back!', 'Admin authentication successful');
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'UNAUTHORIZED_ADMIN_ROLE') {
        setErrorMsg('Authentication successful, but this account lacks Administrator Custom Claims.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMsg('Invalid email or password. Please verify your credentials.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Access temporarily blocked due to many failed attempts. Try again later.');
      } else {
        setErrorMsg(err.message || 'Failed to sign in. Check your network or Firebase credentials.');
      }
      error('Sign in failed', 'Please check credentials and permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-emerald-100/60 via-slate-50 to-teal-100/40">
      <div className="max-w-md w-full">
        {/* Brand Card */}
        <div className="glass-panel p-8 sm:p-10 shadow-2xl border-emerald-100/80">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-extrabold text-2xl mx-auto shadow-lg ring-4 ring-emerald-500/20">
              GP
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-4">
              Go Plmr Admin
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Ride-Booking Operations • {PALAMANER_COORDINATES.cityName}, AP
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Setup Tip:</strong>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  Make sure your <code className="bg-amber-100/80 px-1 py-0.5 rounded">.env</code> file contains the valid <code className="font-bold">VITE_FIREBASE_API_KEY</code> for project <strong>go-plmr</strong>.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-semibold">Authentication Error</strong>
                <p className="mt-0.5 text-[11px] leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@goplmr.com"
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Authenticating with Firebase...</span>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Restricted System • Authorized Staff Only</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Protected by Firebase Authentication & Custom Role Claims
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
