const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const harPath = path.join(__dirname, 'test.har');
    console.log('Testing HAR at:', harPath);
    const browser = await chromium.launch();
    const context = await browser.newContext({ recordHar: { path: harPath } });
    const page = await context.newPage();
    await page.goto('https://example.com');
    await browser.close();

    if (fs.existsSync(harPath)) {
        console.log('TEST SUCCESS: test.har created');
    } else {
        console.log('TEST FAILURE: test.har NOT created');
    }
})();
