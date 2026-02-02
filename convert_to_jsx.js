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
        body, html { opacity: 1 !important; visibility: visible !important; }
        .section, .section-hero, .ribbon, .chapternav, .feature-card, .tile,
        .page-header, .page-header-headline, .page-header-title,
        .product-list, .product-wrap, .card-container, .gallery, nav,
        picture, img, figure, video, [data-staggered-item] {
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        /* Accordion handling */
        .accordion-tray { display: none; }
        .accordion-item.expanded .accordion-tray { 
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          height: auto !important;
        }
        
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
      <div id="header-root" dangerouslySetInnerHTML={{ __html: ${safeHeader} }} />
      <main id="main-root" dangerouslySetInnerHTML={{ __html: ${safeMain} }} />
      <div id="footer-root" dangerouslySetInnerHTML={{ __html: ${safeFooter} }} />
    </div>
  );
}
`;

fs.writeFileSync('/Users/Mukira/apple-lipagas/apple-nextjs/src/app/page.tsx', pageOutput);
console.log('✅ Proper Apple script initialization completed.');
