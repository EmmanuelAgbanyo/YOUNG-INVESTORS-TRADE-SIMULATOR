const https = require('https');

https.get('https://afx.kwayisi.org/gse/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('AFX Kwayisi length:', data.length));
});

https.get('https://gse.com.gh/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('GSE length:', data.length));
});
