// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence, getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Debug: check which values are missing
console.log('Firebase Config Check:', {
  apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: !!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
});

// 1. Initialize Firebase safely
const existingApps = getApps();
const app = existingApps.length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize auth with LOCAL persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });
} catch (error) {
  auth = getAuth(app);
}

// 3. Initialize Analytics safely
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// 4. Initialize Firestore
const db = getFirestore(app);

export { auth, analytics, db };