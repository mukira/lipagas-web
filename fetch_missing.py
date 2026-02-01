import os
import re
import requests
import urllib.parse
from pathlib import Path

# Target directory containing the index.html
TARGET_DIR = "site-clone/apple.com/iphone-17-pro"
HTML_FILE = os.path.join(TARGET_DIR, "index.html")
# Base URL for Apple
BASE_URL = "https://www.apple.com"
# Local root mapping to site-clone/apple.com
LOCAL_ROOT = "site-clone/apple.com"

def download_file(url, local_path):
    try:
        # Create parent directories
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        print(f"Downloading {url} -> {local_path}")
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(url, headers=headers, stream=True)
        resp.raise_for_status()
        
        with open(local_path, 'wb') as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        print("Success.")
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

def main():
    root_dir = "site-clone/apple.com"
    html_files = []
    
    # Find all index.html files
    for root, dirs, files in os.walk(root_dir):
        if "index.html" in files:
            html_files.append(os.path.join(root, "index.html"))
            
    print(f"Found {len(html_files)} pages to scan.")
    
    total_downloaded = 0
    total_existing = 0
    
    for html_file in html_files:
        print(f"\nScanning {html_file}...")
        
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading {html_file}: {e}")
            continue

        # Find all file references
        urls = set()
        
        # Regex for src
        src_matches = re.finditer(r'src=["\']([^"\']+)["\']', content)
        for m in src_matches:
            urls.add(m.group(1))
            
        # Regex for srcset
        srcset_matches = re.finditer(r'srcset=["\']([^"\']+)["\']', content)
        for m in srcset_matches:
            parts = m.group(1).split(',')
            for p in parts:
                url = p.strip().split(' ')[0]
                if url:
                    urls.add(url)
        
        print(f"  Found {len(urls)} assets.")
        
        for url in urls:
            if not url.startswith('/'):
                continue 
                
            clean_url = url.split('?')[0]
            
            # Remove leading slash for join
            rel_path = clean_url.lstrip('/')
            local_path = os.path.join("site-clone/apple.com", rel_path)
            
            if os.path.exists(local_path):
                total_existing += 1
                continue
                
            ext = os.path.splitext(local_path)[1].lower()
            if ext in ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.svg', '.css', '.js']:
                full_url = BASE_URL + url
                if download_file(full_url, local_path):
                    total_downloaded += 1
    
    print(f"\nGlobal Summary: {total_existing} existing, {total_downloaded} downloaded.")

if __name__ == "__main__":
    main()
