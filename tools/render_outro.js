const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9222;
  const userDataDir = path.join(__dirname, 'edge_profile');

  const edge = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-web-security',
    '--allow-file-access-from-files',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  let wsUrl = '';
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const list = await getJson(`http://127.0.0.1:${port}/json/list`);
      if (list && list.length > 0) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('PAGE LOG:', data.params.args.map(a => a.value).join(' '));
    }
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  const fileUrl = 'file:///' + path.resolve(__dirname, '../outro_generator.html').replace(/\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await send('Page.navigate', { url: fileUrl });

  await sleep(3000);

  const evalResult = await send('Runtime.evaluate', {
    expression: `
      new Promise(async (resolve) => {
        try {
          const canvas = document.getElementById('outroCanvas');
          const stream = canvas.captureStream(30);
          let mimeType = 'video/webm;codecs=vp8';
          if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
          
          const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
          const chunks = [];
          recorder.ondataavailable = e => {
            console.log('Chunk received, size:', e.data ? e.data.size : 0);
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };
          
          recorder.onstop = async () => {
            console.log('Recorder stopped, total chunks:', chunks.length);
            const blob = new Blob(chunks, { type: mimeType });
            console.log('Blob size:', blob.size);
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result.split(',')[1]);
            };
            reader.readAsDataURL(blob);
          };

          recorder.start(200);
          console.log('Recorder started');
          let elapsed = 0;
          const dt = 1 / 30;
          const timer = setInterval(() => {
            elapsed += dt;
            drawFrame(elapsed);
            if (elapsed >= 6.0) {
              clearInterval(timer);
              setTimeout(() => recorder.stop(), 500);
            }
          }, 1000 / 30);
        } catch (err) {
          console.log('ERROR inside page:', err.message);
          resolve('');
        }
      })
    `,
    awaitPromise: true,
    returnByValue: true,
    timeout: 30000
  });

  const base64Data = evalResult.result.value;
  console.log('Received video data, length:', base64Data ? base64Data.length : 0);

  if (base64Data && base64Data.length > 1000) {
    const videoBuffer = Buffer.from(base64Data, 'base64');
    const outPathUserDownloads = 'C:\\Users\\USER\\Downloads\\victorious_market_outro.webm';
    const outPathWorkspace = path.resolve(__dirname, '../campaigns/uyo-people-una-don-suffer/clips/victorious_market_outro.webm');
    const outPathRoot = path.resolve(__dirname, '../victorious_market_outro.webm');

    fs.writeFileSync(outPathUserDownloads, videoBuffer);
    console.log('Saved to user Downloads:', outPathUserDownloads);

    fs.writeFileSync(outPathWorkspace, videoBuffer);
    console.log('Saved to workspace clips:', outPathWorkspace);

    fs.writeFileSync(outPathRoot, videoBuffer);
    console.log('Saved to workspace root:', outPathRoot);
  }

  ws.close();
  edge.kill();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
