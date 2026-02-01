#!/bin/bash
# Download all missing CSS files referenced in index.html files

BASE_URL="https://www.apple.com"
CLONE_DIR="site-clone/apple.com"

# Find all CSS references in all index.html files
css_urls=$(grep -roh 'href="/[^"]*\.css"' "$CLONE_DIR" --include="*.html" | sed 's/href="//' | sed 's/"$//' | sort -u)

echo "Found CSS files to check:"
echo "$css_urls"
echo ""

for css_url in $css_urls; do
    local_path="$CLONE_DIR${css_url}"
    
    if [ ! -f "$local_path" ]; then
        echo "Missing: $css_url"
        dir_path=$(dirname "$local_path")
        mkdir -p "$dir_path"
        
        full_url="${BASE_URL}${css_url}"
        echo "Downloading from $full_url..."
        curl -s "$full_url" -o "$local_path"
        
        if [ -f "$local_path" ]; then
            size=$(ls -la "$local_path" | awk '{print $5}')
            echo "  Saved: $local_path ($size bytes)"
        else
            echo "  FAILED to download"
        fi
    fi
done

# Also download JS files
echo ""
echo "Checking JS files..."

js_urls=$(grep -roh 'src="/[^"]*\.js"' "$CLONE_DIR" --include="*.html" | sed 's/src="//' | sed 's/"$//' | sort -u)

for js_url in $js_urls; do
    local_path="$CLONE_DIR${js_url}"
    
    if [ ! -f "$local_path" ]; then
        echo "Missing JS: $js_url"
        dir_path=$(dirname "$local_path")
        mkdir -p "$dir_path"
        
        full_url="${BASE_URL}${js_url}"
        curl -s "$full_url" -o "$local_path"
        
        if [ -f "$local_path" ]; then
            size=$(ls -la "$local_path" | awk '{print $5}')
            echo "  Saved: $local_path ($size bytes)"
        fi
    fi
done

echo ""
echo "Done!"
