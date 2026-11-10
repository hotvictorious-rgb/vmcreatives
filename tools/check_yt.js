const https = require('https');

const options = {
  hostname: 'www.youtube.com',
  path: '/watch?v=_bsmMfMyIeI',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const titleMatch = data.match(/<title>([^<]*)<\/title>/);
    const descMatch = data.match(/"shortDescription":"([^"]*)"/);
    console.log('Title:', titleMatch ? titleMatch[1] : 'No title');
    if (descMatch) {
      console.log('Description:', descMatch[1].replace(/\\n/g, '\n').slice(0, 1000));
    } else {
      console.log('No description found');
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();

