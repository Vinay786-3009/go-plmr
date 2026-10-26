import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, PALAMANER_CONFIG } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Car, 
  FileText, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Loader2,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export const DriverOnboarding = ({ 
  onSwitchToLogin, 
  onExistingAccountDetected, 
  currentUser, 
  initialEmail = '', 
  isExistingAccountApplication = false 
}) => {
  const { registerWithEmailPassword, completeDriverProfile, applyAsDriver } = useAuth();

  // Basic Info
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || initialEmail || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Vehicle Info
  const [vehicleCategory, setVehicleCategory] = useState('auto');
  const [plateNumber, setPlateNumber] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [color, setColor] = useState('');
  const [year, setYear] = useState('2022');

  // Documents Numbers
  const [dlNumber, setDlNumber] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');

  // File Objects & Previews
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dlFile, setDlFile] = useState(null);
  const [rcFile, setRcFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);

  // Upload Progress & State
  const [uploadProgress, setUploadProgress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existingAccountDetected, setExistingAccountDetected] = useState(null);
  const [step, setStep] = useState(1);

  // Prefill existing customer / admin profile details if logged in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.displayName && !fullName) setFullName(currentUser.displayName);

      const loadExistingUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.fullName && !fullName) setFullName(data.fullName);
            if (data.phoneNumber && !phoneNumber) setPhoneNumber(data.phoneNumber);
          }
        } catch (e) {
          console.warn("Could not prefill user profile data:", e.message);
        }
      };
      loadExistingUserData();
    } else if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [currentUser, initialEmail]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError("Full name is required.");
    if (!email.trim() || !email.includes('@')) return setError("Valid email address is required.");
    if (!phoneNumber.trim() || phoneNumber.length < 10) return setError("10-digit mobile number is required.");
    
    // Only require password for brand new account registrations
    if (!currentUser) {
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      if (password !== confirmPassword) return setError("Passwords do not match.");
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!plateNumber.trim()) return setError("Vehicle registration plate number is required.");
    if (!dlNumber.trim()) return setError("Driving license number is required.");

    setIsSubmitting(true);
    setUploadProgress('Creating your driver account...');

    try {
      // 1. Register Auth user & initial profile
      const tempUid = 'pending_' + Date.now();
      let photoUrl = '';
      let dlUrl = '';
      let rcUrl = '';
      let insuranceUrl = '';

      // Upload profile photo if provided
      if (photoFile) {
        setUploadProgress('Uploading driver profile photo...');
        try {
          photoUrl = await storageService.uploadDriverDocument('temp', photoFile, 'profile');
        } catch (e) {
          console.warn("Storage upload bypassed or failed:", e.message);
        }
      }

      // Upload DL document
      if (dlFile) {
        setUploadProgress('Uploading driving license...');
        try {
          dlUrl = await storageService.uploadDriverDocument('temp', dlFile, 'license');
        } catch (e) {
          console.warn("DL upload bypassed or failed:", e.message);
        }
      }

      // Upload RC document
      if (rcFile) {
        setUploadProgress('Uploading RC document...');
        try {
          rcUrl = await storageService.uploadDriverDocument('temp', rcFile, 'rc');
        } catch (e) {
          console.warn("RC upload bypassed or failed:", e.message);
        }
      }

      // Upload Insurance document
      if (insuranceFile) {
        setUploadProgress('Uploading insurance certificate...');
        try {
          insuranceUrl = await storageService.uploadDriverDocument('temp', insuranceFile, 'insurance');
        } catch (e) {
          console.warn("Insurance upload bypassed or failed:", e.message);
        }
      }

      setUploadProgress('Finalizing driver partner registration...');

      if (currentUser) {
        // User already has an authenticated account -> attach driver profile directly
        await completeDriverProfile({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          vehicleCategory,
          vehicleDetails: {
            plateNumber: plateNumber.trim().toUpperCase(),
            makeModel: makeModel.trim(),
            color: color.trim(),
            year: year.trim()
          },
          documents: {
            dlNumber: dlNumber.trim().toUpperCase(),
            dlUrl,
            rcNumber: rcNumber.trim().toUpperCase(),
            rcUrl,
            insuranceNumber: insuranceNumber.trim().toUpperCase(),
            insuranceUrl,
            aadharNumber: aadharNumber.trim()
          },
          photoUrl
        });
      } else {
        // Brand new registration
        await registerWithEmailPassword({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          vehicleCategory,
          vehicleDetails: {
            plateNumber: plateNumber.trim().toUpperCase(),
            makeModel: makeModel.trim(),
            color: color.trim(),
            year: year.trim()
          },
          documents: {
            dlNumber: dlNumber.trim().toUpperCase(),
            dlUrl,
            rcNumber: rcNumber.trim().toUpperCase(),
            rcUrl,
            insuranceNumber: insuranceNumber.trim().toUpperCase(),
            insuranceUrl,
            aadharNumber: aadharNumber.trim()
          },
          photoUrl
        });
      }

      // Profile submitted! Approval status gate or verification will show automatically
    } catch (err) {
      console.error("Registration error:", err);
      if (err.isExistingAccount || err.code === 'auth/email-already-in-use') {
        const detected = (err.existingEmail || email).trim().toLowerCase();
        setExistingAccountDetected(detected);
        setError(null);
      } else {
        setError(err.message || "Failed to register driver account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-charcoal-900 border border-charcoal-800 rounded-3xl shadow-2xl space-y-5">
      {/* Brand Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold">
          <Shield className="w-3.5 h-3.5" />
          <span>Palamaner Driver Partner Onboarding</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">Join GO PLMR Partner Fleet</h2>
        <p className="text-xs text-charcoal-400">
          Earn reliably with daily payouts across Palamaner and Chittoor District
        </p>
      </div>

      {/* Existing Session Alert if signed in */}
      {currentUser && (
        <div className="p-3.5 rounded-2xl bg-charcoal-800 border border-charcoal-700 flex items-center justify-between text-xs animate-in fade-in">
          <div className="overflow-hidden pr-2">
            <span className="text-[10px] text-charcoal-400 block">Signed in as:</span>
            <span className="font-bold text-white truncate block">{currentUser.email}</span>
          </div>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="px-3 py-1.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-brand-400 text-xs font-bold transition-colors shrink-0"
          >
            Log Out & Switch
          </button>
        </div>
      )}

      {/* Existing Account Detected Prompt */}
      {existingAccountDetected && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-left space-y-3 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">Existing GO PLMR Account Found</h3>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                An account with <strong className="text-white">{existingAccountDetected}</strong> already exists in GO PLMR (Customer or Admin).
              </p>
              <p className="text-xs text-charcoal-300">
                You do not need to register again. Simply sign in with your existing password to link your driver partner application. Your existing customer profile or admin privileges will remain completely safe.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onExistingAccountDetected) {
                onExistingAccountDetected(existingAccountDetected);
              } else if (onSwitchToLogin) {
                onSwitchToLogin();
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Sign In with Existing Account & Apply →</span>
          </button>
        </div>
      )}

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold">
        <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-brand-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-400'}`}>
          1. Personal Info
        </span>
        <span className="text-charcoal-600">→</span>
        <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-brand-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-400'}`}>
          2. Vehicle & Docs
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Personal and Auth Details */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-3.5">
          {/* Helper callout for existing customers/admins */}
          {!currentUser && (
            <div className="p-3 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-charcoal-300">
                <Shield className="w-4 h-4 text-brand-400 shrink-0" />
                <span className="text-[11px]">Existing Customer or Admin account?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onExistingAccountDetected && email.trim()) {
                    onExistingAccountDetected(email.trim().toLowerCase());
                  } else if (onSwitchToLogin) {
                    onSwitchToLogin();
                  }
                }}
                className="text-brand-400 text-[11px] font-bold hover:underline shrink-0 ml-2"
              >
                Sign In & Apply →
              </button>
            </div>
          )}
          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center justify-center pb-2">
            <div className="relative w-20 h-20 rounded-full bg-charcoal-800 border-2 border-dashed border-charcoal-600 flex items-center justify-center overflow-hidden hover:border-brand-500 transition-colors cursor-pointer group">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-7 h-7 text-charcoal-400 group-hover:text-brand-400" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-charcoal-400 mt-1.5">Driver Profile Photo (Optional)</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-300 mb-1">Full Legal Name *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-charcoal-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-300 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-charcoal-500" />
              <input
                type="email"
                required
                disabled={Boolean(currentUser)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@example.com"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500 ${
                  currentUser ? 'opacity-80 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-300 mb-1">Mobile Contact Number *</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-charcoal-500" />
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9876543210"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Password fields only shown if not already logged in */}
          {!currentUser && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-charcoal-300 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-charcoal-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal-300 mb-1">Confirm *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-charcoal-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-black text-sm transition-all shadow-lg shadow-brand-500/20"
          >
            Continue to Vehicle Details →
          </button>
        </form>
      )}

      {/* STEP 2: Vehicle & Documents */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-charcoal-300 mb-1.5">Vehicle Category *</label>
            <div className="grid grid-cols-2 gap-2">
              {PALAMANER_CONFIG.vehicleCategories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setVehicleCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    vehicleCategory === cat.id
                      ? 'bg-brand-500/20 border-brand-500 text-white shadow-md'
                      : 'bg-charcoal-800/80 border-charcoal-700 text-charcoal-400 hover:bg-charcoal-800'
                  }`}
                >
                  <p className="font-bold text-xs text-white">{cat.label}</p>
                  <p className="text-[10px] text-brand-400">Base ₹{cat.baseFare} • ₹{cat.perKm}/km</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-charcoal-300 mb-1">Plate Number *</label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="AP 03 XX 1234"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs font-mono text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-charcoal-300 mb-1">Make / Model *</label>
              <input
                type="text"
                required
                value={makeModel}
                onChange={(e) => setMakeModel(e.target.value)}
                placeholder="Bajaj Compact RE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-charcoal-300 mb-1">Vehicle Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Yellow / Green"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-charcoal-300 mb-1">Registration Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2022"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Driving License */}
          <div className="p-3 rounded-2xl bg-charcoal-800/60 border border-charcoal-800 space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-charcoal-300 mb-1">Driving License Number *</label>
              <input
                type="text"
                required
                value={dlNumber}
                onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                placeholder="AP03 20210001234"
                className="w-full px-3 py-2 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs font-mono text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-charcoal-400">License Document (Photo/PDF):</span>
              <label className="px-3 py-1 rounded-lg bg-charcoal-700 hover:bg-charcoal-600 text-white text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>{dlFile ? dlFile.name.slice(0, 12) + '...' : 'Upload File'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDlFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* RC Document */}
          <div className="p-3 rounded-2xl bg-charcoal-800/60 border border-charcoal-800 space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-charcoal-300 mb-1">RC Certificate Number</label>
              <input
                type="text"
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                placeholder="Registration Certificate No."
                className="w-full px-3 py-2 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs font-mono text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-charcoal-400">RC Document Copy:</span>
              <label className="px-3 py-1 rounded-lg bg-charcoal-700 hover:bg-charcoal-600 text-white text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>{rcFile ? rcFile.name.slice(0, 12) + '...' : 'Upload File'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setRcFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Insurance */}
          <div className="p-3 rounded-2xl bg-charcoal-800/60 border border-charcoal-800 space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-charcoal-300 mb-1">Vehicle Insurance Policy Number</label>
              <input
                type="text"
                value={insuranceNumber}
                onChange={(e) => setInsuranceNumber(e.target.value.toUpperCase())}
                placeholder="Insurance Policy No."
                className="w-full px-3 py-2 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs font-mono text-white placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-charcoal-400">Insurance Certificate:</span>
              <label className="px-3 py-1 rounded-lg bg-charcoal-700 hover:bg-charcoal-600 text-white text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>{insuranceFile ? insuranceFile.name.slice(0, 12) + '...' : 'Upload File'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setInsuranceFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {uploadProgress && (
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{uploadProgress}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className="py-3 px-4 rounded-2xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 font-bold text-xs"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-black text-sm transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <span>Submit Driver Application</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Switch to Login */}
      <div className="text-center pt-2 border-t border-charcoal-800">
        <p className="text-xs text-charcoal-400">
          Already registered as a GO PLMR driver?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-brand-400 font-bold hover:underline"
          >
            Log In here
          </button>
        </p>
      </div>
    </div>
  );
};
