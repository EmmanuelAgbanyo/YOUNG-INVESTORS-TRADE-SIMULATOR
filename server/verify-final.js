const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, ref, get, child } = require('firebase/database');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const firebaseConfig = {
  apiKey: "AIzaSyARK3F417iYyTn0EC9b9V0ZdjupoKkdUKE",
  authDomain: "yin-trade-simulator-2026.firebaseapp.com",
  databaseURL: "https://yin-trade-simulator-2026-default-rtdb.firebaseio.com",
  projectId: "yin-trade-simulator-2026",
  storageBucket: "yin-trade-simulator-2026.firebasestorage.app",
  messagingSenderId: "943093835767",
  appId: "1:943093835767:web:dcc39dd02313b35618f0f2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const SCRAPER_EMAIL = "scraper@yintrade.com";
const SCRAPER_PASSWORD = process.env.SCRAPER_PASSWORD || "scraper_secret_secure_password_123";

async function verifyFinal() {
    try {
        await signInWithEmailAndPassword(auth, SCRAPER_EMAIL, SCRAPER_PASSWORD);
        const dbRef = ref(db);
        
        const nodes = ['profiles', 'portfolios', 'holdings', 'orders', 'history', 'teams'];
        for (const node of nodes) {
            const snap = await get(child(dbRef, node));
            if (snap.exists()) {
                console.log(`Node [${node}] contents:`, Object.keys(snap.val()));
            } else {
                console.log(`Node [${node}] is empty.`);
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyFinal();
