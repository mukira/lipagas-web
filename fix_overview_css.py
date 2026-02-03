import re

def main():
    css_path = 'public/v/watch/bt/built/styles/overview.built.css'
    
    try:
        with open(css_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: Could not find CSS file at {css_path}")
        return
        
    # Replace .png references in chapternav images with .svg
    # Pattern: url(/v/watch/bt/images/chapternav/filename.png) -> ...filename.svg
    # We target specific path to avoid breaking other things
    
    new_content = re.sub(
        r'(url\(/v/watch/bt/images/chapternav/[^)]+)\.png\)', 
        r'\1.svg)', 
        content
    )
    
    if new_content != content:
        with open(css_path, 'w') as f:
            f.write(new_content)
        print(f"Successfully updated {css_path} to use SVG images.")
    else:
        print("No changes needed or no matching patterns found.")

if __name__ == "__main__":
    main()
