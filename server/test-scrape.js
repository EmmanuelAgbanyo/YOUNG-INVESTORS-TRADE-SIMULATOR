const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cheerio = require('cheerio');

async function testScrape() {
    console.log("Starting test scrape...");
    try {
        const resData = await fetch('https://afx.kwayisi.org/gse/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const data = await resData.text();
        const $ = cheerio.load(data);
        
        let targetTable = null;
        $('table').each((i, table) => {
            const thText = $(table).find('th').text();
            if (thText.includes('Ticker') && thText.includes('Price')) {
                targetTable = table;
                return false;
            }
        });

        if (targetTable) {
            console.log("Found target table!");
            const stocks = [];
            $(targetTable).find('tbody tr').each((i, row) => {
                const cols = $(row).find('td');
                if (cols.length >= 4) {
                    const symbol = $(cols[0]).text().trim();
                    const priceStr = $(cols[3]).text().trim().replace(/,/g, '');
                    const price = parseFloat(priceStr) || 0;
                    if (symbol && price > 0) {
                        stocks.push({ symbol, price });
                    }
                }
            });
            console.log("Scraped stocks:", stocks.slice(0, 5));
        } else {
            console.log("Target table NOT found.");
        }
    } catch (error) {
        console.error("Scrape failed:", error.message);
    }
}

testScrape();
