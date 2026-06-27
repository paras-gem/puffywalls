// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence, getAuth } from "firebase/auth"; // Imported persistence tools
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,    // firebase -web apiKey (chrome  dev console - project settings - general - scroll down to SDKs)  
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,    // firebase -web authDomain (chrome  dev console - project settings - general - scroll down to SDKs)  
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,    // firebase -web projectId (chrome  dev console - project settings - general - scroll down to SDKs)  
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,    // firebase -web storageBucket (chrome  dev console - project settings - general - scroll down to SDKs)  
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,    // firebase -web messagingSenderId (chrome  dev console - project settings - general - scroll down to SDKs)  
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,    // firebase -web appId (chrome  dev console - project settings - general - scroll down to SDKs)  
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID    // firebase -web measurementId (chrome  dev console - project settings - general - scroll down to SDKs)  
};

// 1. Initialize Firebase safely (Prevents crashes during Next.js hot-reloads)
const existingApps = getApps();
const app = existingApps.length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Explicitly initialize auth with LOCAL persistence enabled.
// initializeAuth can only run once per app, so fall back to getAuth during hot reloads.
let auth;
try {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });
} catch (error) {
  auth = getAuth(app);
}

// 3. Initialize Analytics safely (Only runs in the browser, never on the server)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// 4. Initialize Firestore Database
const db = getFirestore(app);

// Clean single export point for your application components
export { auth, analytics, db };