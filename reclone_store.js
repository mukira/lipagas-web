const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE_URL = 'https://www.apple.com';
const OUTPUT_DIR = './public';

async function downloadFile(url, localPath) {
    return new Promise((resolve) => {
        try {
            fs.mkdirSync(path.dirname(localPath), { recursive: true });
            const protocol = url.startsWith('https') ? https : http;
            const file = fs.createWriteStream(localPath);
            protocol.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Referer': 'https://www.apple.com/'
                }
            }, (res) => {
                if (res.statusCode === 200) {
                    res.pipe(file);
                    file.on('finish', () => { file.close(); resolve(true); });
                } else {
                    file.close();
                    resolve(false);
                }
            }).on('error', () => resolve(false));
        } catch (e) { resolve(false); }
    });
}

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    console.log('Navigating to Apple Store...');
    await page.goto('https://www.apple.com/store', { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    // Scroll to load all lazy content
    console.log('Scrolling to load lazy content...');
    for (let i = 0; i < 15; i++) {
        await page.evaluate(() => window.scrollBy(0, 500));
        await new Promise(r => setTimeout(r, 300));
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 1000));

    // Get all assets
    console.log('Collecting assets...');
    const assets = await page.evaluate(() => {
        const images = new Set();
        document.querySelectorAll('img').forEach(img => {
            if (img.src && !img.src.startsWith('data:')) images.add(img.src);
            if (img.srcset) {
                img.srcset.split(',').forEach(s => {
                    const url = s.trim().split(' ')[0];
                    if (url && !url.startsWith('data:')) images.add(url);
                });
            }
        });
        document.querySelectorAll('source').forEach(source => {
            if (source.srcset) {
                source.srcset.split(',').forEach(s => {
                    const url = s.trim().split(' ')[0];
                    if (url && !url.startsWith('data:')) images.add(url);
                });
            }
        });
        // Background images from inline styles
        document.querySelectorAll('[style*="background"]').forEach(el => {
            const style = el.getAttribute('style');
            if (style) {
                const matches = style.match(/url\(['"]?([^'")\s]+)['"]?\)/g);
                if (matches) {
                    matches.forEach(m => {
                        const url = m.match(/url\(['"]?([^'")\s]+)['"]?\)/);
                        if (url && url[1] && !url[1].startsWith('data:')) images.add(url[1]);
                    });
                }
            }
        });
        const css = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
        return { images: Array.from(images), css };
    });

    console.log(`Found ${assets.images.length} images, ${assets.css.length} CSS files`);

    // Download images
    let downloaded = 0;
    for (const src of assets.images) {
        try {
            const url = src.startsWith('http') ? src : new URL(src, BASE_URL).href;
            if (!url.includes('apple.com')) continue;
            const urlObj = new URL(url);
            const localPath = path.join(OUTPUT_DIR, urlObj.pathname);
            if (await downloadFile(url, localPath)) downloaded++;
        } catch (e) { }
    }
    console.log(`Downloaded ${downloaded} images`);

    // Download CSS
    for (const src of assets.css) {
        try {
            const url = src.startsWith('http') ? src : new URL(src, BASE_URL).href;
            if (!url.includes('apple.com')) continue;
            const urlObj = new URL(url);
            const localPath = path.join(OUTPUT_DIR, urlObj.pathname);
            // Skip if it's a directory (like /wss/fonts)
            if (fs.existsSync(localPath) && fs.statSync(localPath).isDirectory()) continue;
            await downloadFile(url, localPath);
        } catch (e) { }
    }

    // Get HTML
    console.log('Processing HTML...');
    let html = await page.content();

    // Convert Apple URLs to local
    html = html.replace(/https?:\/\/www\.apple\.com(?=\/)/g, '');
    html = html.replace(/https?:\/\/apple\.com(?=\/)/g, '');

    // Replace dynamic font URL with local
    html = html.replace(/\/wss\/fonts\?families=[^"]+/g, '/wss/fonts.css');

    // Remove analytics
    html = html.replace(/<script[^>]*gtm[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<script[^>]*analytics[^>]*>[\s\S]*?<\/script>/gi, '');

    // Save HTML
    fs.mkdirSync(path.join(OUTPUT_DIR, 'pages'), { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'pages', 'store.html'), html, 'utf8');
    console.log('Saved store.html');

    await browser.close();
    console.log('Done! Re-cloned store page.');
})();
