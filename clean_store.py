
import os

file_path = 'public/pages/store.html'
with open(file_path, 'r') as f:
    lines = f.readlines()

# Indicated range to delete: 1260 to 1441 (1-based)
# 0-based index: 1259 to 1441
# lines[1259] should be <div class="rs-cardsshelf">
# lines[1441] should be <div class="rs-cardsshelf"> (The start of the GOOD block, which we keep)

start_idx = 1259
end_idx = 1441

print(f"Line {start_idx+1}: {lines[start_idx]}")
print(f"Line {end_idx+1}: {lines[end_idx]}")

if '<div class="rs-cardsshelf">' not in lines[start_idx]:
    print("WARNING: Start line verification failed!")
    exit(1)
if '<div class="rs-cardsshelf">' not in lines[end_idx]:
    print("WARNING: End line verification failed!")
    # Note: line 1442 in view was the div. 1441 was empty.
    # In 0-based:
    # 1442 (1-based) -> 1441 (0-based)
    # So lines[1441] IS the div.
    exit(1)

# Delete
del lines[start_idx:end_idx]

with open(file_path, 'w') as f:
    f.writelines(lines)

print("Successfully removed duplicate duplicate lines.")
