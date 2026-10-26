import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { sendPasswordReset } = useAuth();
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSubmitted(true);
      success('Password reset email sent!');
    } catch (err) {
      console.error('Password reset failed:', err);
      const friendly = authService.getFriendlyErrorMessage(err);
      error(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[85vh] justify-center px-6 py-8">
      <div className="glass-card p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>

        {submitted ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Check Your Email</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              We have dispatched a password reset link to <b className="text-slate-800">{email}</b>. Please follow the instructions in the email.
            </p>

            <Link
              to="/login"
              className="btn-primary w-full py-3 mt-6 text-xs inline-flex items-center justify-center gap-2"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Reset Password</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Enter your registered GO PLMR email to receive a password reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rider@example.com"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
