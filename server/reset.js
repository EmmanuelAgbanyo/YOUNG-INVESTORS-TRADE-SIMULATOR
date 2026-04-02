const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, ref, get, remove, child } = require('firebase/database');
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

async function runReset() {
    try {
        console.log("Logging into Firebase...");
        await signInWithEmailAndPassword(auth, SCRAPER_EMAIL, SCRAPER_PASSWORD);
        console.log("Logged in. Fetching data...");
        
        const dbRef = ref(db);
        
        // 1. Fetch profiles
        const profilesSnap = await get(child(dbRef, 'profiles'));
        if (profilesSnap.exists()) {
            const profiles = profilesSnap.val();
            let adminId = null;
            const idsToDelete = [];
            
            for (const [id, profile] of Object.entries(profiles)) {
                if (profile.name === 'Admin') {
                    console.log(`Found Admin profile: ${id}`);
                    adminId = id;
                } else {
                    idsToDelete.push(id);
                }
            }
            
            console.log(`Found ${idsToDelete.length} user profiles to delete.`);
            
            // 2. Delete user nodes
            for (const id of idsToDelete) {
                console.log(`Deleting data for profile ${id}...`);
                await remove(child(dbRef, `profiles/${id}`));
                await remove(child(dbRef, `portfolios/${id}`));
                await remove(child(dbRef, `holdings/${id}`));
                await remove(child(dbRef, `orders/${id}`));
                await remove(child(dbRef, `history/${id}`));
            }
        } else {
            console.log("No profiles node found or it's empty.");
        }
        
        // 3. Clear all team related data
        console.log("Clearing team data...");
        const teamsSnap = await get(child(dbRef, 'teams'));
        if (teamsSnap.exists()) {
            for (const teamId of Object.keys(teamsSnap.val())) {
                await remove(child(dbRef, `teams/${teamId}`));
            }
        }
        
        await remove(child(dbRef, 'team_members'));
        await remove(child(dbRef, 'team_invites'));
        
        // 4. Clear all historical records individually due to rule restrictions
        console.log("Clearing all historical records individually...");
        const historySnap = await get(child(dbRef, 'history'));
        if (historySnap.exists()) {
            for (const histId of Object.keys(historySnap.val())) {
                console.log(`Deleting history for ${histId}...`);
                await remove(child(dbRef, `history/${histId}`));
            }
        }
        
        console.log("Reset complete! Only Admin remains.");
        process.exit(0);
    } catch (err) {
        console.error("Error during reset:", err);
        process.exit(1);
    }
}

runReset();
