import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB4wz3RgS_-Eeyg9FCbu4GzuXkh8JYNfcg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "go-plmr.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "go-plmr",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "go-plmr.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "918927392670",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:918927392670:web:76bfd3d80d56a1fe1f208f",
};

// Initialize App safely
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Core Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Project constants
export const FIREBASE_PROJECT_ID = "go-plmr";
export const PALAMANER_COORDINATES = {
  lat: 13.2000,
  lng: 78.7500,
  cityName: 'Palamaner',
  stateName: 'Andhra Pradesh',
  country: 'India',
  defaultRadiusKm: 50,
};

export const isFirebaseConfigured = () => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey;
  return Boolean(key && key !== 'YOUR_FIREBASE_WEB_API_KEY' && key.length > 10);
};
