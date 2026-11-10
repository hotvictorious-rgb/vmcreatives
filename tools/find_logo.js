const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
  
  // Look for logo images, svgs, or brand classes
  const imgTags = [...html.matchAll(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi)].map(m => m[0]);
  console.log('--- FOUND IMAGES WITH LOGO / BRAND ---');
  imgTags.filter(tag => /logo|brand|header/i.test(tag)).forEach(tag => console.log(tag));

  console.log('\n--- ALL IMAGES SAMPLE ---');
  imgTags.slice(0, 15).forEach(tag => console.log(tag));

  // Look for favicon or meta icons
  const favicons = [...html.matchAll(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']*)["']/gi)].map(m => m[1]);
  console.log('\n--- FAVICONS ---');
  console.log(favicons);
}

run();

