import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARK3F417iYyTn0EC9b9V0ZdjupoKkdUKE",
  authDomain: "yin-trade-simulator-2026.firebaseapp.com",
  databaseURL: "https://yin-trade-simulator-2026-default-rtdb.firebaseio.com",
  projectId: "yin-trade-simulator-2026",
  storageBucket: "yin-trade-simulator-2026.firebasestorage.app",
  messagingSenderId: "943093835767",
  appId: "1:943093835767:web:dcc39dd02313b35618f0f2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
