const https = require('https');

https.get('https://afx.kwayisi.org/gse/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const tableRegex = /<tbody>([\s\S]*?)<\/tbody>/;
    const match = data.match(tableRegex);
    if (match) {
      const rows = match[1].split('<tr>');
      const stocks = [];
      rows.forEach(row => {
        if (!row.includes('<td>')) return;
        const cols = row.split('<td>').map(c => c.replace(/<\/td>|<tr>|<\/tr>|\n|\r/g, '').replace(/<[^>]+>/g, '').trim());
        if (cols.length >= 4) {
          stocks.push({
            symbol: cols[1],
            price: parseFloat(cols[3])
          });
        }
      });
      console.log(JSON.stringify(stocks, null, 2));
    } else {
      console.log('Table not found');
    }
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
