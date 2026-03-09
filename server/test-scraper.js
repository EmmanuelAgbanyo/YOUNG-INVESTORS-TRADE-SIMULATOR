import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
    console.log('Testing AFX...');
    try {
        const { data } = await axios.get('https://afx.kwayisi.org/gse/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        const $ = cheerio.load(data);
        let count = 0;
        $('table.t tbody tr').each((i, row) => count++);
        console.log('AFX tables length:', count);

        // print first table text to see what it is
        console.log('AFX Sample text:', $('table.t tbody tr').first().text());

    } catch (e) {
        console.log('AFX Error:', e.message);
    }

    console.log('Testing GSE...');
    try {
        const { data } = await axios.get('https://devco.gse.com.gh/api/v1/market/summary', { timeout: 8000 });
        console.log('GSE Data Length:', data?.length);
    } catch (e) {
        console.log('GSE Error:', e.message);
    }
}
test();
