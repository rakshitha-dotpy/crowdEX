import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCmKXv8w3KMqfLbP3JI1LU_1m8dWiCkdr0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "NovaWatchhize.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "NovaWatchhize",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "NovaWatchhize.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "998909432848",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:998909432848:web:09757b5295339ffe0ea695",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VK283ZECF4",
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db, GoogleAuthProvider };
