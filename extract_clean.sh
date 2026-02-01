#!/bin/bash
# Extract all clean HAR files to a fresh site-clone directory

set -e

CLONE_DIR="site-clone"
BACKUP_DIR="site-clone-backup-$(date +%Y%m%d%H%M%S)"

echo "=== Clean extraction of mobile HARs ==="

# Backup existing clone
if [ -d "$CLONE_DIR" ]; then
    echo "Backing up existing clone to $BACKUP_DIR..."
    mv "$CLONE_DIR" "$BACKUP_DIR"
fi

# Create fresh clone directory
mkdir -p "$CLONE_DIR"

# Extract each HAR file
for har in clean_*.har; do
    if [ -f "$har" ]; then
        echo "Extracting $har..."
        npx har-extractor "$har" --output "$CLONE_DIR" --remove-query-string
    fi
done

# Copy fonts.css if it exists in backup
if [ -f "$BACKUP_DIR/apple.com/wss/fonts/fonts.css" ]; then
    echo "Restoring fonts.css..."
    mkdir -p "$CLONE_DIR/apple.com/wss/fonts"
    cp "$BACKUP_DIR/apple.com/wss/fonts/fonts.css" "$CLONE_DIR/apple.com/wss/fonts/"
fi

echo "=== Extraction complete ==="
echo "Run: npx serve $CLONE_DIR/apple.com"
