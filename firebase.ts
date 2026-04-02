import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyARK3F417iYyTn0EC9b9V0ZdjupoKkdUKE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "yin-trade-simulator-2026.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://yin-trade-simulator-2026-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "yin-trade-simulator-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "yin-trade-simulator-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "943093835767",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:943093835767:web:dcc39dd02313b35618f0f2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
