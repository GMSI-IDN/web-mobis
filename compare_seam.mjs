import { chromium } from 'playwright';

const exe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test(name, aboutCss, unitCss) {
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 700 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  await page.evaluate(({ a, u }) => {
    const about = document.querySelector('.about-section');
    const unit = document.querySelector('.unit-mobil-section');
    if (about) about.style.cssText += a;
    if (unit) unit.style.cssText += u;
    window.scrollTo(0, 1000);
  }, { a: aboutCss, u: unitCss });

  await page.waitForTimeout(300);
  await page.screenshot({ path: `seam_view_${name}.png` });
  await browser.close();
}

async function run() {
  // Original / Before:
  await test('before', 'background: linear-gradient(180deg, #ffffff 0%, #ffffff 50%, #eaf8e7 100%) !important;', 'background-color: #edfbe9 !important;');

  // Fixed with smooth easing reaching #edfbe9 at 85% and solid #edfbe9 at 100%:
  await test('fixed_ease', 
    'background: linear-gradient(180deg, #ffffff 0%, #ffffff 20%, #f6fdf5 55%, #edfbe9 80%, #edfbe9 100%) !important;', 
    'background-color: #edfbe9 !important;'
  );

  // Fixed with continuous gradient extending into unit-mobil-section:
  await test('fixed_extended',
    'background: linear-gradient(180deg, #ffffff 0%, #ffffff 25%, #f7fdf6 70%, #f0faee 100%) !important;',
    'background: linear-gradient(180deg, #f0faee 0%, #edfbe9 15%, #edfbe9 100%) !important;'
  );

  console.log('SEAM COMPARISON READY');
}

run();
