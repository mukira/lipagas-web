
import os

store_path = "public/pages/store.html"
config_path = "shelf5_config.html"

with open(store_path, "r") as f:
    content = f.read()

with open(config_path, "r") as f:
    config_data = f.read()

# Target insertion point: before the div that starts shelf-6 section
# In store.html, shelf-6 is inside a div with class "rs-cardsshelf rs-cardsshelf-mzone" 
# relative to the previous content.
# Let's search for unique string near line 1246
target_str = '<div id="shelf-6">'

if target_str not in content:
    print("Target string not found!")
    exit(1)

# We want to insert BEFORE the parent div of shelf-6 if possible, or just before shelf-6
# Looking at the file structure:
# ...
# </div>
# <div class="rs-cardsshelf rs-cardsshelf-mzone">
#    <div id="shelf-6">...

# Let's target `<div id="shelf-6">` and look backwards for the opening wrapper?
# Actually, the script should likely be *inside* the wrapper or between wrappers.
# In the live site, they are separate `rs-cardsshelf` divs.
# So putting it before the div containing shelf-6 is synonymous with putting it after shelf-5.

index = content.find(target_str)
# Find the start of the line or the preceding div
# It's safer to just insert it right before `<div id="shelf-6">` but the script might need to be outside?
# In live site:
# <script>...</script>
# <div class="rs-cardsshelf ..."> <div id="shelf-6"> ...

# Wait, in live site, the script is NOT inside the shelf-5 div, it's after it.
# And before shelf-6's container?
# let's look at temp_store_live.html again potentially if I'm unsure.
# Line 1767: </div> (Closing shelf-5 container)
# Line 1768: <script>...
# Line 1782: <div class="rs-cardsshelf ...">

# So I should insert before `<div class="rs-cardsshelf rs-cardsshelf-mzone">` that contains `shelf-6`.
# In local store.html line 1246: `<div class="rs-cardsshelf rs-cardsshelf-mzone">`
# Followed by 1248: `<div id="shelf-6">`

insertion_marker = '<div class="rs-cardsshelf rs-cardsshelf-mzone">\n\n        <div id="shelf-6">' 
# The whitespace might vary.

# Let's just find `<div id="shelf-6">` and go back to the previous line?
parts = content.split('<div id="shelf-6">')
pre_shelf6 = parts[0]
post_shelf6 = '<div id="shelf-6">' + parts[1]

# Find the last closing tag before this?
# Or just append config_data to pre_shelf6
# But pre_shelf6 includes the opening `<div class="rs-cardsshelf ...">` ?
# If I insert before `shelf-6`, it will be inside the `rs-cardsshelf` wrapper?
# Let's check line 1246 of store.html again.
# 1246: <div class="rs-cardsshelf rs-cardsshelf-mzone">
# 1248: <div id="shelf-6">

# Does `shelf-5` have its own wrapper?
# 1180: <div class="rs-cardsshelf rs-cardsshelf-mzone">
# 1182: <div id="shelf-5">

# So yes, they are wrapped.
# I want to insert AFTER the closing div of shelf-5's wrapper.
# Line 1243: </div>  (This might be the closing one)
# Line 1246: <div class="rs-cardsshelf ...

# So I should insert before `<div class="rs-cardsshelf rs-cardsshelf-mzone">` IF it is followed by shelf-6.
# Using python find/replace with context is safer.

split_point = '<div class="rs-cardsshelf rs-cardsshelf-mzone">\n\n        <div id="shelf-6">'
if split_point not in content:
    # try looser matching
    # Finds the index of shelf-6
    idx = content.find('<div id="shelf-6">')
    # search backwards for rs-cardsshelf
    wrapper_start = content.rfind('<div class="rs-cardsshelf rs-cardsshelf-mzone">', 0, idx)
    if wrapper_start == -1:
        print("Could not find wrapper for shelf-6")
        exit(1)
    
    new_content = content[:wrapper_start] + config_data + "\n" + content[wrapper_start:]
else:
    new_content = content.replace(split_point, config_data + "\n" + split_point)

with open(store_path, "w") as f:
    f.write(new_content)

print("Successfully inserted shelf-5 config.")
