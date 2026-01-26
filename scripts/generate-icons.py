#!/usr/bin/env python3
"""
Generate app icons for GainsView PWA
Crops the original bull logo image to a square and resizes
"""

from PIL import Image
import os

# Paths
PROJECT_ROOT = "/Users/averycoffey/Desktop/website/options-calculator"
LOGO_PATH = f"{PROJECT_ROOT}/public/images/bull-logo.png"
ICONS_DIR = f"{PROJECT_ROOT}/public/icons"
PUBLIC_DIR = f"{PROJECT_ROOT}/public"

# Icon sizes to generate
ICON_SIZES = {
    # PWA icons
    "icon-512x512.png": 512,
    "icon-384x384.png": 384,
    "icon-192x192.png": 192,
    "icon-144x144.png": 144,
    "icon-152x152.png": 152,
    "icon-128x128.png": 128,
    "icon-96x96.png": 96,
    "icon-72x72.png": 72,
    # Favicons
    "favicon-32x32.png": 32,
    "favicon-16x16.png": 16,
}

# Apple Touch Icons
APPLE_ICONS = {
    "apple-touch-icon.png": 180,
    "apple-touch-icon-180x180.png": 180,
    "apple-touch-icon-152x152.png": 152,
    "apple-touch-icon-120x120.png": 120,
}

def crop_to_square_centered(img, zoom_factor=1.0):
    """
    Crop image to a square, centered on the bull logo.
    zoom_factor > 1 means zoom in more (bull fills more of the frame)
    """
    width, height = img.size

    # The original image is 1536x1024 (wider than tall)
    # We want a square crop, using the height as the base
    # Then we can zoom in by reducing the crop size

    base_size = min(width, height)
    crop_size = int(base_size / zoom_factor)

    # Center the crop on the image
    # The bull is roughly centered in the original image
    center_x = width // 2
    center_y = height // 2

    # Calculate crop box
    left = center_x - crop_size // 2
    top = center_y - crop_size // 2
    right = left + crop_size
    bottom = top + crop_size

    # Make sure we don't go out of bounds
    if left < 0:
        left = 0
        right = crop_size
    if top < 0:
        top = 0
        bottom = crop_size
    if right > width:
        right = width
        left = width - crop_size
    if bottom > height:
        bottom = height
        top = height - crop_size

    return img.crop((left, top, right, bottom))

def create_icon(cropped_img, size, output_path):
    """Resize the cropped square image to the target size"""
    resized = cropped_img.resize((size, size), Image.Resampling.LANCZOS)

    # Convert to RGB (no alpha needed, solid background from original)
    if resized.mode == 'RGBA':
        # Create RGB image with the same content
        rgb_img = Image.new('RGB', resized.size, (26, 20, 16))  # fallback bg color
        rgb_img.paste(resized, mask=resized.split()[3] if len(resized.split()) > 3 else None)
        resized = rgb_img

    resized.save(output_path, "PNG", optimize=True)
    print(f"Created: {output_path} ({size}x{size})")

def create_favicon_ico(cropped_img, output_path):
    """Create multi-size favicon.ico"""
    sizes = [16, 32, 48]
    images = []

    for size in sizes:
        resized = cropped_img.resize((size, size), Image.Resampling.LANCZOS)
        if resized.mode == 'RGBA':
            rgb_img = Image.new('RGB', resized.size, (26, 20, 16))
            rgb_img.paste(resized, mask=resized.split()[3] if len(resized.split()) > 3 else None)
            resized = rgb_img
        images.append(resized)

    images[0].save(
        output_path,
        format="ICO",
        sizes=[(size, size) for size in sizes],
        append_images=images[1:]
    )
    print(f"Created: {output_path} (multi-size favicon)")

def main():
    # Ensure directories exist
    os.makedirs(ICONS_DIR, exist_ok=True)

    # Load the source logo
    print(f"Loading logo from: {LOGO_PATH}")
    logo = Image.open(LOGO_PATH)
    print(f"Original size: {logo.size}")

    # Convert to RGBA if needed
    if logo.mode != 'RGBA':
        logo = logo.convert('RGBA')

    # Crop to square, zoomed in on the bull (1.15 = 15% zoom)
    # This makes the bull fill about 80% of the icon
    print("\nCropping to square, centered on bull...")
    cropped = crop_to_square_centered(logo, zoom_factor=1.15)
    print(f"Cropped size: {cropped.size}")

    # Generate PWA icons in /public/icons/
    print("\n--- Generating PWA Icons ---")
    for filename, size in ICON_SIZES.items():
        output_path = os.path.join(ICONS_DIR, filename)
        create_icon(cropped, size, output_path)

    # Generate maskable icon (same as regular, OS handles safe zone)
    create_icon(cropped, 512, os.path.join(ICONS_DIR, "maskable-512x512.png"))
    print(f"Created: {os.path.join(ICONS_DIR, 'maskable-512x512.png')} (512x512 maskable)")

    # Generate Apple Touch Icons in /public/
    print("\n--- Generating Apple Touch Icons ---")
    for filename, size in APPLE_ICONS.items():
        output_path = os.path.join(PUBLIC_DIR, filename)
        create_icon(cropped, size, output_path)

    # Also copy to icons folder
    create_icon(cropped, 180, os.path.join(ICONS_DIR, "apple-touch-icon.png"))

    # Generate favicon.ico in /public/
    print("\n--- Generating Favicon ---")
    create_favicon_ico(cropped, os.path.join(PUBLIC_DIR, "favicon.ico"))

    # Copy favicon PNGs to public root
    create_icon(cropped, 32, os.path.join(PUBLIC_DIR, "favicon-32x32.png"))
    create_icon(cropped, 16, os.path.join(PUBLIC_DIR, "favicon-16x16.png"))

    print("\n--- All icons generated successfully! ---")
    print("\nThe bull logo has been cropped to a square and fills the icon.")
    print("iOS/Android will round the corners automatically.")

if __name__ == "__main__":
    main()
