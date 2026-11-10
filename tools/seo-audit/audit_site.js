/**
 * Victorious Market Technical SEO Auditor & Health Checker (With Redirect Follower)
 * Zero-dependency: Built using native Node.js (https / http / fs)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

async function fetchUrl(targetUrl, maxRedirects = 5) {
  let currentUrl = targetUrl;
  let redirects = [];

  for (let i = 0; i < maxRedirects; i++) {
    const res = await fetchSingle(currentUrl);
    if (res.redirect && res.redirectLocation) {
      redirects.push({ from: currentUrl, to: res.redirectLocation, code: res.status });
      // Resolve relative redirect locations
      currentUrl = new URL(res.redirectLocation, currentUrl).href;
    } else {
      return { ...res, redirects, finalUrl: currentUrl };
    }
  }

  return { url: targetUrl, status: 'TOO_MANY_REDIRECTS', redirects, ok: false };
}

function fetchSingle(targetUrl) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(targetUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      
      const req = client.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            url: targetUrl,
            status: res.statusCode,
            headers: res.headers,
            body: body,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            redirect: res.statusCode >= 300 && res.statusCode < 400,
            redirectLocation: res.headers.location || null
          });
        });
      });

      req.on('error', (err) => {
        resolve({ url: targetUrl, status: 'ERROR', error: err.message, ok: false });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ url: targetUrl, status: 'TIMEOUT', error: 'Connection timed out', ok: false });
      });
    } catch (e) {
      resolve({ url: targetUrl, status: 'INVALID', error: e.message, ok: false });
    }
  });
}

async function runAudit() {
  console.log('\n============================================================');
  console.log('  VICTORIOUS MARKET — DEEP TECHNICAL SEO DIAGNOSTIC');
  console.log('============================================================\n');

  // Test non-www vs www
  console.log('🔍 [1/4] Checking Domain Canonical Routing (non-www vs www)...');
  const nonWww = await fetchUrl('https://victoriousmarket.com.ng');
  console.log(`Initial: https://victoriousmarket.com.ng`);
  if (nonWww.redirects.length > 0) {
    nonWww.redirects.forEach(r => console.log(`  └─ [${r.code} 301 Redirect] ➔ ${r.to}`));
    console.log(`Final Canonical Destination: ${nonWww.finalUrl} (Status: ${nonWww.status})\n`);
  } else {
    console.log(`  └─ Direct 200 OK (No redirect)\n`);
  }

  const activeHost = nonWww.finalUrl ? new URL(nonWww.finalUrl).origin : 'https://www.victoriousmarket.com.ng';

  // 2. Audit robots.txt
  console.log(`🔍 [2/4] Checking robots.txt at ${activeHost}/robots.txt...`);
  const robotsRes = await fetchUrl(`${activeHost}/robots.txt`);
  console.log(`Status: ${robotsRes.status}`);
  if (robotsRes.ok) {
    console.log('\n--- robots.txt content ---');
    console.log(robotsRes.body.trim());
    console.log('--------------------------\n');
  } else {
    console.log(`⚠️ robots.txt failed with status: ${robotsRes.status}`);
  }

  // 3. Audit sitemap.xml
  console.log(`🔍 [3/4] Checking sitemap.xml at ${activeHost}/sitemap.xml...`);
  const sitemapRes = await fetchUrl(`${activeHost}/sitemap.xml`);
  console.log(`Status: ${sitemapRes.status}`);
  if (sitemapRes.ok) {
    console.log('✅ sitemap.xml is live! Length:', sitemapRes.body.length, 'bytes');
    const sitemapCount = (sitemapRes.body.match(/<loc>/g) || []).length;
    console.log(`Found approximately ${sitemapCount} URLs in sitemap index.\n`);
  } else {
    console.log(`⚠️ sitemap.xml failed with status: ${sitemapRes.status}\n`);
  }

  // 4. Checking Page Metadata & Canonical
  console.log(`🔍 [4/4] Checking HTML Meta & Canonical Tag on ${activeHost}...`);
  const pageRes = await fetchUrl(activeHost);
  if (pageRes.ok) {
    const canonical = pageRes.body.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    const robots = pageRes.body.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    const title = pageRes.body.match(/<title[^>]*>([^<]*)<\/title>/i);

    console.log(`Page Title:    ${title ? title[1].trim() : 'MISSING'}`);
    console.log(`Canonical Tag: ${canonical ? canonical[1] : '❌ MISSING (Huge SEO Red Flag)'}`);
    console.log(`Robots Meta:   ${robots ? robots[1] : 'index, follow (Default)'}`);
  }

  console.log('\n============================================================');
  console.log('  DIAGNOSIS COMPLETE');
  console.log('============================================================\n');
}

if (require.main === module) {
  runAudit();
}
