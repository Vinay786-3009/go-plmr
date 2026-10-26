import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "go-plmr.firebaseapp.com",
  projectId: "go-plmr",
  storageBucket: "go-plmr.firebasestorage.app",
  messagingSenderId: "918927392670",
  appId: "1:918927392670:web:76bfd3d80d56a1fe1f208f",
  measurementId: "G-L0KRE6VX2H",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || undefined,
};

// Initialize App
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Core Services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Functions client (US Central default, configurable)
export const functions: Functions = getFunctions(app, 'asia-south1');

// Realtime Database initialization (Safe detection)
let rtdbInstance: Database | null = null;
const customDbUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;

try {
  if (customDbUrl) {
    rtdbInstance = getDatabase(app, customDbUrl);
  } else {
    // Attempt default initialization if defined in project
    rtdbInstance = getDatabase(app);
  }
} catch (error) {
  console.warn('Realtime Database not yet configured or URL is missing:', error);
  rtdbInstance = null;
}

export const rtdb: Database | null = rtdbInstance;

// Helper to check if RTDB is active
export const isRTDBConfigured = (): boolean => {
  return rtdbInstance !== null;
};

// Helper to check if API key is present
export const isFirebaseConfigured = (): boolean => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return Boolean(key && key !== 'YOUR_FIREBASE_WEB_API_KEY' && key.length > 10);
};

export const FIREBASE_PROJECT_ID = "go-plmr";
export const PALAMANER_COORDINATES = {
  lat: 13.2000,
  lng: 78.7500,
  cityName: 'Palamaner',
  stateName: 'Andhra Pradesh',
  country: 'India',
  defaultRadiusKm: 50,
};
