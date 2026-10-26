import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSubmitted(true);
      success('Password reset email dispatched', 'Check your inbox for the reset link');
    } catch (err: any) {
      error('Reset failed', err.message || 'Could not send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-emerald-100/60 via-slate-50 to-teal-100/40">
      <div className="max-w-md w-full">
        <div className="glass-panel p-8 sm:p-10 shadow-2xl border-emerald-100/80">
          <div className="mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Reset Admin Password
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered administrator email to receive a password reset link.
            </p>
          </div>

          {submitted ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-emerald-950">Reset Link Sent</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                If an account exists for <strong className="font-semibold">{email}</strong>, a password reset link has been dispatched.
              </p>
              <Link to="/login" className="btn-primary text-xs px-4 py-2 inline-block mt-2">
                Return to Login
              </Link>
            </div>
          ) : (
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-xs font-semibold tracking-wide flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
