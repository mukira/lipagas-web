/**
 * Static HTML Clone Script
 * Downloads Lipagas pages as static HTML files to public folder
 * Uses simple Next.js pages that embed via iframe
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = 'https://www.apple.com';
const OUTPUT_DIR = path.join(__dirname, 'public');
const PAGES_DIR = path.join(__dirname, 'src', 'app');

const PAGES = [
    { name: 'index', url: '/', path: '' },
    { name: 'iphone', url: '/iphone/' },
];

const downloadedAssets = new Set();

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

async function downloadFile(url, destPath) {
    if (downloadedAssets.has(url)) return true;
    if (!url || url.endsWith('/') || !destPath || destPath.endsWith('/')) return false;
    const ext = path.extname(destPath);
    if (!ext || ext === '.') return false;

    return new Promise((resolve) => {
        try {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol === 'https:' ? https : http;
            ensureDir(path.dirname(destPath));
            const file = fs.createWriteStream(destPath);
            protocol.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) LipagasWebKit/537.36' }
            }, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    file.close();
                    downloadFile(response.headers.location, destPath).then(resolve);
                    return;
                }
                if (response.statusCode !== 200) { file.close(); resolve(false); return; }
                response.pipe(file);
                file.on('finish', () => { file.close(); downloadedAssets.add(url); resolve(true); });
                file.on('error', () => { file.close(); resolve(false); });
            }).on('error', () => { file.close(); resolve(false); });
        } catch (e) { resolve(false); }
    });
}

async function downloadAssets(page) {
    const assets = await page.evaluate(() => {
        const imageSrcs = new Set();
        document.querySelectorAll('img').forEach(img => {
            if (img.src && !img.src.startsWith('data:')) imageSrcs.add(img.src);
            if (img.srcset) {
                img.srcset.split(',').forEach(s => {
                    const url = s.trim().split(' ')[0];
                    if (url && !url.startsWith('data:')) imageSrcs.add(url);
                });
            }
        });
        document.querySelectorAll('source').forEach(source => {
            if (source.srcset) {
                source.srcset.split(',').forEach(s => {
                    const url = s.trim().split(' ')[0];
                    if (url && !url.startsWith('data:')) imageSrcs.add(url);
                });
            }
        });

        const cssUrls = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(link => link.href).filter(Boolean);

        return { images: Array.from(imageSrcs), css: cssUrls };
    });

    console.log(`    Found ${assets.images.length} images, ${assets.css.length} CSS`);

    for (const src of assets.images) {
        try {
            const url = src.startsWith('http') ? src : new URL(src, BASE_URL).href;
            const urlObj = new URL(url);
            const localPath = path.join(OUTPUT_DIR, urlObj.pathname);
            await downloadFile(url, localPath);
        } catch (e) { }
    }

    for (const src of assets.css) {
        try {
            const url = src.startsWith('http') ? src : new URL(src, BASE_URL).href;
            const urlObj = new URL(url);
            const localPath = path.join(OUTPUT_DIR, urlObj.pathname);
            if (await downloadFile(url, localPath)) {
                // Read CSS and look for fonts
                let cssContent = fs.readFileSync(localPath, 'utf8');
                const fontMatches = cssContent.match(/url\(['"]?([^'")]+\.(woff2?|ttf|otf|eot))['"]?\)/g);
                if (fontMatches) {
                    for (const match of fontMatches) {
                        const fontUrlMatch = match.match(/url\(['"]?([^'")]+\.(woff2?|ttf|otf|eot))['"]?\)/);
                        if (fontUrlMatch && fontUrlMatch[1]) {
                            let fontUrl = fontUrlMatch[1];
                            if (fontUrl.startsWith('path(')) {
                                // Some Lipagas CSS uses path("...", "...")
                                fontUrl = fontUrl.split('"')[1];
                            }
                            const absoluteFontUrl = fontUrl.startsWith('http') ? fontUrl : new URL(fontUrl, url).href;
                            const fontUrlObj = new URL(absoluteFontUrl);
                            const fontLocalPath = path.join(OUTPUT_DIR, fontUrlObj.pathname);
                            await downloadFile(absoluteFontUrl, fontLocalPath);
                        }
                    }
                }
            }
        } catch (e) { }
    }
}

function processHtml(html) {
    // 1. Convert Lipagas URLs to local
    html = html.replace(/https?:\/\/www\.lipagas\.com(?=\/)/g, '');
    html = html.replace(/https?:\/\/lipagas\.com(?=\/)/g, '');

    // 2. Remove analytics/external trackers
    html = html.replace(/<script[^>]*gtm[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<script[^>]*analytics[^>]*>[\s\S]*?<\/script>/gi, '');

    // 3. Inject navigation bridge script
    const injectedContent = `
<script>
document.addEventListener("click", function(e) {
    const link = e.target.closest("a");
    if (link && link.href) {
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
            e.preventDefault();
            window.top.location.href = link.href;
        }
    }
}, true);
</script>`;
    html = html.replace('</body>', injectedContent + '</body>');

    return html;
}

async function clonePage(browser, pageConfig) {
    console.log(`\n🔄 Cloning ${pageConfig.name}...`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) LipagasWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const url = BASE_URL + pageConfig.url;
    console.log(`  📄 Loading ${url}`);

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    } catch (e) {
        console.log(`  ⚠️ Navigation timeout, continuing...`);
    }

    // Scroll to load lazy content
    console.log('  📜 Scrolling to load all content...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 500;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    window.scrollTo(0, 0);
                    resolve();
                }
            }, 100);
        });
    });

    await new Promise(r => setTimeout(r, 2000));

    console.log('  📥 Downloading assets...');
    await downloadAssets(page);

    console.log('  📝 Extracting HTML...');
    const rawHtml = await page.content();
    const html = processHtml(rawHtml);

    // Save as static HTML file
    const htmlDir = path.join(OUTPUT_DIR, 'pages');
    ensureDir(htmlDir);
    const htmlPath = path.join(htmlDir, `${pageConfig.name}.html`);
    fs.writeFileSync(htmlPath, html);
    console.log(`  ✅ Saved HTML: ${htmlPath}`);

    // Create simple Next.js page that uses iframe
    const routeName = pageConfig.name === 'index' ? '' : pageConfig.name;
    const pageDir = path.join(PAGES_DIR, routeName);
    ensureDir(pageDir);

    const componentName = pageConfig.name.charAt(0).toUpperCase() + pageConfig.name.slice(1).replace(/-/g, '');
    const pageComponent = `export default function ${componentName}Page() {
  return (
    <iframe
      src="/pages/${pageConfig.name}.html"
      style={{
        width: '100vw',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
      title="${pageConfig.name}"
    />
  );
}
`;

    fs.writeFileSync(path.join(pageDir, 'page.tsx'), pageComponent);
    console.log(`  ✅ Created page component`);

    await page.close();
}

async function main() {
    console.log('🚀 Starting Static HTML Clone (Original Fidelity)...\n');

    try {
        ensureDir(OUTPUT_DIR);
        ensureDir(PAGES_DIR);

        console.log('🌐 Launching browser...');
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        for (const pageConfig of PAGES) {
            console.log(`[MAIN] Starting clone for ${pageConfig.name}`);
            await clonePage(browser, pageConfig);
            console.log(`[MAIN] Finished clone for ${pageConfig.name}`);
        }

        // Special step for WSS Fonts which are often dynamic
        console.log('\n📥 Attempting to download SF Pro Icons specifically...');
        const fontUrls = [
            'https://www.apple.com/wss/fonts?families=SF+Pro,v3|SF+Pro+Icons,v3',
            'https://www.apple.com/wss/fonts/SF-Pro-Icons/v3/sf-pro-icons_regular.woff2',
            'https://www.apple.com/wss/fonts/SF-Pro-Icons/v3/sf-pro-icons_regular.woff',
            'https://www.apple.com/wss/fonts/SF-Pro-Icons/v3/sf-pro-icons_regular.ttf',
        ];
        for (const url of fontUrls) {
            const urlObj = new URL(url.includes('?') ? url.split('?')[0] : url);
            let pathname = urlObj.pathname;
            const localPath = path.join(OUTPUT_DIR, pathname);
            await downloadFile(url, localPath);
        }

        await browser.close();
        console.log('\n✨ Clone complete!');
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    }
}

main().catch(console.error);
