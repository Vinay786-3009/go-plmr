import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  ArrowLeft,
  HelpCircle,
  User,
  Heart,
  Sliders,
  Globe,
  Share2,
  Info,
  FlaskConical,
  LogOut,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Edit2,
  Check,
  Loader2,
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, profile, emailVerified, logout, updateCustomerProfile } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [saving, setSaving] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSaving(true);
    try {
      await updateCustomerProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      success('Profile updated.');
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
      error('Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Yellow Top Banner (Image 3 Screen 5 Style) */}
      <div className="yellow-header">
        <Link to="/" className="p-1 -ml-1 text-slate-900 hover:bg-black/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
        </Link>
        <span className="font-black text-base text-slate-900">Profile & Settings</span>
        <Link to="/support" className="p-1 -mr-1 text-slate-900 hover:bg-black/10 rounded-full transition-colors">
          <HelpCircle className="w-6 h-6 stroke-[2.5]" />
        </Link>
      </div>

      <div className="p-4">
        {/* Section: General (From Image 3 Screen 5) */}
        <div className="mb-6">
          <span className="text-xs font-black text-slate-900 block mb-3">General</span>

          <div className="space-y-1 divide-y divide-slate-100 border border-slate-200/80 rounded-2xl p-2 bg-white shadow-2xs">
            {/* Profile Row */}
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {profile?.fullName || 'Profile Name'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {profile?.phoneNumber || user?.email || 'Enter Mobile Number'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-bold text-slate-600 hover:text-black p-1"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Inline Edit Form */}
              {isEditing && (
                <form onSubmit={handleSaveProfile} className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="input-field"
                  />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Mobile Number"
                    className="input-field"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-yellow py-2 text-xs font-bold self-end px-4"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              )}
            </div>

            {/* Favorites */}
            <Link
              to="/places"
              className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Favorites</h4>
                  <p className="text-[11px] text-slate-400">Manage favorite locations in Palamaner</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            {/* Preferences */}
            <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Preferences</h4>
                  <p className="text-[11px] text-slate-400">Manage trip preferences</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* App Language */}
            <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">App Language</h4>
                  <p className="text-[11px] text-slate-400">English (Telugu, Tamil, Hindi supported)</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500">English</span>
            </div>

            {/* App Shortcuts */}
            <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">App Shortcuts</h4>
                  <p className="text-[11px] text-slate-400">Create shortcuts on home launcher</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Section: Others (From Image 3 Screen 5) */}
        <div>
          <span className="text-xs font-black text-slate-900 block mb-3">Others</span>

          <div className="space-y-1 divide-y divide-slate-100 border border-slate-200/80 rounded-2xl p-2 bg-white shadow-2xs">
            {/* About */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">About</h4>
                  <p className="text-[11px] text-slate-400">Version 1.0.0 (GO PLMR)</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">1.0.0</span>
            </div>

            {/* Subscribe to Beta */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Subscribe to Beta</h4>
                  <p className="text-[11px] text-slate-400">Get early access to latest features</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-rose-50 text-rose-600 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-600">Logout</h4>
                  <p className="text-[11px] text-rose-400">Sign out of customer account</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Logout?"
        message="Are you sure you want to log out of GO PLMR?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={loggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};
