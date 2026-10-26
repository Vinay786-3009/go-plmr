import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { GoogleAccountChooserModal } from '../../components/auth/GoogleAccountChooserModal';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [identifier, setIdentifier] = useState(''); // phone or email
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Format email from phone if user enters 10-digit Indian number
  const resolveEmail = (val) => {
    const clean = val.trim();
    if (clean.includes('@')) return clean.toLowerCase();
    // Indian 10-digit mobile number format
    const numeric = clean.replace(/[^0-9]/g, '');
    if (numeric.length >= 10) {
      return `rider${numeric.slice(-10)}@goplmr.com`;
    }
    return clean;
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your phone number or email.');
      return;
    }

    // If password field is not shown yet, prompt for password
    if (!showPasswordField) {
      setShowPasswordField(true);
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    const targetEmail = resolveEmail(identifier);

    try {
      if (isRegisterMode) {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full name.');
          setLoading(false);
          return;
        }

        const res = await register({
          fullName: fullName.trim(),
          email: targetEmail,
          password,
          phoneNumber: identifier.includes('@') ? '' : identifier,
        });

        success('Account created! Verification link sent.');
        navigate('/verify-email', { replace: true });
      } else {
        const res = await login(targetEmail, password);
        success('Logged in successfully!');

        if (!res.user.emailVerified) {
          navigate('/verify-email', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      // If user not found on login, switch to registration mode automatically!
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setIsRegisterMode(true);
        setErrorMsg('No existing account found. Please enter your name to register as a new customer.');
      } else {
        const friendly = authService.getFriendlyErrorMessage(err);
        setErrorMsg(friendly);
        error(friendly);
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Account Chooser Handler
  const handleGoogleSelect = async (account) => {
    setShowGoogleModal(false);
    setLoading(true);
    try {
      await loginWithGoogle();
      success('Logged in with Google!');
      navigate(from, { replace: true });
    } catch (err) {
      console.warn('Google login:', err);
      // If popup blocked or cancelled, authenticate with mock/local session safely
      setIdentifier(account.email);
      setFullName(account.name);
      setShowPasswordField(true);
      setIsRegisterMode(true);
      info(`Selected ${account.email}. Enter a password to complete sign-in.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top 25% Yellow Header (Exact Image 2 Screen 2) */}
      <div className="bg-[#F9D342] h-[25vh] min-h-[160px] p-6 pb-6 flex flex-col justify-between text-slate-900">
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Login or Register
        </h1>
      </div>

      {/* Lower White Portion (Exact Image 2 Screen 2) */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          {/* Social Buttons (Image 2 Screen 2) */}
          <div className="space-y-3 mb-6">
            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] text-xs font-bold text-slate-700 shadow-xs transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Continue with Facebook */}
            <button
              type="button"
              onClick={() => info('Facebook login is available via email account.')}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] active:scale-[0.99] text-xs font-bold text-white shadow-xs transition-all"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Continue with Facebook</span>
            </button>

            {/* Continue with Apple */}
            <button
              type="button"
              onClick={() => info('Apple ID sign-in is available on iOS devices.')}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-black hover:bg-slate-900 active:scale-[0.99] text-xs font-bold text-white shadow-xs transition-all"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.82 1.11-1.96.99-3.1-.96.04-2.18.66-2.87 1.48-.6.7-1.13 1.84-1 2.97 1.08.08 2.21-.55 2.88-1.35z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Divider: OR (Image 2 Screen 2) */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OR</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Input Form with Underline / Clean Field (Image 2 Screen 2) */}
          <form onSubmit={handleContinue} className="flex flex-col gap-4">
            <div>
              <div className="border-b-2 border-slate-200 focus-within:border-black transition-colors pb-1">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter Phone Number or Email"
                  className="w-full text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Additional Fields when progressing */}
            {showPasswordField && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                {isRegisterMode && (
                  <div className="border-b-2 border-slate-200 focus-within:border-black transition-colors pb-1">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter Full Name"
                      className="w-full text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-none"
                    />
                  </div>
                )}

                <div className="relative border-b-2 border-slate-200 focus-within:border-black transition-colors pb-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password (min 6 characters)"
                    className="w-full text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-none pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(!isRegisterMode)}
                    className="text-slate-500 hover:text-black font-bold underline"
                  >
                    {isRegisterMode ? 'Already registered? Sign In' : 'New rider? Register'}
                  </button>
                  <Link to="/forgot-password" className="text-slate-400 hover:text-black">
                    Forgot Password?
                  </Link>
                </div>
              </div>
            )}

            {/* Black Rounded Pill Button: CONTINUE (Image 2 Screen 2) */}
            <div className="mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-black hover:bg-slate-900 active:scale-[0.98] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{isRegisterMode ? 'CREATE ACCOUNT' : 'CONTINUE'}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-[10px] text-slate-400 text-center mt-6">
          GO PLMR — Palamaner Ride Booking Platform
        </p>
      </div>

      {/* Google Account Chooser Modal (Image 2 Screen 3) */}
      <GoogleAccountChooserModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelectAccount={handleGoogleSelect}
        customEmail={identifier.includes('@') ? identifier : ''}
      />
    </div>
  );
};
