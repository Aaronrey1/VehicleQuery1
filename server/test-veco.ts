import { chromium } from 'playwright';

async function testVeco() {
  const browser = await chromium.launch({
    headless: false, // Set to false to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to VECO...');
    await page.goto('https://veco.danlawinc.com', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('Taking screenshot of login page...');
    await page.screenshot({ path: '/tmp/veco-login.png' });

    // Log all input elements
    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} input elements`);

    for (let i = 0; i < inputs.length; i++) {
      const name = await inputs[i].getAttribute('name');
      const type = await inputs[i].getAttribute('type');
      const id = await inputs[i].getAttribute('id');
      const placeholder = await inputs[i].getAttribute('placeholder');
      console.log(`Input ${i}: name="${name}", type="${type}", id="${id}", placeholder="${placeholder}"`);
    }

    // Try to login
    console.log('Attempting login...');
    await page.fill('input[type="text"]', process.env.VECO_USERNAME || 'aidanr');
    await page.fill('input[type="password"]', process.env.VECO_PASSWORD || 'customercare');

    console.log('Taking screenshot before login...');
    await page.screenshot({ path: '/tmp/veco-before-login.png' });

    await page.click('button:has-text("Log in")');

    // Wait for navigation
    await page.waitForTimeout(3000);

    console.log('Current URL after login:', page.url());
    await page.screenshot({ path: '/tmp/veco-after-login.png' });

    // Try to find the vehicle search page
    console.log('Looking for navigation elements...');
    const links = await page.$$('a');
    for (let i = 0; i < Math.min(links.length, 20); i++) {
      const href = await links[i].getAttribute('href');
      const text = await links[i].textContent();
      console.log(`Link ${i}: "${text}" -> ${href}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testVeco().catch(console.error);
