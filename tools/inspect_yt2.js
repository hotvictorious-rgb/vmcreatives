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
  // Extract all text content or video details
  const title = html.match(/<title>([^<]*)<\/title>/);
  console.log('PAGE TITLE:', title ? title[1] : 'none');
  
  // Find comments or description in ytInitialData
  const dataMatch = html.match(/ytInitialData\s*=\s*({.+?});(?:var|\s*<\/script>)/s);
  if (dataMatch) {
    const jsonStr = dataMatch[1];
    // Search for keywords like "telegram", "link", "download", "crack", "mediafire", "mega", "drive.google"
    const links = [...jsonStr.matchAll(/https?:\/\/[^\s"'\\]+/g)].map(m => m[0]);
    console.log('Found Links in page:', [...new Set(links)].filter(l => !l.includes('google.com') && !l.includes('youtube.com') && !l.includes('ytimg.com') && !l.includes('schema.org')).slice(0, 10));
  }
}

run();

