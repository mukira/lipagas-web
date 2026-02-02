const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://www.apple.com';
const CLONE_DIR = '/Users/Mukira/apple-lipagas/apple-clone';
const CSS_PATH = path.join(CLONE_DIR, 'wss/fonts5144.css');
const FONTS_DIR = path.join(CLONE_DIR, 'wss');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.apple.com/iphone/',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
};

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function download(url, dest) {
    if (fs.existsSync(dest)) {
        // console.log(`Skipping (exists): ${url}`);
        return Promise.resolve();
    }

    ensureDirectoryExistence(dest);
    return new Promise((resolve) => {
        const file = fs.createWriteStream(dest);
        const options = {
            headers: HEADERS
        };

        https.get(url, options, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded: ${url}`);
                    resolve();
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirect
                file.close();
                fs.unlink(dest, () => { });
                download(response.headers.location, dest).then(resolve);
            } else {
                file.close();
                fs.unlink(dest, () => { });
                console.error(`Failed to download ${url}: ${response.statusCode}`);
                resolve();
            }
        }).on('error', (err) => {
            file.close();
            fs.unlink(dest, () => { });
            console.error(`Error downloading ${url}: ${err.message}`);
            resolve();
        });
    });
}

let cssContent = fs.readFileSync(CSS_PATH, 'utf8');
const urlRegex = /url\(["']?(https:\/\/www\.apple\.com\/wss\/fonts\/[^"'\)]+)["']?\)/g;
const urls = new Set();
let match;

while ((match = urlRegex.exec(cssContent)) !== null) {
    urls.add(match[1]);
}

console.log(`Found ${urls.size} unique font URLs. Starting download...`);

async function run() {
    const urlArray = Array.from(urls);
    // Download in chunks to be nice
    const chunkSize = 5;
    for (let i = 0; i < urlArray.length; i += chunkSize) {
        const chunk = urlArray.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (url) => {
            const parsedUrl = new URL(url);
            const localRelativePath = parsedUrl.pathname.replace('/wss/', '');
            const destPath = path.join(FONTS_DIR, localRelativePath);
            await download(url, destPath);

            const relativeInCss = './' + localRelativePath;
            const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            cssContent = cssContent.replace(new RegExp(escapedUrl, 'g'), relativeInCss);
        }));
    }

    fs.writeFileSync(CSS_PATH, cssContent);
    console.log('Fonts downloaded and CSS updated.');
}

run();
