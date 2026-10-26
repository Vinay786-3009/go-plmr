import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  // Monitor Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setEmailVerified(currentUser.emailVerified);
        try {
          const userProfile = await authService.getCustomerProfile(currentUser.uid);
          setProfile(userProfile);
        } catch (err) {
          console.error('Failed to load user profile in AuthContext:', err);
        }
      } else {
        setProfile(null);
        setEmailVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reload current user to check if email verification succeeded
  const refreshUser = async () => {
    if (!auth.currentUser) return { user: null, verified: false };
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setUser(updatedUser);
      const isVerified = Boolean(updatedUser.emailVerified);
      setEmailVerified(isVerified);

      // Re-fetch profile
      const userProfile = await authService.getCustomerProfile(updatedUser.uid);
      setProfile(userProfile);

      return { user: updatedUser, verified: isVerified };
    } catch (error) {
      console.error('Error refreshing user status:', error);
      throw error;
    }
  };

  const register = async (data) => {
    const res = await authService.registerCustomer(data);
    setUser(res.user);
    setProfile(res.profile);
    setEmailVerified(Boolean(res.user.emailVerified));
    return res;
  };

  const login = async (email, password) => {
    const res = await authService.loginCustomer(email, password);
    setUser(res.user);
    setProfile(res.profile);
    setEmailVerified(Boolean(res.user.emailVerified));
    return res;
  };

  const loginWithGoogle = async () => {
    const res = await authService.loginWithGoogle();
    setUser(res.user);
    setProfile(res.profile);
    setEmailVerified(Boolean(res.user.emailVerified));
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
    setEmailVerified(false);
  };

  const resendVerification = async () => {
    if (!user) throw new Error('No logged in user.');
    await authService.resendVerificationEmail(user);
  };

  const sendPasswordReset = async (email) => {
    await authService.sendPasswordReset(email);
  };

  const updateCustomerProfile = async (fields) => {
    if (!user) throw new Error('Not authenticated');
    await authService.updateProfile(user.uid, fields);
    const updated = await authService.getCustomerProfile(user.uid);
    setProfile(updated);
    return updated;
  };

  const value = {
    user,
    profile,
    loading,
    emailVerified,
    isCustomer: profile?.role === 'customer' || !profile?.role,
    register,
    login,
    loginWithGoogle,
    logout,
    refreshUser,
    resendVerification,
    sendPasswordReset,
    updateCustomerProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
