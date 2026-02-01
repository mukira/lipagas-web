#!/usr/bin/env python3
"""Generate Next.js pages with embedded HTML and proper classes/styles using Head component"""
import re
import os

def extract_tag_attribute(html, tag, attr):
    match = re.search(f'<{tag}[^>]*{attr}="([^"]*)"', html, re.IGNORECASE)
    return match.group(1) if match else ""

def extract_body_content(html):
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    if body_match:
        body = body_match.group(1)
        body = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.DOTALL | re.IGNORECASE)
        return body
    return ""

def extract_page_styles(html):
    global_styles = [
        'globalheader.css', 
        'ac-globalfooter.built.css', 
        'ac-localnav.built.css', 
        'fonts.css', 
        'icon-fixes.css'
    ]
    
    styles = []
    for match in re.finditer(r'<link[^>]*href="([^"]*\.css)"[^>]*>', html):
        href = match.group(1)
        if not any(g in href for g in global_styles):
            if not href.startswith('/') and not href.startswith('http'):
                href = '/' + href
            styles.append(href)
    return styles

def escape_for_jsx(html):
    html = html.replace('\\', '\\\\')
    html = html.replace('`', '\\`')
    html = html.replace('${', '\\${')
    return html

pages = [
    ('site-clone/apple.com/iphone/index.html', 'iphone', 'iPhone'),
    ('site-clone/apple.com/iphone-17-pro/index.html', 'iphone-17-pro', 'iPhone 17 Pro'),
    ('site-clone/apple.com/iphone-air/index.html', 'iphone-air', 'iPhone Air'),
    ('site-clone/apple.com/iphone-17/index.html', 'iphone-17', 'iPhone 17'),
    ('site-clone/apple.com/iphone-16e/index.html', 'iphone-16e', 'iPhone 16e'),
    ('site-clone/apple.com/iphone/compare/index.html', 'iphone/compare', 'Compare iPhone'),
    ('site-clone/apple.com/iphone/switch/index.html', 'iphone/switch', 'Switch to iPhone'),
]

for html_path, route, title in pages:
    if os.path.exists(html_path):
        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
            html_content = f.read()
            
        body = extract_body_content(html_content)
        styles = extract_page_styles(html_content)
        html_classes = extract_tag_attribute(html_content, 'html', 'class')
        body_classes = extract_tag_attribute(html_content, 'body', 'class')
        
        if 'no-js' in html_classes:
            html_classes = html_classes.replace('no-js', 'js')
        elif 'js' not in html_classes:
            html_classes += ' js'
            
        dir_path = f"apple-nextjs/src/app/{route}"
        os.makedirs(dir_path, exist_ok=True)
        
        escaped_body = escape_for_jsx(body)
        
        # Use simple link tags in a div - Next.js will move them to head if possible
        # or we use a custom head component. In App Router, we should use metadata
        # or just regular link tags in the component. Regular link tags in the body
        # are valid HTML5 and will trigger immediate loading.
        
        styles_tags = '\n'.join([f'        <link rel="stylesheet" href="{s}" />' for s in styles])
        
        page_tsx = f'''"use client";

import {{ useEffect }} from "react";

const htmlContent = `{escaped_body}`;

export default function Page() {{
  useEffect(() => {{
    const html = document.documentElement;
    const body = document.body;
    
    html.className = "{html_classes}";
    body.className = "{body_classes}";
    
    if (!html.classList.contains('js')) html.classList.add('js');
  }}, []);

  return (
    <>
{styles_tags}
      <div dangerouslySetInnerHTML={{{{ __html: htmlContent }}}} />
    </>
  );
}}
'''
        with open(f"{dir_path}/page.tsx", 'w', encoding='utf-8') as f:
            f.write(page_tsx)
        
        print(f"Created: {route}")

print("Done!")
