const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, ref, set } = require('firebase/database');
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

async function loginScraper() {
    try {
        await signInWithEmailAndPassword(auth, SCRAPER_EMAIL, SCRAPER_PASSWORD);
        console.log("✓ Scraper logged into Firebase");
    } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
            console.log("Scraper user not found. Creating...");
            try {
                await createUserWithEmailAndPassword(auth, SCRAPER_EMAIL, SCRAPER_PASSWORD);
                console.log("✓ Scraper user created and logged in!");
            } catch (createErr) {
                console.error("Failed to create scraper user:", createErr.message);
            }
        } else {
            console.error("Failed to login scraper:", err.message);
        }
    }
}

async function scrapeGSE() {
    console.log(`[${new Date().toISOString()}] Starting GSE Scrape...`);
    let stocks = [];

    // Dynamically import Cheerio since it's ESM
    const cheerioModule = await import('cheerio');
    const cheerio = cheerioModule.default || cheerioModule;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const resData = await fetch('https://afx.kwayisi.org/gse/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await resData.text();
        const $ = cheerio.load(data);
        
        let targetTable = null;
        $('table').each((i, table) => {
            if ($(table).find('th').text().includes('Ticker') && $(table).find('th').text().includes('Price')) {
                targetTable = table;
                return false;
            }
        });

        if (targetTable) {
            $(targetTable).find('tbody tr').each((i, row) => {
                const cols = $(row).find('td');
                if (cols.length >= 4) {
                    const symbol = $(cols[0]).text().trim();
                    const price = parseFloat($(cols[1]).text().trim()) || 0;
                    const change = parseFloat($(cols[2]).text().trim()) || 0;
                    const volume = parseInt($(cols[3]).text().trim().replace(/,/g, '')) || 0;

                    if (symbol && price > 0) {
                        stocks.push({ symbol, price, change, volume });
                    }
                }
            });
        }
    } catch (error) {
        console.error("Scrape failed:", error.message);
    }

    if (stocks.length === 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const apiRes = await fetch('https://dev.kwayisi.org/apis/gse/live', {
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (apiRes.ok) {
                const data = await apiRes.json();
                if (Array.isArray(data)) {
                    stocks = data.map(item => ({
                        symbol: item.name,
                        price: parseFloat(item.price) || 0,
                        change: parseFloat(item.change) || 0,
                        volume: parseInt(item.volume) || 0
                    })).filter(s => s.symbol && s.price > 0);
                }
            }
        } catch (apiError) {
             console.error('Secondary API fetch failed:', apiError.message);
        }
    }

    if (stocks.length === 0) {
        console.log("Using Mock Data fallback.");
        stocks = [
            { symbol: "MTNGH", price: 1.60, change: 0, volume: 1000 }, 
            { symbol: "SCB", price: 18.23, change: 0, volume: 500 }, 
            { symbol: "GCB", price: 3.40, change: 0, volume: 2000 },
            { symbol: "EGL", price: 2.39, change: 0, volume: 0 }, 
            { symbol: "GOIL", price: 1.50, change: 0, volume: 0 }, 
            { symbol: "TOTAL", price: 9.00, change: 0, volume: 0 }
        ];
    }

    try {
        if (!auth.currentUser) await loginScraper();
        
        const marketMap = {};
        stocks.forEach(s => { marketMap[s.symbol] = s; });

        await set(ref(db, 'market_data'), marketMap);
        console.log("✓ Pushed to real-time database!");
    } catch (err) {
        console.error("Firebase write error:", err.message);
    }
}

async function start() {
    await loginScraper();
    scrapeGSE();
    setInterval(scrapeGSE, 60000);
}

start();
