import json
import re

def generate_html_for_shelf(json_data, shelf_id):
    # The JSON data IS the cards object (value of 'cards' key in source)
    cards = json_data.get('items', [])
    if not cards:
        # Fallback if structure is wrapped
        cards = json_data.get('cards', {}).get('items', [])
    
    html_items = []
    
    print(f"DEBUG: Processing {len(cards)} cards for {shelf_id}")
    for item in cards:
        # Navigate through the nested 'items' structure if present
        if 'items' in item.get('value', {}):
             print("DEBUG: Found nested items")
             nested_items_list = item['value']['items']
             for nested_item in nested_items_list:
                 val = nested_item.get('value', {})
                 html_card = create_card_html(val, shelf_id)
                 if html_card:
                     html_items.append(html_card)
                 else:
                     print(f"DEBUG: Empty HTML for nested item: {val.get('view')}")
        else:
            val = item.get('value', {})
            html_card = create_card_html(val, shelf_id)
            if html_card:
                html_items.append(html_card)
            else:
                print(f"DEBUG: Empty HTML for item: {val.get('view')}")


    # Scroller container structure
    html = f'''
    <div class="rs-cardsshelf-section-bottom">
        <div class="rf-cards-scroller">
            <div class="rf-cards-scroller-overflow">
                <div class="rf-cards-scroller-platter">
                    {''.join(html_items)}
                </div>
            </div>
        </div>
    </div>
    '''
    return html

def create_card_html(val, shelf_id):
    card_size = val.get('cardSize', '33') # Default to 33 if not found
    
    # 1. Content Card (Large Image usually) - shelf-5 first item, shelf-6 first item
    if val.get('view') == 'contentCard':
        content = val.get('cardType', {}).get('contentCard', {}).get('contentStoreCard', {})
        if not content: return ""
        
        image_data = content.get('cardImage', {})
        src = ""
        alt = image_data.get('alt', '')
        if image_data.get('sources'):
            src = image_data['sources'][0]['srcSet']
        
        headline = content.get('headline', '')
        subheadline = content.get('subheadline', '')
        link_data = content.get('textLink', {})
        href = link_data.get('url', '#')
        link_text = link_data.get('linkText', '') # Often missing in this JSON path, might be in omnitureData
        eyebrow = content.get('messagingTag', '')

        return f'''
        <div class="rf-cards-scroller-item rf-cards-scroller-itemview">
            <div class="rf-ccard rf-ccard-{card_size}">
                <a href="{href}" class="rf-ccard-content-link-container">
                    <div class="rf-ccard-content">
                        <div class="rf-ccard-content-img-full-wrapper">
                            <img src="{src}" alt="{alt}" class="rf-ccard-img-full" style="width: 100%; height: auto; opacity: 1 !important; visibility: visible !important; display: block !important;">
                        </div>
                        <div class="rf-ccard-content-info">
                            <div class="rf-ccard-content-eyebrow">{eyebrow}</div>
                            <div class="rf-ccard-content-header">{headline}</div>
                            <div class="rf-ccard-content-desc">{subheadline}</div>
                        </div>
                    </div>
                </a>
            </div>
        </div>
        '''

    # 2. Recommendation Card (Product)
    elif val.get('view') == 'recommendationCard':
        products = val.get('products', [])
        if not products: return ""
        product = products[0]
        
        title = product.get('title', '')
        price_key = product.get('price', '')
        
        # safely get price
        price_amount = "See Price"
        dictionaries = val.get('dictionaries', {})
        price_dict = dictionaries.get('price', {})
        if price_key in price_dict:
             price_amount = price_dict[price_key].get('currentPrice', {}).get('amount', '')

        # Image logic
        image_key = product.get('productImage', '')
        image_dict = dictionaries.get('productImage', {})
        src = ""
        alt = ""
        if image_key in image_dict:
            img_srcs = image_dict[image_key].get('sources', [])
            if img_srcs:
                src = img_srcs[0].get('srcSet', '')
            alt = image_dict[image_key].get('alt', '')
        
        # Check override for "lifestyle" image (common in shelf-5)
        override = val.get('override', {}).get('imageOverride', {})
        if override:
             override_srcs = override.get('sources', [])
             if override_srcs:
                 src = override_srcs[0].get('srcSet', '')
                 # Usually larger images for these cards

        link_url = product.get('productDetailsUrl', '#')

        return f'''
        <div class="rf-cards-scroller-item rf-cards-scroller-itemview">
            <div class="rf-ccard rf-ccard-{card_size}">
                <a href="{link_url}" class="rf-ccard-content-link-container" style="text-decoration: none; color: inherit;">
                    <div class="rf-ccard-content">
                        <div class="rf-ccard-content-img-wrapper" style="text-align: center; padding: 20px;">
                            <img src="{src}" alt="{alt}" style="max-width: 100%; height: auto; opacity: 1 !important; visibility: visible !important; display: inline-block !important;">
                        </div>
                        <div class="rf-ccard-content-info" style="padding: 0 20px 20px;">
                            <div class="rf-ccard-content-header" style="font-size: 17px; font-weight: 600; min-height: 48px;">{title}</div>
                            <div class="rf-ccard-content-price" style="margin-top: 8px;">{price_amount}</div>
                        </div>
                    </div>
                </a>
            </div>
        </div>
        '''
    
    return ""

