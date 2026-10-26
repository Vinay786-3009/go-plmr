import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim(),
      });

      success('Account created! A verification link has been sent to your email.');
      navigate('/verify-email', { replace: true });
    } catch (err) {
      console.error('Registration failed:', err);
      const friendly = authService.getFriendlyErrorMessage(err);
      setErrorMsg(friendly);
      error(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Yellow Top Banner (Exact Ride-Karo Style from Image 2) */}
      <div className="bg-[#F9D342] p-5 pt-8 pb-10 text-slate-900 flex flex-col justify-end">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-4 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Already have an account? Sign In</span>
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Create Account
        </h1>
        <p className="text-xs text-slate-800/80 font-semibold mt-0.5">
          Join GO PLMR to book rides across Palamaner
        </p>
      </div>

      {/* Main Form */}
      <div className="px-6 py-6 -mt-4 bg-white rounded-t-3xl shadow-lg flex-1 flex flex-col">
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">
              Full Name *
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Attirala Ajith"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">
              Email Address *
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vinay6b@gmail.com"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">
              Phone Number
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="tel"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 81211 45635"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">
              Password (Min 6 Characters) *
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">
              Confirm Password *
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-black w-full mt-2 py-3.5 text-xs font-black tracking-wider uppercase shadow-md"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Creating Account...</span>
              </div>
            ) : (
              'REGISTER AS CUSTOMER'
            )}
          </button>
        </form>

        <div className="text-center mt-5">
          <p className="text-xs text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-slate-900 underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
