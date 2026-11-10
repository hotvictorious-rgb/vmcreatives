const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const html = await get('https://shop.victoriousmarket.com.ng');
  const cssMatches = [...html.matchAll(/(?:\.brand-victorious|\.brand-market|\.vm-brand-tagline)[\s\S]*?}/g)].map(m => m[0]);
  console.log('--- BRAND CSS ---');
  console.log(cssMatches.join('\n\n'));
}

run();

