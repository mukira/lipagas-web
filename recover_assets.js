const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://www.apple.com';
const CLONE_DIR = '/Users/Mukira/apple-lipagas/apple-clone';
const INDEX_PATH = path.join(CLONE_DIR, 'iphone/index.html');

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function download(url, dest) {
    if (fs.existsSync(dest)) return;

    ensureDirectoryExistence(dest);
    const file = fs.createWriteStream(dest);

    https.get(url, (response) => {
        if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${url}`);
            });
        } else {
            file.close();
            fs.unlink(dest, () => { }); // Delete the empty file
            console.error(`Failed to download ${url}: ${response.statusCode}`);
        }
    }).on('error', (err) => {
        file.close();
        fs.unlink(dest, () => { });
        console.error(`Error downloading ${url}: ${err.message}`);
    });
}

const html = fs.readFileSync(INDEX_PATH, 'utf8');

// Regex to find paths starting with / or ../
// We look for src, srcset, data-async-src, etc.
const patterns = [
    /src=["']([^"']+)["']/g,
    /srcset=["']([^"']+)["']/g,
    /data-async-src=["']([^"']+)["']/g,
    /href=["']([^"']+)["']/g,
    /url\(["']?([^"'\)]+)["']?\)/g
];

const urls = new Set();

patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
        const rawPath = match[1];
        // Split srcset entries (comma separated)
        const parts = rawPath.split(',');
        parts.forEach(part => {
            const cleanPath = part.trim().split(' ')[0];
            if (cleanPath.startsWith('/') && !cleanPath.startsWith('//')) {
                urls.add(cleanPath);
            } else if (cleanPath.startsWith('../')) {
                // Resolve ../ relative to /iphone/
                const resolved = path.join('/iphone/', cleanPath);
                urls.add(resolved);
            }
        });
    }
});

console.log(`Found ${urls.size} unique paths. Starting download...`);

urls.forEach(u => {
    const fullUrl = BASE_URL + u;
    const destPath = path.join(CLONE_DIR, u);
    download(fullUrl, destPath);
});
