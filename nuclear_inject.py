
import os

store_path = 'public/pages/store.html'
shelf5_path = 'shelf_5.html'
shelf6_path = 'shelf_6.html'

with open(shelf5_path, 'r') as f:
    shelf5_content = f.read()

with open(shelf6_path, 'r') as f:
    shelf6_content = f.read()

with open(store_path, 'r') as f:
    lines = f.readlines()

# Find start of Shelf 5 (the mess) and start of Shelf 7
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '<div id="shelf-5">' in line:
        start_idx = i
        break

# Find shelf-7
for i, line in enumerate(lines):
    if '<div id="shelf-7">' in line:
        end_idx = i
        break

if start_idx == -1 or end_idx == -1:
    print(f"Error: Could not find boundaries. Start: {start_idx}, End: {end_idx}")
    exit(1)

print(f"Deleting lines {start_idx+1} to {end_idx+1} (exclusive of end)")
print(f"Start content: {lines[start_idx][:50]}...")
print(f"End content: {lines[end_idx][:50]}...")

# Construct new lines
new_lines = lines[:start_idx]
new_lines.append(shelf5_content + "\n")
new_lines.append(shelf6_content + "\n")
new_lines.extend(lines[end_idx:])

with open(store_path, 'w') as f:
    f.writelines(new_lines)

print("Successfully performed nuclear cleanup and injection.")
