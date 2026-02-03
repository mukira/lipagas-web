import os
import re

def main():
    css_path = 'public/v/watch/bt/built/styles/overview.built.css'
    output_dir = 'public/v/watch/bt/images/chapternav'
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Read CSS to find filenames
    try:
        with open(css_path, 'r') as f:
            css_content = f.read()
    except FileNotFoundError:
        print(f"Error: Could not find CSS file at {css_path}")
        return

    # Regex to find chapternav image URLs
    # Looking for: url(/v/watch/bt/images/chapternav/FILENAME)
    # capturing the filename
    matches = re.findall(r'url\(/v/watch/bt/images/chapternav/([^)]+)\)', css_content)
    
    unique_filenames = set(matches)
    print(f"Found {len(unique_filenames)} unique image references.")

    # Mapping keywords to text
    mappings = {
        'ultra': 'Ultra',
        's10': 'S11', 
        'se': 'SE',
        'nike': 'Nike',
        'hermes': 'Hermès',
        'studio': 'Studio',
        'compare': 'vs',
        'bands': 'Band',
        'airpods': 'AirPods',
        'accessories': 'Acc',
        'fitness': 'Fit+',
        'watch_os': 'OS',
        'shop': 'Shop',
        'connect': 'Conn'
    }

    generated_count = 0
    
    for filename in unique_filenames:
        # Determine strict base name without extension for generation targets 
        # (Though we will generate the file matching exactly what is in CSS if we didn't update CSS yet, 
        # but the plan is to update CSS to point to SVGs. 
        # So I will generate .svg versions of everything found.)
        
        base_name = os.path.splitext(filename)[0]
        
        # Determine text
        text = "??"
        lower_name = base_name.lower()
        for key, val in mappings.items():
            if key in lower_name:
                text = val
                break
        
        # SVG Content
        # Simple rounded rect with text centered
        svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#f5f5f7" rx="20" />
  <rect width="100" height="100" fill="none" stroke="#d2d2d7" stroke-width="4" rx="20" />
  <text x="50" y="55" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="24" text-anchor="middle" fill="#1d1d1f">{text}</text>
</svg>'''
        
        # Write .svg file
        # Note: If the CSS asks for .png, we still want to generate an .svg file because we will flip the CSS.
        # But to be safe and cover all bases matching the regex, I'll generate the .svg version of the filename.
        
        target_filename = base_name + '.svg'
        target_path = os.path.join(output_dir, target_filename)
        
        with open(target_path, 'w') as f:
            f.write(svg_content)
        
        generated_count += 1

    print(f"Generated {generated_count} SVG icons in {output_dir}")

if __name__ == "__main__":
    main()
