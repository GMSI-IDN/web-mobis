import { chromium } from 'playwright';

const exe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Scroll down so about and unit sections are in view
  const about = await page.$('.about-section');
  if (about) {
    await about.scrollIntoViewIfNeeded();
  }

  await page.screenshot({ path: 'seam_zoomed.png' });
  await browser.close();
}

run();
