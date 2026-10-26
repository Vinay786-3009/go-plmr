import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  type User,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type ParsedToken,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  claims: ParsedToken | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [claims, setClaims] = useState<ParsedToken | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminPrivileges = useCallback(async (firebaseUser: User): Promise<boolean> => {
    try {
      // 1. Primary check: Firebase Auth Custom Claims (Production Standard)
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      setClaims(tokenResult.claims);

      if (tokenResult.claims.admin === true || tokenResult.claims.role === 'admin') {
        return true;
      }

      // 2. Secondary check: Firestore `admins` collection (by UID or Email)
      try {
        const adminDocRef = doc(db, 'admins', firebaseUser.uid);
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists() && adminDoc.data()?.isActive !== false) {
          return true;
        }

        if (firebaseUser.email) {
          const emailDocRef = doc(db, 'admins', firebaseUser.email.toLowerCase());
          const emailDoc = await getDoc(emailDocRef);
          if (emailDoc.exists() && emailDoc.data()?.isActive !== false) {
            return true;
          }
        }

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data()?.role === 'admin' && userDoc.data()?.status !== 'suspended') {
          return true;
        }
      } catch (firestoreError) {
        console.warn('Firestore admin verification fallback:', firestoreError);
      }

      // 3. Fallback for authorized project administrators
      if (
        firebaseUser.email === 'vinay76b@gmail.com' ||
        firebaseUser.email === 'janueducation119@gmail.com'
      ) {
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error verifying admin authorization:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);

      if (firebaseUser) {
        setUser(firebaseUser);
        const isAuthorizedAdmin = await checkAdminPrivileges(firebaseUser);
        setIsAdmin(isAuthorizedAdmin);
      } else {
        setUser(null);
        setIsAdmin(false);
        setClaims(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [checkAdminPrivileges]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const isAuthorized = await checkAdminPrivileges(userCredential.user);
      setUser(userCredential.user);
      setIsAdmin(isAuthorized);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setClaims(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshClaims = async () => {
    if (auth.currentUser) {
      const isAuthorized = await checkAdminPrivileges(auth.currentUser);
      setIsAdmin(isAuthorized);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        claims,
        loading,
        error,
        login,
        logout,
        resetPassword,
        refreshClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
