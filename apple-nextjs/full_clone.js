/**
 * Full Apple Clone Script
 * Uses Puppeteer to render pages in a real browser, scroll to load all images,
 * extract the complete DOM, and download all assets.
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

// Pages to clone
const PAGES = [
    { name: 'mac', url: '/mac/' },
    { name: 'ipad', url: '/ipad/' },
    { name: 'iphone', url: '/iphone/' },
    { name: 'watch', url: '/watch/' },
    { name: 'airpods', url: '/airpods/' },
    { name: 'tv-home', url: '/tv-home/' },
];

// Track downloaded assets to avoid duplicates
const downloadedAssets = new Set();

// Create directory recursively
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Download a file
async function downloadFile(url, destPath) {
    if (downloadedAssets.has(url)) return true;

    // Skip invalid paths
    if (!url || url.endsWith('/') || !destPath || destPath.endsWith('/')) {
        return false;
    }

    // Skip if destPath doesn't have a file extension (likely a directory)
    const ext = path.extname(destPath);
    if (!ext || ext === '.') {
        return false;
    }

    return new Promise((resolve) => {
        try {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol === 'https:' ? https : http;

            ensureDir(path.dirname(destPath));

            const file = fs.createWriteStream(destPath);
            protocol.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            }, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    file.close();
                    downloadFile(response.headers.location, destPath).then(resolve);
                    return;
                }
                if (response.statusCode !== 200) {
                    file.close();
                    resolve(false);
                    return;
                }
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    downloadedAssets.add(url);
                    resolve(true);
                });
                file.on('error', () => {
                    file.close();
                    resolve(false);
                });
            }).on('error', () => {
                file.close();
                resolve(false);
            });
        } catch (e) {
            resolve(false);
        }
    });
}

// Extract and download all assets from a page
async function downloadAssets(page, pageUrl) {
    console.log('  📥 Downloading assets...');

    // Get all image sources
    const imageSrcs = await page.evaluate(() => {
        const srcs = new Set();

        // Get all img src
        document.querySelectorAll('img').forEach(img => {
            if (img.src && !img.src.startsWith('data:')) srcs.add(img.src);
            if (img.srcset) {
                img.srcset.split(',').forEach(s => {
                    const url = s.trim().split(' ')[0];
                    if (url && !url.startsWith('data:')) srcs.add(url);
                });
            }
        });

        // Get all source srcset
        document.querySelectorAll('source').forEach(source => {
            if (source.srcset) {
                source.srcset.split(',').forEach(s => {
                    const url = s.trim().split(' ')[0];
                    if (url && !url.startsWith('data:')) srcs.add(url);
                });
            }
        });

        // Get background images from computed styles (sample)
        document.querySelectorAll('[style*="background"]').forEach(el => {
            const style = el.getAttribute('style') || '';
            const matches = style.match(/url\(["']?([^"')]+)["']?\)/g);
            if (matches) {
                matches.forEach(m => {
                    const url = m.replace(/url\(["']?|["']?\)/g, '');
                    if (!url.startsWith('data:')) srcs.add(url);
                });
            }
        });

        return Array.from(srcs);
    });

    // Get all CSS files
    const cssUrls = await page.evaluate(() => {
        const urls = [];
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            if (link.href) urls.push(link.href);
        });
        return urls;
    });

    // Get all JS files  
    const jsUrls = await page.evaluate(() => {
        const urls = [];
        document.querySelectorAll('script[src]').forEach(script => {
            if (script.src && !script.src.includes('gtm')) urls.push(script.src);
        });
        return urls;
    });

    console.log(`    Found ${imageSrcs.length} images, ${cssUrls.length} CSS, ${jsUrls.length} JS`);

    // Download images
    let downloaded = 0;
    for (const src of imageSrcs) {
        try {
            const url = src.startsWith('http') ? src : new URL(src, BASE_URL).href;
            const urlObj = new URL(url);
            // Keep Apple's path structure
            const localPath = path.join(OUTPUT_DIR, urlObj.pathname);

            if (await downloadFile(url, localPath)) {
                downloaded++;
            }
        } catch (e) { }
    }
    console.log(`    ✅ Downloaded ${downloaded} images`);

    // Download CSS
    downloaded = 0;
    for (const src of cssUrls) {
        try {
            const url = src.startsWith('http') ? src : new URL(src, BASE_URL).href;
            const urlObj = new URL(url);
            const localPath = path.join(OUTPUT_DIR, urlObj.pathname);

            if (await downloadFile(url, localPath)) {
                downloaded++;
            }
        } catch (e) { }
    }
    console.log(`    ✅ Downloaded ${downloaded} CSS files`);

    // Download JS (excluding tracking)
    downloaded = 0;
    for (const src of jsUrls) {
        try {
            const url = src.startsWith('http') ? src : new URL(src, BASE_URL).href;
            const urlObj = new URL(url);
            const localPath = path.join(OUTPUT_DIR, urlObj.pathname);

            if (await downloadFile(url, localPath)) {
                downloaded++;
            }
        } catch (e) { }
    }
    console.log(`    ✅ Downloaded ${downloaded} JS files`);

    return { cssUrls, jsUrls };
}

// Process HTML to use local paths
function processHtml(html) {
    // Convert absolute Apple URLs to local paths
    html = html.replace(/https?:\/\/www\.apple\.com(?=\/)/g, '');
    html = html.replace(/https?:\/\/apple\.com(?=\/)/g, '');

    // Remove analytics/tracking
    html = html.replace(/<script[^>]*gtm[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<script[^>]*analytics[^>]*>[\s\S]*?<\/script>/gi, '');

    return html;
}

async function clonePage(browser, pageConfig) {
    console.log(`\n🔄 Cloning ${pageConfig.name}...`);

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navigate to page
    const url = BASE_URL + pageConfig.url;
    console.log(`  📄 Loading ${url}`);

    try {
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
    } catch (e) {
        console.log(`  ⚠️ Navigation timeout, continuing anyway...`);
    }

    // Scroll to trigger lazy loading
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

    // Wait for images to load
    await new Promise(r => setTimeout(r, 3000));

    // Download all assets
    const { cssUrls, jsUrls } = await downloadAssets(page, url);

    // Get the full HTML
    console.log('  📝 Extracting HTML...');
    const rawHtml = await page.content();
    const html = processHtml(rawHtml);

    // Extract just the body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;

    // Get head content (styles, meta)
    const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
    const headContent = headMatch ? headMatch[1] : '';

    // Escape for JS template literal
    const escapedBody = bodyContent
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\${/g, '\\${');

    const escapedHead = headContent
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\${/g, '\\${');

    // Create page component
    const component = `'use client';
import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    // Inject head content
    const headContent = \`${escapedHead}\`;
    const parser = new DOMParser();
    const headDoc = parser.parseFromString('<head>' + headContent + '</head>', 'text/html');
    
    // Add stylesheets
    headDoc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      if (!document.querySelector(\`link[href="\${link.getAttribute('href')}"]\`)) {
        const newLink = document.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = link.getAttribute('href');
        document.head.appendChild(newLink);
      }
    });
    
    // Add meta tags
    headDoc.querySelectorAll('meta').forEach(meta => {
      const newMeta = meta.cloneNode(true);
      document.head.appendChild(newMeta);
    });
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: \`${escapedBody}\` }} />
  );
}
`;

    // Create page directory
    const pageDir = pageConfig.name === 'iphone'
        ? PAGES_DIR  // iPhone is home page
        : path.join(PAGES_DIR, pageConfig.name);
    ensureDir(pageDir);

    // Save page component
    const pagePath = path.join(pageDir, 'page.tsx');
    fs.writeFileSync(pagePath, component);
    console.log(`  ✅ Saved ${pagePath}`);

    await page.close();
}

async function main() {
    console.log('🚀 Starting Full Apple Clone...\n');
    console.log('Output directory:', OUTPUT_DIR);

    // Ensure output directories exist
    ensureDir(OUTPUT_DIR);
    ensureDir(PAGES_DIR);

    // Launch browser
    console.log('🌐 Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Clone each page
    for (const pageConfig of PAGES) {
        await clonePage(browser, pageConfig);
    }

    await browser.close();

    console.log('\n✨ Clone complete!');
    console.log(`   Assets: ${downloadedAssets.size} files downloaded`);
    console.log('   Run: npm run dev');
}

main().catch(console.error);
