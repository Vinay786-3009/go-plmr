import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  HelpCircle,
  Loader2,
  Server
} from 'lucide-react';

export const AuthModal = ({ onSwitchToRegister, initialEmail = '', infoMessage = null }) => {
  const { 
    loginWithEmailPassword, 
    sendPasswordReset, 
    requestEmailOtp, 
    verifyEmailOtp 
  } = useAuth();

  // Active Tab: 'password' (Method A) | 'otp' (Method B)
  const [activeTab, setActiveTab] = useState('password');

  // Method A State
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Method B (OTP) State
  const [otpEmail, setOtpEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpExpiresIn, setOtpExpiresIn] = useState(300); // 5 minutes
  const [backendRequiredBanner, setBackendRequiredBanner] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setOtpEmail(initialEmail);
    }
  }, [initialEmail]);

  // OTP Countdown Timers
  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  useEffect(() => {
    let timer;
    if (otpSent && otpExpiresIn > 0) {
      timer = setTimeout(() => setOtpExpiresIn(otpExpiresIn - 1), 1000);
    } else if (otpSent && otpExpiresIn <= 0) {
      setError("Your 5-minute OTP code has expired. Please request a new code.");
      setOtpSent(false);
    }
    return () => clearTimeout(timer);
  }, [otpSent, otpExpiresIn]);

  // Method A Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      setLoading(false);
      return;
    }

    try {
      await loginWithEmailPassword(cleanEmail, password);
    } catch (err) {
      console.error("Login error:", err);
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError("Invalid email or password. Please check your credentials or reset your password.");
      } else if (code === 'auth/user-not-found') {
        setError("No account found with this email. Please click 'Register as Driver' below.");
      } else if (code === 'auth/too-many-requests') {
        setError("Account temporarily blocked due to multiple failed login attempts. Please reset your password or wait a few minutes.");
      } else if (code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await sendPasswordReset(resetEmail.trim());
      setSuccessMsg(`Password reset instructions sent to ${resetEmail}. Check your inbox.`);
      setForgotModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  // Method B: Request Email OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setBackendRequiredBanner(false);

    if (!otpEmail.trim() || !otpEmail.includes('@')) {
      return setError("Please enter a valid email address.");
    }

    setOtpLoading(true);
    try {
      const res = await requestEmailOtp(otpEmail.trim());
      if (res.requiresBackend) {
        setBackendRequiredBanner(true);
        setError(res.message);
      } else {
        setOtpSent(true);
        setOtpExpiresIn(300); // 5 min
        setOtpCooldown(res.cooldownSeconds || 60);
        setSuccessMsg(res.message);
      }
    } catch (err) {
      setError(err.message || "Could not dispatch OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Method B: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      return setError("Please enter the 6-digit numeric OTP sent to your email.");
    }

    setOtpLoading(true);
    try {
      await verifyEmailOtp(otpEmail.trim(), otpCode.trim());
    } catch (err) {
      setError(err.message || "OTP verification failed. Check the code or request a new one.");
    } finally {
      setOtpLoading(false);
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-charcoal-900 border border-charcoal-800 rounded-3xl shadow-2xl space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-500 flex items-center justify-center text-charcoal-950 font-black text-xl shadow-lg shadow-brand-500/20">
          PLMR
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">GO PLMR Driver Portal</h2>
        <p className="text-xs text-charcoal-400">
          Official Driver Partner App for Palamaner, Andhra Pradesh
        </p>
      </div>

      {/* Two Tabs: Method A vs Method B */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/80">
        <button
          type="button"
          onClick={() => { setActiveTab('password'); setError(null); setSuccessMsg(null); }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'password'
              ? 'bg-brand-500 text-charcoal-950 shadow-md font-extrabold'
              : 'text-charcoal-400 hover:text-white'
          }`}
        >
          Email + Password
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('otp'); setError(null); setSuccessMsg(null); }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'otp'
              ? 'bg-brand-500 text-charcoal-950 shadow-md font-extrabold'
              : 'text-charcoal-400 hover:text-white'
          }`}
        >
          Email OTP
        </button>
      </div>

      {/* Alerts */}
      {infoMessage && (
        <div className="p-3.5 rounded-2xl bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs flex items-start gap-2.5 shadow-md">
          <ShieldCheck className="w-4 h-4 shrink-0 text-brand-400 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-white block">Existing GO PLMR Account Found</span>
            <span>{infoMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* METHOD A: Email + Password Login Form */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-300 mb-1">Driver Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-charcoal-500" />
              <input
                id="driver-email-input"
                type="email"
                required
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-charcoal-300">Account Password</label>
              <button
                type="button"
                onClick={() => { setResetEmail(email); setForgotModalOpen(true); }}
                className="text-[11px] text-brand-400 hover:underline font-semibold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-charcoal-500" />
              <input
                id="driver-password-input"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <button
            id="driver-login-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-black text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>LOG IN TO DRIVER DASHBOARD</span>
            )}
          </button>
        </form>
      )}

      {/* METHOD B: Email OTP Form */}
      {activeTab === 'otp' && (
        <div className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-300 mb-1">Driver Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-charcoal-500" />
                  <input
                    type="email"
                    required
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="driver@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-black text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching OTP...</span>
                  </>
                ) : (
                  <span>SEND 6-DIGIT OTP TO EMAIL</span>
                )}
              </button>

              {/* Informative Server Status Banner */}
              {backendRequiredBanner && (
                <div className="p-4 rounded-2xl bg-charcoal-800/90 border border-brand-500/30 text-left space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-brand-400 font-bold">
                    <Server className="w-4 h-4 shrink-0" />
                    <span>Server-Side Email Provider Setup Required</span>
                  </div>
                  <p className="text-[11px] text-charcoal-300 leading-relaxed">
                    Per security requirements, OTPs must be dispatched by a trusted server-side email service (Resend, SendGrid, or Firebase Cloud Function) with cryptographically secure codes and rate-limiting.
                  </p>
                  <p className="text-[11px] text-charcoal-400">
                    A complete backend integration script has been included in <code className="text-brand-300 font-mono">server/index.js</code>. Configure <code className="text-brand-300 font-mono">VITE_OTP_API_URL</code> to enable live dispatch.
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold">
                    ✓ In the meantime, use Method A (Email + Password) which is fully active and works with Firebase email verification.
                  </p>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-2xl bg-charcoal-800/60 border border-charcoal-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-charcoal-400">Code sent to:</span>
                  <p className="font-mono text-white font-bold truncate max-w-[200px]">{otpEmail}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-charcoal-400">Expires in:</span>
                  <p className="font-mono text-brand-400 font-bold">{formatSeconds(otpExpiresIn)}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-300 mb-1">Enter 6-Digit OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-charcoal-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-charcoal-800 border border-charcoal-700 text-lg font-mono tracking-widest text-white placeholder-charcoal-600 focus:outline-none focus:border-brand-500 text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-black text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>VERIFY & LOG IN</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpCode(''); }}
                  className="text-xs text-charcoal-400 hover:text-white"
                >
                  Change Email
                </button>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpCooldown > 0 || otpLoading}
                  className={`text-xs font-semibold ${
                    otpCooldown > 0 ? 'text-charcoal-500' : 'text-brand-400 hover:underline'
                  }`}
                >
                  {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Switch to Register */}
      <div className="text-center pt-3 border-t border-charcoal-800">
        <p className="text-xs text-charcoal-400">
          Don't have a GO PLMR driver partner account?{' '}
          <button
            type="button"
            onClick={() => onSwitchToRegister(email || otpEmail)}
            className="text-brand-400 font-bold hover:underline"
          >
            Register as Driver
          </button>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm">Reset Driver Account Password</h3>
            <p className="text-xs text-charcoal-400">
              Enter your registered driver email address and we will send you a password reset link.
            </p>

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="driver@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white focus:outline-none focus:border-brand-500"
              />

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-charcoal-800 text-charcoal-300 font-bold text-xs hover:bg-charcoal-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="py-2.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-bold text-xs"
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
