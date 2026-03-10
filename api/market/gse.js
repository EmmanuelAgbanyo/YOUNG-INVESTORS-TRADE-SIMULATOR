export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        let stocks = [];

        // Primary Source: Official Kwayisi GSE REST API (Fast, Reliable, JSON)
        try {
            const gseResponse = await fetch('https://dev.kwayisi.org/apis/gse/live', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                },
            });

            if (!gseResponse.ok) {
                throw new Error(`Kwayisi API returned status ${gseResponse.status}`);
            }

            const data = await gseResponse.json();

            console.log('[GSE API] Raw data:', data);
            if (Array.isArray(data)) {
                stocks = data.map(item => ({
                    symbol: item.name, // The API uses 'name' for the ticker symbol (e.g., 'MTNGH')
                    price: parseFloat(item.price) || 0,
                    change: parseFloat(item.change) || 0,
                    volume: parseInt(item.volume) || 0
                })).filter(s => s.symbol && s.price > 0);
            }
        } catch (apiError) {
            console.error('Kwayisi REST API Fetch Error:', apiError.message);
        }

        if (stocks.length > 0) {
            return res.status(200).json(stocks);
        } else {
            // Return hardcoded mock data as an absolute last resort if the network fails entirely, ensuring UI never breaks
            const MOCK_FALLBACK = [
                { symbol: "MTNGH", price: 1.60 }, { symbol: "SCB", price: 18.23 }, { symbol: "GCB", price: 3.40 },
                { symbol: "EGL", price: 2.39 }, { symbol: "GOIL", price: 1.50 }, { symbol: "TOTAL", price: 9.00 }
            ];
            console.warn("Returning MOCK fallback data due to Kwayisi API failure.");
            return res.status(200).json(MOCK_FALLBACK);
        }

    } catch (error) {
        console.error('Master Scraping API Error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch GSE live data.' });
    }
}
