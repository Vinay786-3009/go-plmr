import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB4wz3RgS_-Eeyg9FCbu4GzuXkh8JYNfcg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "go-plmr.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "go-plmr",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "go-plmr.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "918927392670",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:918927392670:web:76bfd3d80d56a1fe1f208f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L0KRE6VX2H"
};

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with local persistence
export const auth = getAuth(app);
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Failed to set auth persistence:", err);
  });
} catch (e) {
  console.warn("Persistence initialization error:", e);
}

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Service area configuration for Palamaner, AP
export const PALAMANER_CONFIG = {
  cityName: "Palamaner",
  stateName: "Andhra Pradesh",
  country: "India",
  center: {
    lat: 13.2000,
    lng: 78.7500
  },
  defaultRadiusKm: 50,
  vehicleCategories: [
    { id: 'bike', label: 'Bike Taxi', icon: 'Bike', capacity: 1, baseFare: 25, perKm: 7 },
    { id: 'auto', label: 'Auto Rickshaw', icon: 'Car', capacity: 3, baseFare: 35, perKm: 12 },
    { id: 'cab', label: 'Car / Cab', icon: 'CarFront', capacity: 4, baseFare: 60, perKm: 18 },
    { id: 'mini', label: 'Mini Auto / Cargo', icon: 'Truck', capacity: 2, baseFare: 50, perKm: 15 }
  ]
};

export default app;
