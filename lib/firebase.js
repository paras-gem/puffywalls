// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence, getAuth } from "firebase/auth"; // Imported persistence tools
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBFfHHIM_FSUCL8sbmwUpQcNXED8zl9VrE",
  authDomain: "puffywalls.firebaseapp.com",
  projectId: "puffywalls",
  storageBucket: "puffywalls.firebasestorage.app",
  messagingSenderId: "542013695866",
  appId: "1:542013695866:web:a86e85eb8c80045da598c3",
  measurementId: "G-PVD8K4C2HM"
};

// 1. Initialize Firebase safely (Prevents crashes during Next.js hot-reloads)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Explicitly initialize auth with LOCAL persistence enabled
// This keeps the user signed in even if the server closes or they leave the site
let auth;
if (getApps().length > 0) {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });
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

// Clean single export point for your application components
export { auth, analytics };