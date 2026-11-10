const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const html = await get('https://www.youtube.com/watch?v=N-h5NXvGW8M');
  
  // Search for description / runs text
  const runs = [...html.matchAll(/"text":"([^"]+)"/g)].map(m => m[1]);
  console.log('Sample text runs:', runs.slice(0, 40));
}

run();

