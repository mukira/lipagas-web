const cheerio = require('cheerio');
const fs = require('fs');

const storePath = './public/pages/store.html';
let html = fs.readFileSync(storePath, 'utf8');
const $ = cheerio.load(html);

console.log('Analyzing store.html for duplicates...\n');

// Find duplicate sections with same class patterns
function findAndRemoveDuplicatesByClass(selector, description) {
    const elements = $(selector);
    if (elements.length > 1) {
        console.log(`Found ${elements.length} ${description} - keeping only first`);
        elements.slice(1).remove();
        return elements.length - 1;
    }
    return 0;
}

// Look for common section classes that might be duplicated
let removed = 0;

// 1. Product navigation rows with category icons (Mac, iPhone, iPad, etc)
// These are typically in "rs-ccard-shelf" or similar containers
const shelfSections = $('[class*="shelf"]').filter((i, el) => {
    const text = $(el).text();
    return text.includes('Mac') && text.includes('iPhone') && text.includes('iPad');
});
if (shelfSections.length > 1) {
    console.log(`Found ${shelfSections.length} product navigation shelves - keeping only first`);
    shelfSections.slice(1).remove();
    removed += shelfSections.length - 1;
}

// 2. Promo bar ribbons
const promoBars = $('[class*="promoribbon"]');
if (promoBars.length > 1) {
    console.log(`Found ${promoBars.length} promo ribbons - keeping only first`);
    promoBars.slice(1).remove();
    removed += promoBars.length - 1;
}

// 3. Valentine/hero sections
const heroSections = $('[class*="rf-modulehero"]');
if (heroSections.length > 1) {
    console.log(`Found ${heroSections.length} hero sections - keeping only first`);
    heroSections.slice(1).remove();
    removed += heroSections.length - 1;
}

// 4. Find sections with "Connect with a Specialist" and remove duplicates
const connectLinks = $('a:contains("Connect with a Specialist")');
console.log(`Found ${connectLinks.length} "Connect with a Specialist" links`);
if (connectLinks.length > 1) {
    // Find parent sections and remove duplicates
    const parents = new Set();
    connectLinks.each((i, el) => {
        let parent = $(el).parent();
        // Go up a few levels to find the container
        for (let j = 0; j < 5; j++) {
            parent = parent.parent();
            if (parent.children().length > 1) break;
        }
        if (i > 0) {
            // Remove duplicate parents after the first one
            // But be careful not to remove the whole page
        }
    });
}

// 5. Look for rs-ccard sections (category cards like Mac, iPhone icons)
const ccardContainers = $('[class*="rs-ccard-content"]').parent().parent();
console.log(`Found ${ccardContainers.length} category card containers`);

// Analyze by content hash - find truly duplicate elements
const sectionHashes = {};
$('section[id], [class*="rf-modular"]').each((i, el) => {
    const content = $(el).html();
    const hash = content.substring(0, 500); // First 500 chars as fingerprint
    if (!sectionHashes[hash]) {
        sectionHashes[hash] = [];
    }
    sectionHashes[hash].push(el);
});

for (const [hash, elements] of Object.entries(sectionHashes)) {
    if (elements.length > 1) {
        console.log(`Found ${elements.length} duplicate sections based on content fingerprint`);
        for (let i = 1; i < elements.length; i++) {
            $(elements[i]).remove();
            removed++;
        }
    }
}

// 6. More specific: find section with "The latest. All-new and lovable"
const latestSections = $('[class*="section"]').filter((i, el) => {
    return $(el).text().includes('The latest') && $(el).text().includes('lovable');
});
console.log(`Found ${latestSections.length} "The latest" sections`);
if (latestSections.length > 1) {
    latestSections.slice(1).remove();
    removed += latestSections.length - 1;
}

// 7. Remove embedded JSON data scripts that contain image URLs (they cause hydration)
$('script[data-n-head]').remove();
$('script:contains("pageLevelData")').slice(1).remove();

console.log(`\nTotal sections removed: ${removed}`);

// Save cleaned HTML
fs.writeFileSync(storePath, $.html(), 'utf8');
console.log('Saved cleaned store.html');

// Verify
const newHtml = fs.readFileSync(storePath, 'utf8');
const $new = cheerio.load(newHtml);
console.log(`\nAfter cleanup:`);
console.log(`- "Pay monthly" occurrences: ${(newHtml.match(/Pay monthly at 0% APR/g) || []).length}`);
console.log(`- "Connect with a Specialist" occurrences: ${$new('a:contains("Connect with a Specialist")').length}`);
