const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const url = 'https://www.youtube.com/api/timedtext?v=N-h5NXvGW8M&ei=YvfyatjiMZ_Li9oP1saB4A4&caps=asr&opi=112496729&exp=xpe&xoaf=5&xowf=1&xospf=1&hl=en&ip=0.0.0.0&ipbits=0&expire=1794333138&sparams=ip,ipbits,expire,v,ei,caps,opi,exp,xoaf&signature=DE913824AC5674A1D704553B1D3DBD45C8F21924.C9ED04A4903342C9258D537C17BA34595D10405D&key=yt8&kind=asr&lang=ar';
  const xml = await get(url);
  console.log('XML snippet:', xml.slice(0, 1000));
}

run();

