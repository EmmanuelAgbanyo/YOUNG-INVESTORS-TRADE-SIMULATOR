import axios from 'axios';
import * as cheerio from 'cheerio';

async function checkClasses() {
  try {
    const { data } = await axios.get('https://afx.kwayisi.org/gse/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(data);
    
    $('table').each((i, table) => {
      console.log(`Table ${i} class:`, $(table).attr('class'));
    });

    // Check the first row of each table to identify the right one
    $('table').each((i, table) => {
      console.log(`Table ${i} first row:`, $(table).find('tr').first().text());
    });
    
    // Print first data row of table 0
    console.log(`Table 0 first data row:`, $('table').eq(0).find('tbody tr').eq(1).text());
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkClasses();
