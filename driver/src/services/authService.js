import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail,
  signInWithCustomToken,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const authService = {
  // Method A: Email + Password Registration for Brand New Users
  async registerDriver({ email, password, fullName, phoneNumber, vehicleCategory, vehicleDetails, documents, photoUrl }) {
    const cleanEmail = email.trim().toLowerCase();
    let userCredential;

    try {
      userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        const customErr = new Error("An account with this email already exists in GO PLMR. Please sign in with your existing password to link your driver partner application.");
        customErr.code = 'auth/email-already-in-use';
        customErr.isExistingAccount = true;
        customErr.existingEmail = cleanEmail;
        throw customErr;
      }
      throw err;
    }

    const user = userCredential.user;

    // Set display name in Auth
    if (fullName) {
      try {
        await updateProfile(user, { displayName: fullName });
      } catch (e) {
        console.warn("Could not set display name:", e);
      }
    }

    // Send verification email
    try {
      await sendEmailVerification(user);
    } catch (e) {
      console.warn("Could not dispatch verification email:", e);
    }

    const nowIso = new Date().toISOString();

    // Create user record in 'users' collection with multi-role support
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: cleanEmail,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      role: 'driver',
      roles: ['driver'],
      isDriver: true,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso
    });

    // Create driver record in 'drivers' collection
    const driverRef = doc(db, 'drivers', user.uid);
    const driverData = {
      uid: user.uid,
      fullName: fullName.trim(),
      email: cleanEmail,
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      photoUrl: photoUrl || '',
      profileImageUrl: photoUrl || '',
      vehicleCategory: vehicleCategory || 'auto',
      vehicleDetails: {
        plateNumber: vehicleDetails?.plateNumber || '',
        makeModel: vehicleDetails?.makeModel || '',
        color: vehicleDetails?.color || '',
        year: vehicleDetails?.year || ''
      },
      documents: {
        dlNumber: documents?.dlNumber || '',
        dlUrl: documents?.dlUrl || '',
        rcNumber: documents?.rcNumber || '',
        rcUrl: documents?.rcUrl || '',
        insuranceNumber: documents?.insuranceNumber || '',
        insuranceUrl: documents?.insuranceUrl || '',
        aadharNumber: documents?.aadharNumber || '',
        aadharUrl: documents?.aadharUrl || '',
        submittedAt: nowIso,
        verifiedAt: null
      },
      approvalStatus: 'pending', // 'pending' | 'approved' | 'rejected' | 'suspended'
      rejectionReason: null,
      suspensionReason: null,
      isOnline: false,
      activeRideId: null,
      helmetStrikes: 0,
      ratings: {
        average: 5.0,
        count: 0
      },
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await setDoc(driverRef, driverData);
    return { user, driverProfile: driverData };
  },

  // Apply as Driver for an Existing Authenticated Account (Customer or Admin)
  // Preserves existing roles and customer records without overwrite
  async applyAsDriverForExistingUser(user, { fullName, phoneNumber, vehicleCategory, vehicleDetails, documents, photoUrl }) {
    if (!user || !user.uid) throw new Error("User must be authenticated to submit driver application.");
    const nowIso = new Date().toISOString();
    const cleanEmail = (user.email || '').trim().toLowerCase();

    // 1. Read existing user record in 'users' collection to inspect current role
    const userRef = doc(db, 'users', user.uid);
    let existingData = {};
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        existingData = snap.data();
      }
    } catch (e) {
      console.warn("Could not read existing user doc:", e);
    }

    // 2. Preserve existing role (admin / customer) while establishing multi-role array
    const existingRole = existingData.role;
    const existingRoles = Array.isArray(existingData.roles) 
      ? existingData.roles 
      : (existingRole ? [existingRole] : ['customer']);
    
    // Add 'driver' role to membership list
    const updatedRoles = Array.from(new Set([...existingRoles, 'driver']));

    // NEVER overwrite an admin role with driver!
    // If existing user is admin, keep role: 'admin' for compatibility with admin-bundle
    // If existing user is customer, keep role: 'customer' for compatibility with customer-bundle
    let primaryRole = 'driver';
    if (existingRole === 'admin') {
      primaryRole = 'admin';
    } else if (existingRole === 'customer') {
      primaryRole = 'customer';
    }

    // Update display name in Auth if missing
    if (fullName && (!user.displayName || user.displayName !== fullName)) {
      try {
        await updateProfile(user, { displayName: fullName });
      } catch (e) {
        console.warn("Could not update auth display name:", e);
      }
    }

    // Safely update user record in 'users' with merge: true (never overwrites customer data)
    await setDoc(userRef, {
      uid: user.uid,
      email: cleanEmail,
      fullName: (fullName || existingData.fullName || user.displayName || 'Driver Partner').trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : (existingData.phoneNumber || ''),
      role: primaryRole,
      roles: updatedRoles,
      isDriver: true,
      updatedAt: nowIso
    }, { merge: true });

    // 3. Create dedicated driver record in 'drivers' collection
    const driverRef = doc(db, 'drivers', user.uid);
    const driverData = {
      uid: user.uid,
      fullName: (fullName || existingData.fullName || user.displayName || 'Driver Partner').trim(),
      email: cleanEmail,
      phoneNumber: phoneNumber ? phoneNumber.trim() : (existingData.phoneNumber || ''),
      photoUrl: photoUrl || user.photoURL || '',
      profileImageUrl: photoUrl || user.photoURL || '',
      vehicleCategory: vehicleCategory || 'auto',
      vehicleDetails: {
        plateNumber: vehicleDetails?.plateNumber || '',
        makeModel: vehicleDetails?.makeModel || '',
        color: vehicleDetails?.color || '',
        year: vehicleDetails?.year || ''
      },
      documents: {
        dlNumber: documents?.dlNumber || '',
        dlUrl: documents?.dlUrl || '',
        rcNumber: documents?.rcNumber || '',
        rcUrl: documents?.rcUrl || '',
        insuranceNumber: documents?.insuranceNumber || '',
        insuranceUrl: documents?.insuranceUrl || '',
        aadharNumber: documents?.aadharNumber || '',
        aadharUrl: documents?.aadharUrl || '',
        submittedAt: nowIso,
        verifiedAt: null
      },
      approvalStatus: 'pending', // Awaiting Admin verification
      rejectionReason: null,
      suspensionReason: null,
      isOnline: false,
      activeRideId: null,
      helmetStrikes: 0,
      ratings: {
        average: 5.0,
        count: 0
      },
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await setDoc(driverRef, driverData, { merge: true });
    return driverData;
  },

  // Method A: Email + Password Login
  async loginDriver(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return userCredential.user;
  },

  // Resend Email Verification link with validation
  async resendVerificationEmail(user) {
    const currentUser = user || auth.currentUser;
    if (!currentUser) throw new Error("No active user session found. Please log in first.");
    await sendEmailVerification(currentUser);
    return true;
  },

  // Password Reset
  async sendPasswordReset(email) {
    if (!email || !email.includes('@')) {
      throw new Error("Please enter a valid email address.");
    }
    await sendPasswordResetEmail(auth, email.trim());
    return true;
  },

  // Method B: Request Email OTP from real server-side service
  async requestEmailOtp(email) {
    const cleanEmail = email.trim().toLowerCase();
    const otpApiUrl = import.meta.env.VITE_OTP_API_URL;

    // Check if secure backend is configured
    if (!otpApiUrl) {
      return {
        success: false,
        requiresBackend: true,
        message: "Server-side Email OTP service is not yet configured. Please configure VITE_OTP_API_URL with your verified email provider endpoint (see backend setup instructions)."
      };
    }

    const response = await fetch(`${otpApiUrl}/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, role: 'driver' })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Failed to request OTP (Status ${response.status})`);
    }

    return {
      success: true,
      message: data.message || "A 6-digit OTP code has been sent to your email.",
      cooldownSeconds: data.cooldownSeconds || 60
    };
  },

  // Method B: Verify Email OTP securely via server
  async verifyEmailOtp(email, otpCode) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();
    const otpApiUrl = import.meta.env.VITE_OTP_API_URL;

    if (!otpApiUrl) {
      throw new Error("Server-side Email OTP service endpoint is missing. Please use Email + Password method or configure VITE_OTP_API_URL.");
    }

    const response = await fetch(`${otpApiUrl}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: cleanOtp, role: 'driver' })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "OTP verification failed. Please check the code and try again.");
    }

    // If server returns a Firebase custom token, sign in with it securely
    if (data.customToken) {
      const userCredential = await signInWithCustomToken(auth, data.customToken);
      return userCredential.user;
    }

    throw new Error("Invalid response from OTP server. Missing custom token.");
  },

  // Fetch driver profile from Firestore
  async getDriverProfile(uid) {
    if (!uid) return null;
    const driverRef = doc(db, 'drivers', uid);
    const snap = await getDoc(driverRef);
    if (!snap.exists()) return null;
    return { id: snap.id, uid: snap.id, ...snap.data() };
  },

  // Logout
  async logoutDriver(uid) {
    if (uid) {
      try {
        // Mark driver offline upon logout
        const driverRef = doc(db, 'drivers', uid);
        await updateDoc(driverRef, {
          isOnline: false,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Could not set offline on logout:", e);
      }
    }
    await signOut(auth);
  }
};
