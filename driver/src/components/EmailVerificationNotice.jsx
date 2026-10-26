import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, CheckCircle2, RefreshCw, AlertCircle, LogOut } from 'lucide-react';

export const EmailVerificationNotice = () => {
  const { user, checkEmailVerification, resendVerification, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setError(null);
    setMessage(null);
    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        setMessage("Email successfully verified! Unlocking dashboard...");
      } else {
        setError("Email is not verified yet. Please click the verification link sent to your inbox.");
      }
    } catch (err) {
      setError(err.message || "Failed to check verification status.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      await resendVerification();
      setMessage("Verification email has been resent. Please check your inbox and spam folder.");
      setCooldown(60); // 60s cooldown
    } catch (err) {
      setError(err.message || "Could not resend email. Please try again shortly.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Email Icon with Amber Pulse */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
          <Mail className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
            Action Required
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">Verify Your Email Address</h2>
          <p className="text-xs text-charcoal-400 leading-relaxed">
            To ensure driver security and prevent unauthorized access in the Palamaner service area, please verify your email before proceeding.
          </p>
        </div>

        {/* Current Email Badge */}
        <div className="p-3 rounded-2xl bg-charcoal-800/80 border border-charcoal-700 text-xs font-mono text-charcoal-200 break-all">
          {user?.email}
        </div>

        {/* Status Alerts */}
        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-black text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : "I've Clicked the Verification Link"}</span>
          </button>

          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs border transition-colors ${
              cooldown > 0
                ? 'bg-charcoal-800 text-charcoal-500 border-charcoal-700 cursor-not-allowed'
                : 'bg-charcoal-800/60 hover:bg-charcoal-800 text-charcoal-200 border-charcoal-700'
            }`}
          >
            {resending
              ? 'Sending email...'
              : cooldown > 0
              ? `Resend available in ${cooldown}s`
              : 'Resend Verification Email'}
          </button>
        </div>

        {/* Tips */}
        <div className="p-4 rounded-2xl bg-charcoal-800/40 border border-charcoal-800 text-left space-y-1.5 text-[11px] text-charcoal-400">
          <p className="font-semibold text-charcoal-300">Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your spam or junk folder if not in primary inbox.</li>
            <li>Verification links expire after 3 days.</li>
            <li>If you made a typo in the email address, log out and re-register.</li>
          </ul>
        </div>

        {/* Logout Option */}
        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-xs text-charcoal-400 hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out and use different account</span>
        </button>
      </div>
    </div>
  );
};
