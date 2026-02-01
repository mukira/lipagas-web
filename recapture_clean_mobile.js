const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// All iPhone pages to capture
const PAGES = [
    { name: 'iphone', url: 'https://www.apple.com/iphone/' },
    { name: 'iphone-17-pro', url: 'https://www.apple.com/iphone-17-pro/' },
    { name: 'iphone-air', url: 'https://www.apple.com/iphone-air/' },
    { name: 'iphone-17', url: 'https://www.apple.com/iphone-17/' },
    { name: 'iphone-16', url: 'https://www.apple.com/iphone-16/' },
    { name: 'iphone-16e', url: 'https://www.apple.com/iphone-16e/' },
    { name: 'iphone-compare', url: 'https://www.apple.com/iphone/compare/' },
    { name: 'iphone-switch', url: 'https://www.apple.com/iphone/switch/' }
];

async function captureClean(browser, pageData) {
    const harPath = path.join(__dirname, `clean_${pageData.name}.har`);

    // Use iPhone-like mobile viewport
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        recordHar: {
            path: harPath,
            mode: 'full',
            content: 'embed'
        }
    });

    const page = await context.newPage();

    console.log(`\n--- Capturing ${pageData.name} (Mobile) ---`);

    try {
        // Navigate and wait for full load
        await page.goto(pageData.url, {
            waitUntil: 'networkidle',
            timeout: 120000
        });

        // Slow scroll to trigger all lazy loading
        console.log('Scrolling page...');
        const totalHeight = await page.evaluate(() => document.body.scrollHeight);
        let currentScroll = 0;
        const scrollStep = 200;

        while (currentScroll < totalHeight) {
            await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
            currentScroll += scrollStep;
            await page.waitForTimeout(100);
        }

        // Scroll back to top
        await page.evaluate(() => window.scrollTo(0, 0));

        // Wait for any final network activity
        console.log('Waiting for network idle...');
        await page.waitForTimeout(5000);

    } catch (e) {
        console.error(`Error capturing ${pageData.name}: ${e.message}`);
    } finally {
        await context.close();

        if (fs.existsSync(harPath)) {
            const stats = fs.statSync(harPath);
            console.log(`Saved: ${harPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        } else {
            console.error(`Failed to save HAR for ${pageData.name}`);
        }
    }
}

(async () => {
    const browser = await chromium.launch({ headless: true });

    for (const pageData of PAGES) {
        await captureClean(browser, pageData);
    }

    await browser.close();
    console.log('\n=== All mobile captures complete ===');
})();
