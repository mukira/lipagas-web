const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PAGES = [
    { name: 'iphone-17-pro', url: 'https://www.apple.com/iphone-17-pro/' },
    { name: 'iphone-air', url: 'https://www.apple.com/iphone-air/' },
    { name: 'iphone-17', url: 'https://www.apple.com/iphone-17/' },
    { name: 'iphone-16', url: 'https://www.apple.com/iphone-16/' },
    { name: 'iphone-16e', url: 'https://www.apple.com/iphone-16e/' },
    { name: 'iphone-compare', url: 'https://www.apple.com/iphone/compare/' },
    { name: 'iphone-switch', url: 'https://www.apple.com/iphone/switch/' }
];

async function capturePage(browser, pageData) {
    const harPath = path.join(__dirname, `site_${pageData.name}.har`);
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        recordHar: { path: harPath }
    });
    const page = await context.newPage();

    console.log(`\n--- Capturing ${pageData.name} ---`);

    try {
        await page.goto(pageData.url, { waitUntil: 'networkidle', timeout: 90000 });

        // Scroll to trigger lazy loading
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                let distance = 200;
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

        await page.waitForTimeout(5000);
        console.log(`Finished scrolling ${pageData.name}`);
    } catch (e) {
        console.error(`Error capturing ${pageData.name}: ${e.message}`);
    } finally {
        await context.close();
        if (fs.existsSync(harPath)) {
            console.log(`Saved HAR: ${harPath} (Verified, Size: ${fs.statSync(harPath).size} bytes)`);
        } else {
            console.error(`ERROR: HAR file not found at ${harPath} despite context closure.`);
        }
    }
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    for (const pageData of PAGES) {
        await capturePage(browser, pageData);
    }
    await browser.close();
    console.log('\nAll pages captured.');
})();
