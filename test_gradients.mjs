import { chromium } from 'playwright';

const exe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test(name, aboutCss, unitCss) {
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  await page.evaluate(({ a, u }) => {
    const about = document.querySelector('.about-section');
    const unit = document.querySelector('.unit-mobil-section');
    if (about) {
      about.style.cssText += a;
    }
    if (unit) {
      unit.style.cssText += u;
    }
    if (about) {
      about.scrollIntoView({ block: 'center' });
    }
  }, { a: aboutCss, u: unitCss });

  await page.screenshot({ path: `gradient_${name}.png` });
  await browser.close();
}

async function run() {
  // Option 1: Exact color match #edfbe9 with natural easing (0% #fff, 30% #fff, 100% #edfbe9)
  await test('opt1', 'background: linear-gradient(180deg, #ffffff 0%, #ffffff 25%, #edfbe9 100%) !important;', 'background-color: #edfbe9 !important;');

  // Option 2: Extended gradient into unit-mobil-section so the transition is long and seamless
  // about: #fff -> #f6fdf5 (soft pale)
  // unit: #f6fdf5 -> #edfbe9 (seamless continuation)
  await test('opt2', 
    'background: linear-gradient(180deg, #ffffff 0%, #ffffff 30%, #f6fdf5 100%) !important;', 
    'background: linear-gradient(180deg, #f6fdf5 0%, #edfbe9 40%, #edfbe9 100%) !important;'
  );

  // Option 3: Smooth easing with multiple color stops (cubic-like curve from #fff to #edfbe9)
  await test('opt3',
    'background: linear-gradient(180deg, #ffffff 0%, #ffffff 30%, #fafef9 50%, #f3fcf1 75%, #edfbe9 100%) !important;',
    'background-color: #edfbe9 !important;'
  );

  // Option 4: Full smooth continuous background across about and unit
  // about: #fff at top, easing into #edfbe9 at 85% and solid #edfbe9 for the bottom 15% of about
  await test('opt4',
    'background: linear-gradient(180deg, #ffffff 0%, #ffffff 20%, #f5fcf3 60%, #edfbe9 90%, #edfbe9 100%) !important;',
    'background-color: #edfbe9 !important;'
  );

  console.log('ALL GRADIENT TESTS CAPTURED');
}

run();
