const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('afx.html');
const $ = cheerio.load(html);
$('table').each((i, t) => {
    if ($(t).text().includes('Ticker')) {
        const rows = [];
        $(t).find('tr').slice(1, 3).each((j, r) => {
            rows.push($(r).find('td').map((k, c) => $(c).text().trim()).get());
        });
        fs.writeFileSync('output.json', JSON.stringify({table: i, rows: rows}, null, 2));
    }
});
