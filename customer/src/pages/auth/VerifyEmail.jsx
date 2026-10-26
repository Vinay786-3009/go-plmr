import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, CheckCircle2, RefreshCw, AlertCircle, LogOut, ArrowRight, Clock } from 'lucide-react';

export const VerifyEmail = () => {
  const { user, refreshUser, resendVerification, logout, emailVerified } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  // If already verified, forward to home
  useEffect(() => {
    if (emailVerified) {
      navigate('/', { replace: true });
    }
  }, [emailVerified, navigate]);

  // Handle countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setResendStatus('');
    try {
      const { verified } = await refreshUser();
      if (verified) {
        success('Email verified successfully! You can now book rides.');
        navigate('/', { replace: true });
      } else {
        info('Email not yet verified. Please click the link in your inbox.');
      }
    } catch (err) {
      console.error('Error refreshing verification status:', err);
      error('Could not verify status. Please check your network and try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setResendStatus('');

    try {
      await resendVerification();
      setCooldown(60);
      setResendStatus('Verification link dispatched. Please check your inbox and spam folder.');
      success('Verification link resent!');
    } catch (err) {
      console.error('Error resending verification email:', err);
      if (err.code === 'auth/too-many-requests') {
        error('Too many requests. Please wait a few minutes before trying again.');
      } else {
        error(err.message || 'Failed to resend verification email.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-[85vh] justify-center px-6 py-8">
      <div className="glass-card p-6 rounded-3xl border border-slate-200/90 shadow-sm text-center">
        {/* Animated Icon */}
        <div className="relative inline-flex mb-5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm mx-auto">
            <Mail className="w-8 h-8" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
            !
          </div>
        </div>

        <h2 className="text-xl font-black text-slate-900 tracking-tight">Verify Your Email Address</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          To ensure safety and prevent spam bookings in Palamaner, GO PLMR requires email verification before booking rides.
        </p>

        {/* User Email Box */}
        <div className="my-5 p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center gap-2">
          <span className="text-xs font-bold text-slate-800 break-all">
            {user?.email || 'Your Registered Email'}
          </span>
        </div>

        {/* Instructions */}
        <div className="text-left text-xs text-slate-600 space-y-2 mb-6 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </span>
            <span>Check your email inbox (and Spam/Junk folder)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </span>
            <span>Click the verification link provided by Firebase / GO PLMR</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </span>
            <span>Return to this screen and tap <b>"I Have Verified"</b> below</span>
          </div>
        </div>

        {resendStatus && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            {resendStatus}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          {/* Check Verification Status */}
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : 'I Have Verified'}</span>
          </button>

          {/* Resend Link with Cooldown */}
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="btn-secondary w-full py-3 flex items-center justify-center gap-2 text-xs"
          >
            {cooldown > 0 ? (
              <>
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Resend available in {cooldown}s</span>
              </>
            ) : resending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                <span>Sending Verification Link...</span>
              </>
            ) : (
              <span>Resend Verification Email</span>
            )}
          </button>
        </div>

        {/* Sign Out Option */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center">
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out / Use different account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
