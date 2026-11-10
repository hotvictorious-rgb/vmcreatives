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
  const jsonMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var|\s*<\/script>)/s) || 
                    html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
  
  if (jsonMatch) {
    try {
      const playerResponse = JSON.parse(jsonMatch[1]);
      const videoDetails = playerResponse.videoDetails || {};
      console.log('Title:', videoDetails.title);
      console.log('Author/Channel:', videoDetails.author);
      console.log('Length (seconds):', videoDetails.lengthSeconds);
      console.log('Keywords:', videoDetails.keywords ? videoDetails.keywords.join(', ') : 'None');
      console.log('Short description:', videoDetails.shortDescription);
      
      const captions = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (captions && captions.length > 0) {
        console.log('Caption URL:', captions[0].baseUrl);
        const subData = await get(captions[0].baseUrl);
        const lines = [...subData.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(m => m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
        console.log('Transcript lines:', lines.slice(0, 20).join(' '));
      } else {
        console.log('No captions available.');
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

run();

