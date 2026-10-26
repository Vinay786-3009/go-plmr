import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, reload } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let unsubscribeDriver = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthError(null);

      if (currentUser) {
        // Subscribe to real-time driver profile updates in Firestore
        const driverRef = doc(db, 'drivers', currentUser.uid);
        unsubscribeDriver = onSnapshot(
          driverRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              setDriverProfile({ id: docSnap.id, uid: docSnap.id, ...docSnap.data() });
              setLoading(false);
            } else {
              // Fallback: check if driver profile exists by email query (in case driver was registered with custom doc ID)
              try {
                if (currentUser.email) {
                  const q = query(
                    collection(db, 'drivers'),
                    where('email', '==', currentUser.email.toLowerCase().trim()),
                    limit(1)
                  );
                  const querySnap = await getDocs(q);
                  if (!querySnap.empty) {
                    const foundDoc = querySnap.docs[0];
                    setDriverProfile({ id: foundDoc.id, uid: foundDoc.id, ...foundDoc.data() });
                  } else {
                    setDriverProfile(null);
                  }
                } else {
                  setDriverProfile(null);
                }
              } catch (e) {
                console.warn("Driver fallback query note:", e.message);
                setDriverProfile(null);
              }
              setLoading(false);
            }
          },
          (err) => {
            console.error("Error listening to driver profile:", err);
            setLoading(false);
          }
        );
      } else {
        if (unsubscribeDriver) unsubscribeDriver();
        setDriverProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDriver) unsubscribeDriver();
    };
  }, []);

  // Reload Firebase Auth user to check email verification status
  const checkEmailVerification = async () => {
    if (!auth.currentUser) return false;
    await reload(auth.currentUser);
    const updated = auth.currentUser;
    setUser({ ...updated });
    return updated.emailVerified;
  };

  const registerWithEmailPassword = async (data) => {
    setAuthError(null);
    try {
      const res = await authService.registerDriver(data);
      return res;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const loginWithEmailPassword = async (email, password) => {
    setAuthError(null);
    try {
      const loggedUser = await authService.loginDriver(email, password);
      return loggedUser;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logoutDriver(user?.uid);
      setUser(null);
      setDriverProfile(null);
    } catch (err) {
      console.error("Logout error:", err);
      throw err;
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) throw new Error("No active session.");
    await authService.resendVerificationEmail(auth.currentUser);
    return true;
  };

  const sendPasswordReset = async (email) => {
    await authService.sendPasswordReset(email);
    return true;
  };

  const requestEmailOtp = async (email) => {
    return await authService.requestEmailOtp(email);
  };

  const verifyEmailOtp = async (email, otp) => {
    const verifiedUser = await authService.verifyEmailOtp(email, otp);
    return verifiedUser;
  };

  const applyAsDriver = async (data) => {
    setAuthError(null);
    try {
      const res = await authService.applyAsDriverForExistingUser(user, data);
      return res;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    driverProfile,
    hasDriverProfile: Boolean(driverProfile),
    loading,
    authError,
    setAuthError,
    isEmailVerified: Boolean(user?.emailVerified),
    approvalStatus: driverProfile?.approvalStatus || 'pending',
    checkEmailVerification,
    registerWithEmailPassword,
    completeDriverProfile: applyAsDriver,
    applyAsDriver,
    loginWithEmailPassword,
    logout,
    resendVerification,
    sendPasswordReset,
    requestEmailOtp,
    verifyEmailOtp
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
