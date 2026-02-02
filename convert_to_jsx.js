const cheerio = require('cheerio');
const fs = require('fs');

// Read the original HTML
const htmlPath = '/Users/Mukira/apple-lipagas/apple-clone/iphone/index.html';
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(html);

// Extract segments with their original IDs
const header = $('#globalheader').prop('outerHTML') || '';
const localnav = $('#localnav').prop('outerHTML') || '';
const footer = $('#ac-globalfooter').prop('outerHTML') || '';
// Global nav data is critical
const jsonScripts = $('script[type="application/json"]').map((i, el) => $(el).prop('outerHTML')).get().join('\n');

// Get main content
$('script').remove();
$('#globalheader').remove();
$('#localnav').remove();
$('#ac-globalfooter').remove();
let mainContent = $('body').html();

function robustLinkFix(val) {
  if (!val) return '/';
  if (val.startsWith('http') || val.startsWith('mailto:') || val.startsWith('tel:') || val.startsWith('#')) return val;

  let p = val.replace(/^\/\//, '/');
  p = p.replace(/^(\.\.\/)+/, '').replace(/^(\.\/)+/, '').replace(/^\/+/, '');
  p = p.replace(/\/index\.html$/, '').replace(/\.html$/, '');
  if (p === 'index' || p === '') return '/';
  return `/${p}`;
}

function normalize(html) {
  if (!html) return '';

  // Strip inline event handlers
  html = html.replace(/ on[a-z]+="[^"]*"/gi, '');
  html = html.replace(/ on[a-z]+='[^']*'/gi, '');

  // CRITICAL: Remove data-empty placeholder sources - they block real images
  html = html.replace(/<source[^>]*data-empty=""[^>]*>/gi, '');
  html = html.replace(/<source[^>]*data-empty[^>]*>/gi, '');

  // Remove data-lazy attribute
  html = html.replace(/ data-lazy=""/g, '');
  html = html.replace(/ data-lazy/g, '');

  // Fix srcset separately - each entry is "url descriptor" separated by commas
  html = html.replace(/srcset="([^"]+)"/g, (m, val) => {
    const fixed = val.split(',').map(entry => {
      const parts = entry.trim().split(/\s+/);
      if (parts.length > 0) {
        parts[0] = robustLinkFix(parts[0]);
      }
      return parts.join(' ');
    }).join(', ');
    return `srcset="${fixed}"`;
  });

  // Fix data-srcset the same way
  html = html.replace(/data-srcset="([^"]+)"/g, (m, val) => {
    const fixed = val.split(',').map(entry => {
      const parts = entry.trim().split(/\s+/);
      if (parts.length > 0) {
        parts[0] = robustLinkFix(parts[0]);
      }
      return parts.join(' ');
    }).join(', ');
    return `data-srcset="${fixed}"`;
  });

  // Normalize links and sources (but not srcset which we handled above)
  html = html.replace(/(href|src|data-src)="([^"]+)"/g, (m, attr, val) => {
    const fixed = robustLinkFix(val);
    return `${attr}="${fixed}"`;
  });

  return html;
}


// Inject missing iPhone Index content
mainContent = mainContent.replace(
  /<nav class="index-groups" aria-labelledby="iphone-index">\s*<\/nav>/,
  `<nav class="index-groups" aria-labelledby="iphone-index">
      <div class="index-group-column">
        <h3 class="index-group-title">Explore iPhone</h3>
        <ul class="index-group-list">
          <li><a href="#">Explore All iPhone</a></li>
          <li><a href="#">iPhone 17 Pro</a></li>
          <li><a href="#">iPhone Air</a></li>
          <li><a href="#">iPhone 17</a></li>
          <li><a href="#">iPhone 16</a></li>
          <li><a href="#">iPhone 16e</a></li>
          <li><a href="#">Compare iPhone</a></li>
          <li><a href="#">Switch from Android</a></li>
        </ul>
      </div>
      <div class="index-group-column">
        <h3 class="index-group-title">Shop iPhone</h3>
        <ul class="index-group-list">
          <li><a href="#">Shop iPhone</a></li>
          <li><a href="#">iPhone Accessories</a></li>
          <li><a href="#">Apple Trade In</a></li>
          <li><a href="#">Carrier Deals at Apple</a></li>
          <li><a href="#">Financing</a></li>
          <li><a href="#">Personal Setup</a></li>
        </ul>
      </div>
      <div class="index-group-column">
        <h3 class="index-group-title">More from iPhone</h3>
        <ul class="index-group-list">
          <li><a href="#">iPhone Support</a></li>
          <li><a href="#">AppleCare</a></li>
          <li><a href="#">iOS 26</a></li>
          <li><a href="#">Apple Intelligence</a></li>
          <li><a href="#">Apps by Apple</a></li>
          <li><a href="#">iPhone Privacy</a></li>
          <li><a href="#">Better with Mac</a></li>
          <li><a href="#">iCloud+</a></li>
          <li><a href="#">Wallet, Pay, Card</a></li>
          <li><a href="#">Siri</a></li>
        </ul>
      </div>
    </nav>`
);

