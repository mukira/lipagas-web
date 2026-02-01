const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureWithModals() {
    const harPath = path.join(__dirname, 'modals.har');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        recordHar: { path: harPath }
    });
    const page = await context.newPage();

    console.log('Navigating to https://www.apple.com/iphone/...');
    await page.goto('https://www.apple.com/iphone/', { waitUntil: 'networkidle', timeout: 90000 });

    console.log('Scrolling to reveal elements...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 400;
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

    // Find all modal open buttons
    const modalButtons = await page.$$('[data-modal-open]');
    console.log(`Found ${modalButtons.length} potential modal buttons.`);

    for (let i = 0; i < modalButtons.length; i++) {
        const btn = modalButtons[i];
        const modalId = await btn.getAttribute('data-modal-open');

        // Skip hidden buttons if any
        if (!await btn.isVisible()) {
            console.log(`Skipping hidden modal button: ${modalId}`);
            continue;
        }

        console.log(`Opening modal ${i + 1}/${modalButtons.length}: ${modalId}`);

        try {
            await btn.scrollIntoViewIfNeeded();
            await btn.click({ force: true });

            // Wait for modal content to load
            await page.waitForTimeout(4000);

            // Close the modal
            const closeBtn = await page.$('button[data-modal-close], .ric-modal-close-button, .modal-close');
            if (closeBtn && await closeBtn.isVisible()) {
                await closeBtn.click({ force: true });
            } else {
                await page.keyboard.press('Escape');
            }

            await page.waitForTimeout(1000);
        } catch (e) {
            console.error(`Error with modal ${modalId}: ${e.message}`);
            await page.keyboard.press('Escape');
        }
    }

    console.log('Finished interacting with modals. Closing context...');
    await context.close();
    await browser.close();

    if (fs.existsSync(harPath)) {
        console.log(`Saved HAR: ${harPath} (Size: ${fs.statSync(harPath).size} bytes)`);
    } else {
        console.error('FAILED to save HAR!');
    }
}

captureWithModals();
