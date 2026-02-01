import os
import shutil

root_dir = 'site-clone/apple.com'
extensions = ['.jpg', '.jpeg', '.png', '.webp']
variants = ['_small', '_small_2x', '_medium', '_medium_2x', '_large', '_large_2x']

def backfill():
    for root, dirs, files in os.walk(root_dir):
        # Group files by their base name (without variant suffix)
        groups = {}
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext not in extensions:
                continue
            
            base = f
            found_variant = None
            for v in variants:
                if f.endswith(v + ext):
                    base = f[:-(len(v) + len(ext))]
                    found_variant = v
                    break
            
            if base not in groups:
                groups[base] = []
            
            # Use realpath to avoid issues if we're scanning existing symlinks
            full_path = os.path.join(root, f)
            if os.path.islink(full_path):
                continue
                
            groups[base].append({'file': f, 'variant': found_variant, 'ext': ext})

        for base, items in groups.items():
            # Find the "best" available variant (prefer large_2x, then large)
            best_item = None
            for v_target in ['_large_2x', '_large', '_medium_2x', '_medium']:
                for item in items:
                    if item['variant'] == v_target:
                        best_item = item
                        break
                if best_item:
                    break
            
            if not best_item and items:
                best_item = items[0]
            
            if not best_item:
                continue

            # Backfill missing variants
            for v_target in variants:
                ext = best_item['ext']
                target_name = base + v_target + ext
                target_path = os.path.join(root, target_name)
                
                # If it's a link, remove it
                if os.path.islink(target_path):
                    os.unlink(target_path)
                
                if not os.path.exists(target_path):
                    source_path = os.path.join(root, best_item['file'])
                    print(f"Backfilling {target_name} by copying {best_item['file']}")
                    try:
                        shutil.copy2(source_path, target_path)
                    except Exception as e:
                        print(f"Error copying file: {e}")

if __name__ == "__main__":
    backfill()
