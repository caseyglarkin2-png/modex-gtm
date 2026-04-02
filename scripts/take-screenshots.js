const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'showcase-proof');

const PAGES = [
  { name: 'gallery', url: '/for' },
  { name: 'dannon-base', url: '/for/dannon' },
  { name: 'dannon-heiko', url: '/for/dannon/heiko-gerling' },
  { name: 'home-depot-base', url: '/for/the-home-depot' },
  { name: 'home-depot-john-deaton', url: '/for/the-home-depot/john-deaton' },
  { name: 'hormel-base', url: '/for/hormel-foods' },
  { name: 'hormel-will', url: '/for/hormel-foods/will-bonifant' },
  { name: 'smucker-base', url: '/for/jm-smucker' },
  { name: 'smucker-rob', url: '/for/jm-smucker/rob-ferguson' },
  { name: 'deere-base', url: '/for/john-deere' },
  { name: 'deere-cory', url: '/for/john-deere/cory-reed' },
  { name: 'diageo-base', url: '/for/diageo' },
  { name: 'diageo-marsha', url: '/for/diageo/marsha-mcintosh-hamilton' },
];

(async () => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  for (const page of PAGES) {
    const p = await context.newPage();
    try {
      await p.goto(`http://localhost:3000${page.url}`, { waitUntil: 'networkidle', timeout: 15000 });
      await p.waitForTimeout(500);
      const filePath = path.join(SCREENSHOT_DIR, `${page.name}.png`);
      await p.screenshot({ path: filePath, fullPage: true });
      console.log(`OK: ${page.name} -> ${filePath}`);
    } catch (e) {
      console.log(`FAIL: ${page.name} -> ${e.message.substring(0, 80)}`);
    }
    await p.close();
  }
  await browser.close();
  console.log('Done.');
})();
