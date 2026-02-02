const cheerio = require('cheerio');
const fs = require('fs');

// Read the original HTML
const htmlPath = '/Users/Mukira/apple-lipagas/apple-clone/iphone/index.html';
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(html);

// Extract segments with their original IDs
const header = $('#globalheader').prop('outerHTML') || '';
const localnav = $('#localnav').prop('outerHTML') || '';
const footer = $('#globalfooter').prop('outerHTML') || '';
// Global nav data is critical
const jsonScripts = $('script[type="application/json"]').map((i, el) => $(el).prop('outerHTML')).get().join('\n');

// Get main content
$('script').remove();
$('#globalheader').remove();
$('#localnav').remove();
$('#globalfooter').remove();
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

const finalHeader = normalize(jsonScripts + '\n' + header + '\n' + localnav);
const finalFooter = normalize(footer);
const finalMain = normalize(mainContent);

const safeHeader = JSON.stringify(finalHeader);
const safeFooter = JSON.stringify(finalFooter);
const safeMain = JSON.stringify(finalMain);

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
        body, html { opacity: 1 !important; visibility: visible !important; }
        .section, .section-hero, .ribbon, .chapternav, .feature-card, .tile,
        .page-header, .page-header-headline, .page-header-title,
        .product-list, .product-wrap, .card-container, .gallery, nav,
        picture, img, figure, video, [data-staggered-item] {
          opacity: 1 !important;
          visibility: visible !important;
        }
      \`;
      document.head.appendChild(style);
      
      // Load only mock pricing (Apple scripts have too many external dependencies)
      setTimeout(() => {
        const s = document.createElement('script');
        s.src = '/mock-pricing.js';
        s.async = true;
        document.body.appendChild(s);
      }, 300);
    }
  }, []);

  return (
    <div suppressHydrationWarning>
      <div id="header-root" dangerouslySetInnerHTML={{ __html: ${safeHeader} }} />
      <main id="main-root" dangerouslySetInnerHTML={{ __html: ${safeMain} }} />
      <div id="footer-root" dangerouslySetInnerHTML={{ __html: ${safeFooter} }} />
    </div>
  );
}
`;

fs.writeFileSync('/Users/Mukira/apple-lipagas/apple-nextjs/src/app/page.tsx', pageOutput);
console.log('✅ Proper Apple script initialization completed.');
