import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmKXv8w3KMqfLbP3JI1LU_1m8dWiCkdr0",
  authDomain: "NovaWatchhize.firebaseapp.com",
  projectId: "NovaWatchhize",
  storageBucket: "NovaWatchhize.firebasestorage.app",
  messagingSenderId: "998909432848",
  appId: "1:998909432848:web:09757b5295339ffe0ea695",
  measurementId: "G-VK283ZECF4",
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db, GoogleAuthProvider };
