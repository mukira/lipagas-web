const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const HAR_PATH = path.join(__dirname, 'site.har');

(async () => {
    console.log('Starting Hybrid HAR capture (Desktop + Mobile)...');

    if (fs.existsSync(HAR_PATH)) {
        fs.unlinkSync(HAR_PATH);
        console.log('Removed old HAR file.');
    }

    const browser = await chromium.launch({ headless: true });

    // We'll use one context but change viewports if possible, 
    // or use two contexts and merge? Merging is hard.
    // Playwright's recordHar is per-context.
    // Let's use ONE context and use setViewportSize.

    const context = await browser.newContext({
        recordHar: {
            path: HAR_PATH,
            content: 'embed',
            mode: 'full'
        },
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    const scrollDown = async (label) => {
        console.log(`Scrolling down [${label}]...`);
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                let distance = 150;
                let timer = setInterval(() => {
                    let scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
    };

    console.log('Navigating (Desktop)...');
    await page.goto('https://www.apple.com/iphone/', { waitUntil: 'networkidle', timeout: 90000 });
    await scrollDown('Desktop');
    await page.waitForTimeout(5000);

    console.log('Switching to Mobile Viewport...');
    await page.setViewportSize({ width: 390, height: 844 });
    // Apple's site might need a reload or some time to react to resize
    await page.reload({ waitUntil: 'networkidle' });
    await scrollDown('Mobile');

    console.log('Final wait for assets...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(10000);

    console.log('Closing context...');
    await context.close();
    await browser.close();

    if (fs.existsSync(HAR_PATH)) {
        console.log(`SUCCESS! Hybrid HAR file size: ${fs.statSync(HAR_PATH).size} bytes`);
    } else {
        console.error('FAILURE: Failed to create hybrid HAR file.');
        process.exit(1);
    }
})();