def main():
    with open('temp_store_live.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract JSON for Shelf 5
    # Regex to find `window.pageLevelData.slots.push({... shelf-5 ...})`
    # It's tricky with regex multiline JSON. I'll search for the markers.
    
    # Simple extraction strategy: find "shelf-5" then find the braces
    # This is fragile but might work if the format is consistent.
    # Better: Use the line numbers I know.
    # Shelf 5 starts roughly 1770.
    # Shelf 6 starts roughly 1821.
    
    # Let's try to extract the JSON string between `cards: ` and `});` for the specific shelves.
    
    # Shelf 5
    match_5 = re.search(r'slotName: "shelf-5".*?cards: (.*?)\n\s+WEB_DRIVER_DETECTED_MOCK_CLOSING_BRACE', content, re.DOTALL)
    # The dump might not have nice closing braces or might have extra JS.
    # Actually, simpler: I'll copy-paste the JSONs I "viewed" earlier manually into this script variable if I can't parse it reliably.
    # But I can't interactively paste.
    
    # I will rely on reading the specific blocks by known unique strings
    
    # Extract Shelf 5 JSON
    # Look for: slotName: "shelf-5" ... cards: {...}
    # It ends with `size: 1` usually at the end of the items list.
    
    # I'll output the logic to finding the JSON object boundaries.
    pass

if __name__ == '__main__':
    # Due to complexity of parsing embedded JSON in HTML with Regex, 
    # I will inline the JSON I read from previous steps since I have it in my context history.
    # This is much more reliable.
    
    # JSON for Shelf 5 (Valentine's) - Reconstructed from my view_file output 
    # (Checking view_file step output for shelf-5 lines 1770-1778 in temp_store_live which I read? 
    # Wait, I read 1770-1900 which had BOTH.
    
    # I will use the file content read in Python to be precise.
    
    # Strategy: Find lines for shelf-5
    import sys
    
    try:
        with open('temp_store_live.html', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # Find start of Shelf 5 JSON
        s5_start = -1
        s5_end = -1
        for i, line in enumerate(lines):
            if 'slotName: "shelf-5"' in line:
                s5_start = i
            if s5_start != -1 and '});' in line and i > s5_start:
                s5_end = i
                break
        
        # Extract Shelf 5 block
        # The 'cards' key starts a bit after s5_start. 
        # I'll just grab the whole Object passed to push() and evaluate it? No, it's JS not JSON (properties aren't quoted sometimes).
        # Wait, the keys in the file ARE quoted: "cards": ...
        # So it is likely valid JSON if I extract the value of "cards".
        
        # Let's manually parse:
        # Find `cards: `
        # Extract until matching bracket.
        
        # Easier: Just Regex capture `cards: ({.*})` but balancing braces is hard.
        # But indentation helps. expected `        cards: {` and closing `        }` with same indent?
        
        # Let's try a robust extraction function
        def extract_json_from_js(lines, start_line):
            # Look for "cards": {
            cards_start = -1
            for i in range(start_line, len(lines)):
                if '"cards": {' in lines[i] or 'cards: {' in lines[i]:
                    cards_start = i
                    break
            
            if cards_start == -1: return None
            
            # Read until the indentation matches the closing brace
            # Assuming simplified formatting
            json_str = ""
            brace_count = 0
            started = False
            
            for i in range(cards_start, len(lines)):
                line = lines[i]
                json_str += line
                brace_count += line.count('{')
                brace_count -= line.count('}')
                if brace_count == 0:
                    return json_str.split('cards: ', 1)[-1].strip().rstrip(',') # split key, remove trailing comma
            return None

        # Shelf 5
        s5_json_str = extract_json_from_js(lines, s5_start)
        # Shelf 6
        s6_start = -1
        for i, line in enumerate(lines):
            if 'slotName: "shelf-6"' in line:
                s6_start = i
                break
        s6_json_str = extract_json_from_js(lines, s6_start)
        
        import json
        
        # Clean up JS specific things if any (like `shelfTitle: ` with backticks... oh wait, cards value is pure JSON usually)
        # Check if s5_json_str is valid JSON
        if s5_json_str:
            try:
                data5 = json.loads(s5_json_str)
                html5 = generate_html_for_shelf(data5, "shelf-5")
                with open('shelf_5.html', 'w') as f: f.write(html5)
                print("Shelf 5 HTML generated.")
            except Exception as e:
                print(f"Error parsing Shelf 5 JSON: {e}")
                # Fallback or debugging
                with open('shelf_5_debug.json', 'w') as f: f.write(s5_json_str)

        if s6_json_str:
            try:
                data6 = json.loads(s6_json_str)
                html6 = generate_html_for_shelf(data6, "shelf-6")
                with open('shelf_6.html', 'w') as f: f.write(html6)
                print("Shelf 6 HTML generated.")
            except Exception as e:
                print(f"Error parsing Shelf 6 JSON: {e}")
                with open('shelf_6_debug.json', 'w') as f: f.write(s6_json_str)

    except Exception as e:
        print(f"Script failed: {e}")
