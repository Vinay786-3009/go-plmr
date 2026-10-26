import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export const authService = {
  /**
   * Register a new customer account
   * Creates Auth user, sends verification email link, and creates Firestore profile
   * Recovers smoothly if account was already created during a previous failed write.
   */
  async registerCustomer({ fullName, email, password, phoneNumber = '' }) {
    let user;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phoneNumber.trim();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      user = userCredential.user;
    } catch (authErr) {
      if (authErr.code === 'auth/email-already-in-use') {
        // Attempt sign-in with the provided password to recover profile doc if previous attempt was interrupted
        try {
          const signInCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
          user = signInCred.user;
        } catch (signInErr) {
          throw authErr; // Password didn't match, throw original email-already-in-use
        }
      } else {
        throw authErr;
      }
    }

    // Update display name
    try {
      await updateProfile(user, { displayName: cleanName });
    } catch (e) {
      console.warn('Failed to set displayName:', e);
    }

    // Send email verification link
    try {
      await sendEmailVerification(user);
    } catch (verifErr) {
      console.warn('Could not dispatch verification email:', verifErr);
    }

    // Create or merge customer profile in Firestore 'users' collection
    const now = new Date().toISOString();
    const userDocRef = doc(db, 'users', user.uid);
    const profileData = {
      uid: user.uid,
      fullName: cleanName,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      role: 'customer', // strictly customer
      status: 'active',
      totalRidesAsCustomer: 0,
      savedPlaces: [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(userDocRef, profileData, { merge: true });
    } catch (firestoreErr) {
      console.error('Firestore profile write error:', firestoreErr);
      throw firestoreErr;
    }

    return { user, profile: profileData };
  },

  /**
   * Google Sign In
   */
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Fetch or create profile
    let profile = await this.getCustomerProfile(user.uid);
    if (!profile) {
      const now = new Date().toISOString();
      const profileData = {
        uid: user.uid,
        fullName: user.displayName || 'GO PLMR Rider',
        email: user.email?.toLowerCase() || '',
        phoneNumber: user.phoneNumber || '',
        role: 'customer',
        status: 'active',
        totalRidesAsCustomer: 0,
        savedPlaces: [],
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
      profile = profileData;
    }

    return { user, profile };
  },

  /**
   * Log in customer with email and password
   */
  async loginCustomer(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    // Reload auth user
    await user.reload();
    const refreshedUser = auth.currentUser || user;

    // Fetch Firestore profile
    let profile = await this.getCustomerProfile(refreshedUser.uid);

    if (!profile) {
      const now = new Date().toISOString();
      const profileData = {
        uid: refreshedUser.uid,
        fullName: refreshedUser.displayName || cleanEmail.split('@')[0],
        email: refreshedUser.email || cleanEmail,
        phoneNumber: refreshedUser.phoneNumber || '',
        role: 'customer',
        status: 'active',
        totalRidesAsCustomer: 0,
        savedPlaces: [],
        createdAt: now,
        updatedAt: now,
      };
      try {
        await setDoc(doc(db, 'users', refreshedUser.uid), profileData, { merge: true });
        profile = profileData;
      } catch (err) {
        console.warn('Could not write fallback profile:', err);
      }
    }

    return { user: refreshedUser, profile };
  },

  /**
   * Resend email verification link
   */
  async resendVerificationEmail(user) {
    if (!user) throw new Error('No authenticated user found.');
    await sendEmailVerification(user);
  },

  /**
   * Send password reset email
   */
  async sendPasswordReset(email) {
    if (!email) throw new Error('Please provide an email address.');
    await sendPasswordResetEmail(auth, email.trim());
  },

  /**
   * Reload and check if current user is email verified
   */
  async checkEmailVerified(user) {
    if (!user) return false;
    await user.reload();
    return Boolean(auth.currentUser?.emailVerified);
  },

  /**
   * Get customer profile from 'users' collection
   */
  async getCustomerProfile(uid) {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { uid: snap.id, ...snap.data() };
    } catch (error) {
      console.warn('Error reading customer profile:', error);
      return null;
    }
  },

  /**
   * Update profile fields
   */
  async updateProfile(uid, fields) {
    const docRef = doc(db, 'users', uid);
    const updateData = {
      ...fields,
      updatedAt: new Date().toISOString(),
    };
    delete updateData.role;
    delete updateData.uid;

    await updateDoc(docRef, updateData);
    return updateData;
  },

  /**
   * Sign out current user
   */
  async logout() {
    await signOut(auth);
  },

  /**
   * Map Firebase Auth error codes to friendly messages
   */
  getFriendlyErrorMessage(error) {
    if (!error) return 'An unexpected error occurred.';
    const code = error.code || '';

    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact GO PLMR support.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify your credentials.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please log in or use your password.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/too-many-requests':
        return 'Too many attempts. For security reasons, please wait a minute before trying again.';
      case 'auth/network-request-failed':
        return 'Network connection issue. Please check your internet connection.';
      case 'permission-denied':
        return 'Permission denied by database security rules. Please check with administrator.';
      default:
        return error.message || 'Authentication error. Please try again.';
    }
  },
};
