#!/usr/bin/env python3
"""Fast parallel downloader for missing assets"""
import os
import re
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE_URL = "https://www.apple.com"
CLONE_DIR = "site-clone/apple.com"
MAX_WORKERS = 20  # Parallel downloads

headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
}

def download_file(url, local_path):
    """Download a single file"""
    try:
        if os.path.exists(local_path):
            return None  # Already exists
        
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        resp = requests.get(url, headers=headers, timeout=30)
        if resp.status_code == 200:
            with open(local_path, 'wb') as f:
                f.write(resp.content)
            return local_path
    except Exception as e:
        pass
    return None

def find_all_assets():
    """Find all asset URLs in HTML files"""
    assets = set()
    patterns = [
        r'src="(/v/[^"]+\.(jpg|jpeg|png|webp|svg|mp4|mov))"',
        r'href="(/v/[^"]+\.(css|js))"',
        r'srcset="([^"]+)"',
        r'data-src="(/[^"]+\.(jpg|jpeg|png|webp))"',
    ]
    
    for html_file in Path(CLONE_DIR).rglob("*.html"):
        try:
            content = html_file.read_text(errors='ignore')
            for pattern in patterns:
                for match in re.finditer(pattern, content, re.IGNORECASE):
                    url = match.group(1)
                    # Handle srcset (multiple URLs)
                    if ',' in url:
                        for part in url.split(','):
                            part = part.strip().split()[0]
                            if part.startswith('/'):
                                assets.add(part)
                    elif url.startswith('/'):
                        assets.add(url)
        except:
            pass
    
    return assets

def main():
    print("Scanning for all assets...")
    assets = find_all_assets()
    print(f"Found {len(assets)} asset references")
    
    # Filter to only missing files
    to_download = []
    for url in assets:
        local_path = os.path.join(CLONE_DIR, url.lstrip('/'))
        if not os.path.exists(local_path):
            to_download.append((f"{BASE_URL}{url}", local_path))
    
    print(f"Missing: {len(to_download)} files")
    
    if not to_download:
        print("All assets already downloaded!")
        return
    
    # Download in parallel
    downloaded = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(download_file, url, path): (url, path) 
                   for url, path in to_download}
        
        for future in as_completed(futures):
            result = future.result()
            if result:
                downloaded += 1
                if downloaded % 50 == 0:
                    print(f"Downloaded {downloaded}/{len(to_download)}...")
    
    print(f"\nCompleted! Downloaded {downloaded} files.")

if __name__ == "__main__":
    main()
