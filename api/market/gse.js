export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const MOCK_FALLBACK = [
    { symbol: "MTNGH", price: 1.60 }, { symbol: "SCB", price: 18.23 }, { symbol: "GCB", price: 3.40 },
    { symbol: "EGL", price: 2.39 }, { symbol: "GOIL", price: 1.50 }, { symbol: "TOTAL", price: 9.00 }
  ];

  try {
    let stocks = [];

    // METHOD 1: Primary Source - Scrape AFX Kwayisi (Most Reliable)
    try {
      // Use native fetch to avoid Vercel dependency build issues
      const cheerio = await import('cheerio');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      
      const resData = await fetch('https://afx.kwayisi.org/gse/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await resData.text();

      const $ = cheerio.load(data);
      let targetTable = null;
      
      $('table').each((i, table) => {
        const headerText = $(table).find('th').text();
        if (headerText.includes('Ticker') && headerText.includes('Price')) {
          targetTable = table;
          return false; // break
        }
      });

      if (targetTable) {
        $(targetTable).find('tbody tr').each((i, row) => {
          const cols = $(row).find('td');
          if (cols.length >= 4) {
            const symbol = $(cols[0]).text().trim();
            const strPrice = $(cols[1]).text().trim();
            const strChange = $(cols[2]).text().trim();
            const strVolume = $(cols[3]).text().trim().replace(/,/g, '');

            if (symbol && strPrice) {
              stocks.push({
                symbol,
                price: parseFloat(strPrice) || 0,
                change: parseFloat(strChange) || 0,
                volume: parseInt(strVolume) || 0
              });
            }
          }
        });
      }

      stocks = stocks.filter(s => s.price > 0);
      if (stocks.length > 0) {
        console.log('[GSE API] Method 1 Success (Scraped afx.kwayisi)');
        return res.status(200).json(stocks);
      }
    } catch (scrapeError) {
      console.warn('Method 1 (afx.kwayisi scrape) Failed:', scrapeError.message);
    }

    // METHOD 2: Secondary Source - dev.kwayisi REST API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

      const gseResponse = await fetch('https://dev.kwayisi.org/apis/gse/live', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (gseResponse.ok) {
        const data = await gseResponse.json();
        if (Array.isArray(data) && data.length > 0) {
          stocks = data.map(item => ({
            symbol: item.name,
            price: parseFloat(item.price) || 0,
            change: parseFloat(item.change) || 0,
            volume: parseInt(item.volume) || 0
          })).filter(s => s.symbol && s.price > 0);
          console.log('[GSE API] Method 2 Success (dev.kwayisi API)');
          return res.status(200).json(stocks);
        }
      }
    } catch (apiError) {
      console.warn('Method 2 (dev.kwayisi.org) Failed:', apiError.message);
    }

    // METHOD 3: Fallback - Official GSE API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const officialResponse = await fetch('https://devco.gse.com.gh/api/v1/market/summary', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (officialResponse.ok) {
        const rawData = await officialResponse.json();
        const dataArray = rawData.data || rawData.items || rawData;

        if (Array.isArray(dataArray) && dataArray.length > 0) {
          stocks = dataArray.map(item => ({
            symbol: item.symbol || item.name,
            price: parseFloat(item.price || item.currentPrice) || 0,
            change: parseFloat(item.change || item.priceChange) || 0,
            volume: parseInt(item.volume) || 0
          })).filter(s => s.symbol && s.price > 0);

          if (stocks.length > 0) {
            console.log('[GSE API] Method 3 Success (Official GSE API)');
            return res.status(200).json(stocks);
          }
        }
      }
    } catch (officialError) {
      console.warn('Method 3 (Official GSE API) Failed:', officialError.message);
    }

    console.warn("Returning MOCK fallback data due to all APIs failing.");
    return res.status(200).json(MOCK_FALLBACK);

  } catch (error) {
    console.error('Master API Error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch GSE live data.' });
  }
}
