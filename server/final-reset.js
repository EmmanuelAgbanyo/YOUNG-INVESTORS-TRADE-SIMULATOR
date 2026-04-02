const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, ref, remove, child } = require('firebase/database');
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

// List of UIDs to purge (collected from auth_get_users)
const UIDS_TO_PURGE = [
    "4xtMeZJ5ZyV42zKmtAb0fVLQV8E2", // policyp28@gmail.com
    "99GG439obtfz0e8to6DWctjKZyh1", // cardinal@yintrade.com
    "CyUNVMrT6CVnRCsSZDjRvzwi2Ip1", // ghh@yintrade.com
    "Iy7x1Q3XtMfEA8lzbAEe6DAvYoa2", // presec@yintrade.com
    "K8aNyw87gDf4vBbulJtzG8ie1XI3", // mofutrel@gmail.com
    "tPNV131RSOPiRO5eMgzF54i10K72", // esther@gmail.com
    "z2uEzJPYJxdyWmBZdBwX5vxbPdP2"  // adonsco@yintrade.com
];

async function runFinalReset() {
    try {
        console.log("Logging into Firebase...");
        await signInWithEmailAndPassword(auth, SCRAPER_EMAIL, SCRAPER_PASSWORD);
        console.log("Logged in. Starting targeted purge...");
        
        const dbRef = ref(db);
        
        for (const uid of UIDS_TO_PURGE) {
            console.log(`Purging data for UID: ${uid}...`);
            // Delete all user-specific data nodes
            const paths = [
                `profiles/${uid}`,
                `portfolios/${uid}`,
                `holdings/${uid}`,
                `orders/${uid}`,
                `history/${uid}`
            ];
            
            for (const p of paths) {
                try {
                    await remove(child(dbRef, p));
                } catch (err) {
                    console.error(`Failed to delete ${p}:`, err.message);
                }
            }
        }
        
        // Clear global nodes that have .write: auth != null
        console.log("Clearing global team/invote nodes...");
        await remove(child(dbRef, 'teams')).catch(e => console.log("Skip teams direct delete"));
        await remove(child(dbRef, 'team_members')).catch(e => console.log("Skip team_members direct delete"));
        await remove(child(dbRef, 'team_invites')).catch(e => console.log("Skip team_invites direct delete"));
        
        console.log("Purge complete.");
        process.exit(0);
    } catch (err) {
        console.error("Critical error:", err);
        process.exit(1);
    }
}

runFinalReset();
