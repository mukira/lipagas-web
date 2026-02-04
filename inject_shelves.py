import os

def main():
    base_dir = '/Users/Mukira/apple-lipagas'
    store_path = os.path.join(base_dir, 'public/pages/store.html')
    shelf5_path = os.path.join(base_dir, 'shelf_5.html')
    shelf6_path = os.path.join(base_dir, 'shelf_6.html')

    with open(shelf5_path, 'r') as f:
        shelf5_content = f.read()
        
    with open(shelf6_path, 'r') as f:
        shelf6_content = f.read()

    with open(store_path, 'r') as f:
        lines = f.readlines()

    # Find the block to replace
    # Start: <div class="rs-cardsshelf rs-cardsshelf-mzone"> (Shelf 6 wrapper, ensuring we replace it)
    # End: <div class="rs-cardsshelf rs-halfsize-cardsshelf"> (Shelf 7 wrapper)
    
    start_index = -1
    end_index = -1
    
    for i, line in enumerate(lines):
        if '<div class="rs-cardsshelf rs-cardsshelf-mzone">' in line:
            start_index = i
        if '<div class="rs-cardsshelf rs-halfsize-cardsshelf">' in line:
            end_index = i
            # We found the next shelf, so we stop here.
            # But we must ensure this is AFTER the start_index
            if start_index != -1 and i > start_index:
                break
    
    if start_index == -1 or end_index == -1:
        print("Could not find the target block in store.html")
        return

    print(f"Replacing lines {start_index} to {end_index}")

    # Construct new content
    new_block = []
    
    # Shelf 5
    new_block.append('<div class="rs-cardsshelf">\n')
    new_block.append('    <div id="shelf-5">\n')
    new_block.append('        <div class="rs-cards-shelf-header">\n')
    new_block.append('            <h2 class="rs-cards-shelf-mainheader">Valentine’s Day.</h2>\n')
    new_block.append('            <span class="rs-cards-shelf-secondaryheader">Favorites for your favorite.</span>\n')
    new_block.append('        </div>\n')
    new_block.append(shelf5_content + '\n')
    new_block.append('    </div>\n')
    new_block.append('</div>\n\n')

    # Shelf 6
    new_block.append('<div class="rs-cardsshelf rs-cardsshelf-mzone">\n')
    new_block.append('    <div id="shelf-6">\n')
    new_block.append('        <div class="rs-cards-shelf-header">\n')
    new_block.append('            <h2 class="rs-cards-shelf-mainheader">Personalization.</h2>\n')
    new_block.append('            <span class="rs-cards-shelf-secondaryheader">Add a little extra heart.</span>\n')
    new_block.append('        </div>\n')
    new_block.append(shelf6_content + '\n')
    new_block.append('    </div>\n')
    new_block.append('</div>\n\n')

    # Replace lines
    new_lines = lines[:start_index] + new_block + lines[end_index:]
    
    with open(store_path, 'w') as f:
        f.writelines(new_lines)
        
    print("Successfully injected Shelf 5 and 6.")

if __name__ == "__main__":
    main()
