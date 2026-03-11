import axios from 'axios';
import * as cheerio from 'cheerio';

async function testExtracting() {
  try {
    const { data } = await axios.get('https://afx.kwayisi.org/gse/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(data);
    
    // Find the table that has 'Ticker' or 'Price' in its th
    let targetTable = null;
    $('table').each((i, table) => {
      const headerText = $(table).find('th').text();
      if (headerText.includes('Ticker') && headerText.includes('Price')) {
        targetTable = table;
        return false; // break
      }
    });

    if (!targetTable) {
      console.log('No matching table found!');
      return;
    }

    const stocks = [];
    $(targetTable).find('tbody tr').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 4) {
        const symbol = $(cols[0]).text().trim();
        const strPrice = $(cols[1]).text().trim();
        const strChange = $(cols[2]).text().trim();
        const strVolume = $(cols[3]).text().trim();
        
        // Sometimes the columns might be shifted, let's see what we get
        console.log(`Row ${i}: Symbol=${symbol}, Price=${strPrice}, Change=${strChange}, Vol=${strVolume}`);
      }
    });

  } catch (e) {
    console.log('Error:', e.message);
  }
}

testExtracting();
