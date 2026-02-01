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

async function captureDeep(browser, pageData) {
    const harPath = path.join(__dirname, `deep_${pageData.name}.har`);
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1440, height: 900 },
        recordHar: {
            path: harPath,
            mode: 'full', // Ensure content is properly captured
            content: 'embed'
        }
    });
    const page = await context.newPage();

    console.log(`\n--- Deep Capturing ${pageData.name} ---`);

    try {
        await page.goto(pageData.url, { waitUntil: 'domcontentloaded', timeout: 90000 });

        // Slow manual scroll simulation
        console.log('Starting slow scroll...');
        const totalHeight = await page.evaluate(() => document.body.scrollHeight);
        let currentHeight = 0;

        while (currentHeight < totalHeight) {
            // Scroll a small amount
            await page.mouse.wheel(0, 50);
            currentHeight += 50;

            // Occasionally wait longer to let network catch up
            if (currentHeight % 1000 < 50) {
                await page.waitForTimeout(200);
            } else {
                await page.waitForTimeout(50); // Fast but steady
            }

            // Check new height in case of infinite scroll or expanding content
            const newTotalHeight = await page.evaluate(() => document.body.scrollHeight);
            if (newTotalHeight > totalHeight) {
                // totalHeight = newTotalHeight; // Optionally update total height
            }
        }

        console.log('Reached bottom. Waiting for any final network activity...');
        await page.waitForTimeout(5000);

    } catch (e) {
        console.error(`Error capturing ${pageData.name}: ${e.message}`);
    } finally {
        await context.close();
        if (fs.existsSync(harPath)) {
            console.log(`Saved Deep HAR: ${harPath} (Size: ${fs.statSync(harPath).size} bytes)`);
        } else {
            console.error(`ERROR: HAR file not found at ${harPath}`);
        }
    }
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    for (const pageData of PAGES) {
        await captureDeep(browser, pageData);
    }
    await browser.close();
    console.log('\nAll deep pages captured.');
})();
