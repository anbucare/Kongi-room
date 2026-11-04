// Renders the PNG app icons from icons/icon.svg with headless Chromium.
// Usage: node render-icons.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DIR = path.join(__dirname, 'icons');
const svg = fs.readFileSync(path.join(DIR, 'icon.svg'), 'utf8');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  const render = async (file, size, pad, bg) => {
    await page.setViewportSize({ width: size, height: size });
    const inner = Math.round(size * (1 - pad * 2));
    await page.setContent(`<html><body style="margin:0;width:${size}px;height:${size}px;background:${bg};display:grid;place-items:center">
      <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`);
    await page.screenshot({ path: path.join(DIR, file), omitBackground: bg === 'transparent' });
    console.log('icon', file);
  };
  await render('icon-512.png', 512, 0, 'transparent');
  await render('icon-192.png', 192, 0, 'transparent');
  await render('apple-touch-icon.png', 180, 0, '#ece3d4');
  // Maskable: artwork inside the safe zone, solid background out to the edges.
  await render('icon-maskable-512.png', 512, 0.12, '#ece3d4');
  await browser.close();
})();
