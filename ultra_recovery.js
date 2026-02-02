const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://www.apple.com';
const CLONE_DIR = '/Users/Mukira/apple-lipagas/apple-clone';
const INDEX_PATH = path.join(CLONE_DIR, 'iphone/index.html');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.apple.com/iphone/',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
};

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) return true;
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function download(url, dest) {
    if (fs.existsSync(dest)) return Promise.resolve(false);
    ensureDirectoryExistence(dest);
    return new Promise((resolve) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { headers: HEADERS }, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded: ${url}`);
                    resolve(true);
                });
            } else {
                file.close();
                fs.unlink(dest, () => { });
                resolve(false);
            }
        }).on('error', () => {
            file.close();
            fs.unlink(dest, () => { });
            resolve(false);
        });
    });
}

const html = fs.readFileSync(INDEX_PATH, 'utf8');
const urls = new Set();
// Improved regex to find anything that looks like an image path
const pathRegex = /["'](\/v\/[^"']+\.(?:jpg|png|svg|webp|gif))["']|["'](\.\.\/v\/[^"']+\.(?:jpg|png|svg|webp|gif))["']/g;

let match;
while ((match = pathRegex.exec(html)) !== null) {
    let p = match[1] || match[2];
    if (p.startsWith('..')) p = p.substring(2); // resolve ../ to root relative
    urls.add(p);
}

// Generate variants for each found URL
const finalUrls = new Set(urls);
const variants = ['_large', '_medium', '_small', '_large_2x', '_medium_2x', '_small_2x', '_large.2x', '_medium.2x', '_small.2x', '@2x', '@3x'];

urls.forEach(u => {
    const ext = path.extname(u);
    const base = u.substring(0, u.length - ext.length);

    // Also try to strip existing size tags if they exist and replace them
    const baseClean = base.replace(/_(small|medium|large)(_2x)?$/, '');

    variants.forEach(v => {
        finalUrls.add(baseClean + v + ext);
        finalUrls.add(base + v + ext); // sometimes it's additive
    });
});

console.log(`Found ${urls.size} distinct image paths. Expanded to ${finalUrls.size} potential variant URLs. Starting download...`);

async function run() {
    const urlArray = Array.from(finalUrls);
    const chunkSize = 15; // Higher concurrency
    for (let i = 0; i < urlArray.length; i += chunkSize) {
        const chunk = urlArray.slice(i, i + chunkSize);
        await Promise.all(chunk.map(u => {
            const fullUrl = BASE_URL + (u.startsWith('/') ? u : '/' + u);
            const destPath = path.join(CLONE_DIR, u);
            return download(fullUrl, destPath);
        }));
    }
    console.log('Ultra Recovery complete.');
}

run();