const finalHeader = normalize(jsonScripts + '\n' + header + '\n' + localnav);
const finalFooter = normalize(footer);
const finalMain = normalize(mainContent);

const safeHeader = JSON.stringify(finalHeader.replace(/no-js/g, 'js'));
const safeFooter = JSON.stringify(finalFooter.replace(/no-js/g, 'js'));
const safeMain = JSON.stringify(finalMain.replace(/no-js/g, 'js'));

// Create the React component with proper Apple script initialization
const pageOutput = `'use client';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      // Set JS class
      document.documentElement.className = document.documentElement.className.replace('no-js', 'js');
      
      // Force visibility of all elements
      const style = document.createElement('style');
      style.textContent = \`
        /* Force visibility of all elements */
        body, html { opacity: 1 !important; visibility: visible !important; }
        .section, .section-hero, .ribbon, .chapternav, .feature-card, .tile,
        .page-header, .page-header-headline, .page-header-title,
        .product-list, .product-wrap, .card-container, .gallery, nav,
        picture, img, figure, video, [data-staggered-item],
        .ac-gf-directory, .ac-gf-directory-column, .ac-gf-directory-column-section,
        .ac-gf-directory-column-section-list, .ac-gf-directory-column-section-item,
        .index-groups, .index-group-column, .index-group-list, .index-group-list li {
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Flexbox for index columns */
        .index-groups, .ac-gf-directory { display: flex !important; flex-wrap: wrap !important; justify-content: space-between; }
        .index-group-column, .ac-gf-directory-column { flex: 1 !important; display: block !important; padding: 0 20px; }
        .index-group-list, .ac-gf-directory-column-section-list { display: block !important; list-style: none; padding: 0; }
        .index-group-title { margin-bottom: 10px; font-weight: 600; font-size: 12px; color: #1d1d1f; }
        .index-group-list li a { text-decoration: none; color: #424245; font-size: 12px; line-height: 2; }
        .index-group-list li a:hover { text-decoration: underline; color: #1d1d1f; }

        .ac-gf-directory-column-section-title-button { display: none !important; }
        
        /* Accordion handling */
        .accordion-tray { display: none; }
        .accordion-item.expanded .accordion-tray { display: block !important; visibility: visible !important; opacity: 1 !important; height: auto !important; }
        
        /* Ensure arrows are visible and rotate */
        .accordion-icon { 
          display: inline-block;
          width: 20px; 
          height: 20px; 
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%231d1d1f' stroke-width='2' d='M2 5l6 6 6-6'/%3E%3C/svg%3E") no-repeat center;
          transition: transform 0.3s ease;
          margin-left: 8px;
        }
        .accordion-item.expanded .accordion-icon { transform: rotate(180deg); }
        .accordion-button { cursor: pointer; display: flex; align-items: center; justify-content: space-between; width: 100%; text-align: left; }
      \`;
      document.head.appendChild(style);
      
      // Load only mock pricing (Apple scripts have too many external dependencies)
      setTimeout(() => {
        const s = document.createElement('script');
        s.src = '/mock-pricing.js';
        s.async = true;
        document.body.appendChild(s);
        
        // Initialize Accordions
        document.querySelectorAll('.accordion-button').forEach(btn => {
           btn.addEventListener('click', (e) => {
              e.preventDefault();
              const item = btn.closest('.accordion-item');
              if (item) {
                 const wasExpanded = item.classList.contains('expanded');
                 
                 // Close others (optional, but Apple usually does this)
                 document.querySelectorAll('.accordion-item').forEach(i => {
                    i.classList.remove('expanded');
                    const t = i.querySelector('.accordion-tray');
                    if (t) t.style.display = 'none';
                 });
                 
                 if (!wasExpanded) {
                    item.classList.add('expanded');
                    const tray = item.querySelector('.accordion-tray');
                    if (tray) tray.style.display = 'block';
                 }
              }
           });
        });
        
        // Open the first accordion by default
        const firstInfo = document.querySelector('.accordion-item');
        if (firstInfo) {
           firstInfo.classList.add('expanded');
           const tray = firstInfo.querySelector('.accordion-tray');
           if (tray) tray.style.display = 'block';
        }
        
      }, 300);
    }
  }, []);

  return (
    <div suppressHydrationWarning>
      <div id="header-root" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: ${safeHeader} }} />
      <div id="main-root" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: ${safeMain} }} />
      <div id="footer-root" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: ${safeFooter} }} />
    </div>
  );
}
`;

fs.writeFileSync('/Users/Mukira/apple-lipagas/apple-nextjs/src/app/page.tsx', pageOutput);
console.log('✅ Proper Apple script initialization completed.');
