import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useRide } from './context/RideContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DriverOnboarding } from './components/DriverOnboarding';
import { EmailVerificationNotice } from './components/EmailVerificationNotice';
import { ApprovalStatusGate } from './components/ApprovalStatusGate';
import { DriverDashboard } from './components/DriverDashboard';
import { EarningsView } from './components/EarningsView';
import { RideHistoryView } from './components/RideHistoryView';
import { ProfileView } from './components/ProfileView';
import { 
  Shield, 
  Car, 
  IndianRupee, 
  History, 
  User, 
  Loader2 
} from 'lucide-react';

export function App() {
  const { 
    user, 
    driverProfile, 
    loading, 
    isEmailVerified, 
    approvalStatus,
    logout
  } = useAuth();

  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' | 'earnings' | 'history' | 'profile'
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [authInfoMessage, setAuthInfoMessage] = useState(null);

  const handleSwitchToLogin = async () => {
    if (user) {
      try {
        await logout();
      } catch (err) {
        console.warn("Logout error on switch:", err);
      }
    }
    setAuthView('login');
  };

  const handleSwitchToRegister = () => {
    setAuthInfoMessage(null);
    setAuthView('register');
  };

  const handleExistingAccountDetected = (email) => {
    setPrefilledEmail(email);
    setAuthInfoMessage(`Existing GO PLMR account detected (${email}). Sign in with your password to link your driver partner application.`);
    setAuthView('login');
  };

  // Loading Splash Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-brand-500 flex items-center justify-center text-charcoal-950 font-black text-2xl shadow-2xl shadow-brand-500/30 animate-pulse">
          PLMR
        </div>
        <p className="mt-4 font-bold text-white text-sm tracking-wide">GO PLMR DRIVER</p>
        <p className="text-xs text-charcoal-500">Palamaner, Andhra Pradesh</p>
      </div>
    );
  }

  // Case 1: Unauthenticated -> Show AuthModal or DriverOnboarding
  if (!user) {
    return (
      <main className="min-h-screen bg-charcoal-950 flex items-center justify-center p-3 sm:p-6">
        {authView === 'login' ? (
          <AuthModal 
            onSwitchToRegister={handleSwitchToRegister} 
            initialEmail={prefilledEmail}
            infoMessage={authInfoMessage}
          />
        ) : (
          <DriverOnboarding 
            onSwitchToLogin={handleSwitchToLogin} 
            onExistingAccountDetected={handleExistingAccountDetected}
            initialEmail={prefilledEmail}
          />
        )}
      </main>
    );
  }

  // Case 2: Authenticated user has not completed driver application -> Show Driver Onboarding / Application Screen
  // Flow: Existing account → Sign in → Check driver profile → Apply if needed → Email verification if required → Admin approval → Start driving
  if (!driverProfile) {
    return (
      <main className="min-h-screen bg-charcoal-950 flex items-center justify-center p-3 sm:p-6">
        <DriverOnboarding 
          onSwitchToLogin={handleSwitchToLogin} 
          currentUser={user}
          isExistingAccountApplication={true}
        />
      </main>
    );
  }

  // Case 3: Driver record exists, but user email is not verified -> Show EmailVerificationNotice
  if (!isEmailVerified) {
    return <EmailVerificationNotice />;
  }

  // Case 4: Driver account is not approved (pending, rejected, suspended)
  if (approvalStatus !== 'approved') {
    return <ApprovalStatusGate />;
  }

  // Case 5: Fully approved driver partner -> Active Dashboard & Tabs
  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-100 flex flex-col">
      <div className="mobile-container flex-1 pb-20">
        {/* Navigation Bar */}
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Tab Views */}
        <main className="flex-1">
          {currentTab === 'dashboard' && (
            <DriverDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />
          )}
          {currentTab === 'earnings' && <EarningsView />}
          {currentTab === 'history' && <RideHistoryView />}
          {currentTab === 'profile' && <ProfileView />}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav 
          aria-label="Bottom Navigation" 
          className="fixed bottom-0 left-0 right-0 z-40 max-w-[480px] mx-auto bg-charcoal-900/95 backdrop-blur-md border-t border-charcoal-800 grid grid-cols-4 px-2 py-2"
        >
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'dashboard' ? 'text-brand-400 font-bold' : 'text-charcoal-400 hover:text-white'
            }`}
          >
            <Car className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Rides</span>
          </button>

          <button
            onClick={() => setCurrentTab('earnings')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'earnings' ? 'text-brand-400 font-bold' : 'text-charcoal-400 hover:text-white'
            }`}
          >
            <IndianRupee className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Earnings</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'history' ? 'text-brand-400 font-bold' : 'text-charcoal-400 hover:text-white'
            }`}
          >
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">History</span>
          </button>

          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'profile' ? 'text-brand-400 font-bold' : 'text-charcoal-400 hover:text-white'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default App;
