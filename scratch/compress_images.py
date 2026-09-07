import os
from PIL import Image

cars_dir = r"d:\Cursor-Zakeri\arsam\arsam\public\cars"

for filename in os.listdir(cars_dir):
    if filename.endswith(".png"):
        filepath = os.path.join(cars_dir, filename)
        img = Image.open(filepath).convert("RGB")
        
        # Resize if width > 800
        if img.width > 800:
            ratio = 800 / img.width
            new_height = int(img.height * ratio)
            img = img.resize((800, new_height), Image.Resampling.LANCZOS)
        
        # Save as webp with 75% quality
        webp_name = os.path.splitext(filename)[0] + ".webp"
        webp_path = os.path.join(cars_dir, webp_name)
        img.save(webp_path, "WEBP", quality=75, optimize=True)
        
        old_size = os.path.getsize(filepath) / 1024
        new_size = os.path.getsize(webp_path) / 1024
        print(f"Compressed {filename}: {old_size:.1f} KB -> {webp_name}: {new_size:.1f} KB")
