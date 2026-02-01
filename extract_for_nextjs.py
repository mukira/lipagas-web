#!/usr/bin/env python3
"""Extract body content from HTML files for Next.js components"""
import re
import os

def extract_body_content(html_path):
    """Extract the content between <body> and </body> tags"""
    with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Extract body content
    body_match = re.search(r'<body[^>]*>(.*?)</body>', content, re.DOTALL | re.IGNORECASE)
    if body_match:
        body = body_match.group(1)
        # Remove script tags for SSR safety
        body = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.DOTALL | re.IGNORECASE)
        return body
    return ""

def extract_page_styles(html_path):
    """Extract page-specific stylesheets"""
    with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    styles = []
    for match in re.finditer(r'<link[^>]*href="(/v/[^"]*\.css)"[^>]*>', content):
        styles.append(match.group(1))
    return styles

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
        body = extract_body_content(html_path)
        styles = extract_page_styles(html_path)
        
        # Create directory
        dir_path = f"apple-nextjs/src/app/{route}"
        os.makedirs(dir_path, exist_ok=True)
        
        # Write HTML content file
        with open(f"{dir_path}/content.html", 'w', encoding='utf-8') as f:
            f.write(body)
        
        # Create styles list string
        styles_imports = '\n'.join([f'        <link rel="stylesheet" href="{s}" />' for s in styles])
        
        # Write page component
        page_tsx = f'''import {{ Metadata }} from "next";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {{
  title: "{title} - Apple",
  description: "Explore {title}. Compare models, find the right iPhone for you, and more.",
}};

async function getContent() {{
  const filePath = path.join(process.cwd(), "src/app/{route}/content.html");
  return fs.readFileSync(filePath, "utf-8");
}}

export default async function Page() {{
  const content = await getContent();
  
  return (
    <>
      <head>
{styles_imports}
      </head>
      <div dangerouslySetInnerHTML={{{{ __html: content }}}} />
    </>
  );
}}
'''
        with open(f"{dir_path}/page.tsx", 'w', encoding='utf-8') as f:
            f.write(page_tsx)
        
        print(f"Created: {route} ({len(body)} chars)")

print("Done!")
