#!/usr/bin/env python3
"""
Generate app icons for GainsView PWA
Creates icons with dark brown background and centered bull logo
"""

from PIL import Image, ImageDraw, ImageFilter
import os

# Paths
PROJECT_ROOT = "/Users/averycoffey/Desktop/website/options-calculator"
LOGO_PATH = f"{PROJECT_ROOT}/public/images/bull-logo.png"
ICONS_DIR = f"{PROJECT_ROOT}/public/icons"
PUBLIC_DIR = f"{PROJECT_ROOT}/public"

# Colors
BACKGROUND_COLOR = (26, 20, 16)  # #1A1410 - dark brown
GLOW_COLOR = (212, 175, 55, 80)  # Gold with alpha for subtle glow

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

# Apple Touch Icons (need specific names in public root)
APPLE_ICONS = {
    "apple-touch-icon.png": 180,
    "apple-touch-icon-180x180.png": 180,
    "apple-touch-icon-152x152.png": 152,
    "apple-touch-icon-120x120.png": 120,
}

def create_icon(logo_img, size, output_path, with_glow=True):
    """Create an icon at the specified size with background and logo"""
    # Create new image with background color
    icon = Image.new("RGBA", (size, size), BACKGROUND_COLOR)

    # Calculate logo size (75% of icon size for prominence)
    logo_size = int(size * 0.75)

    # Add subtle gold glow behind logo for larger icons
    if with_glow and size >= 64:
        # Create glow layer
        glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)

        # Draw a gold circle for glow effect
        glow_radius = int(logo_size * 0.6)
        center = size // 2
        glow_draw.ellipse(
            [center - glow_radius, center - glow_radius,
             center + glow_radius, center + glow_radius],
            fill=GLOW_COLOR
        )

        # Blur the glow
        glow = glow.filter(ImageFilter.GaussianBlur(radius=size // 10))

        # Composite glow onto icon
        icon = Image.alpha_composite(icon, glow)

    # Resize logo maintaining aspect ratio
    logo_resized = logo_img.copy()
    logo_resized.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)

    # Calculate position to center the logo
    logo_width, logo_height = logo_resized.size
    x = (size - logo_width) // 2
    y = (size - logo_height) // 2

    # Paste logo onto icon (using logo as mask for transparency)
    icon.paste(logo_resized, (x, y), logo_resized)

    # Convert to RGB for PNG output (no alpha needed for final icon)
    final = Image.new("RGB", (size, size), BACKGROUND_COLOR)
    final.paste(icon, (0, 0), icon)

    # Save
    final.save(output_path, "PNG", optimize=True)
    print(f"Created: {output_path} ({size}x{size})")

def create_maskable_icon(logo_img, size, output_path):
    """Create maskable icon with safe zone padding"""
    # Maskable icons need 10% padding on all sides (safe zone)
    # Logo should only fill the center 80%
    icon = Image.new("RGBA", (size, size), BACKGROUND_COLOR)

    # Calculate logo size (60% of icon for maskable safe zone)
    logo_size = int(size * 0.60)

    # Add glow
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_radius = int(logo_size * 0.55)
    center = size // 2
    glow_draw.ellipse(
        [center - glow_radius, center - glow_radius,
         center + glow_radius, center + glow_radius],
        fill=GLOW_COLOR
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size // 12))
    icon = Image.alpha_composite(icon, glow)

    # Resize logo
    logo_resized = logo_img.copy()
    logo_resized.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)

    # Center the logo
    logo_width, logo_height = logo_resized.size
    x = (size - logo_width) // 2
    y = (size - logo_height) // 2

    icon.paste(logo_resized, (x, y), logo_resized)

    # Convert to RGB
    final = Image.new("RGB", (size, size), BACKGROUND_COLOR)
    final.paste(icon, (0, 0), icon)

    final.save(output_path, "PNG", optimize=True)
    print(f"Created maskable: {output_path} ({size}x{size})")

def create_favicon_ico(logo_img, output_path):
    """Create multi-size favicon.ico"""
    sizes = [(16, 16), (32, 32), (48, 48)]
    images = []

    for size in sizes:
        icon = Image.new("RGBA", size, BACKGROUND_COLOR)
        logo_size = int(size[0] * 0.80)  # 80% for small icons

        logo_resized = logo_img.copy()
        logo_resized.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)

        logo_width, logo_height = logo_resized.size
        x = (size[0] - logo_width) // 2
        y = (size[1] - logo_height) // 2

        icon.paste(logo_resized, (x, y), logo_resized)

        # Convert to RGB
        final = Image.new("RGB", size, BACKGROUND_COLOR)
        final.paste(icon, (0, 0), icon)
        images.append(final)

    # Save as ICO with multiple sizes
    images[0].save(
        output_path,
        format="ICO",
        sizes=[(img.width, img.height) for img in images],
        append_images=images[1:]
    )
    print(f"Created: {output_path} (multi-size favicon)")

def main():
    # Ensure directories exist
    os.makedirs(ICONS_DIR, exist_ok=True)

    # Load the source logo
    print(f"Loading logo from: {LOGO_PATH}")
    logo = Image.open(LOGO_PATH).convert("RGBA")
    print(f"Logo size: {logo.size}")

    # Generate PWA icons in /public/icons/
    print("\n--- Generating PWA Icons ---")
    for filename, size in ICON_SIZES.items():
        output_path = os.path.join(ICONS_DIR, filename)
        create_icon(logo, size, output_path)

    # Generate maskable icon
    create_maskable_icon(logo, 512, os.path.join(ICONS_DIR, "maskable-512x512.png"))

    # Generate Apple Touch Icons in /public/
    print("\n--- Generating Apple Touch Icons ---")
    for filename, size in APPLE_ICONS.items():
        output_path = os.path.join(PUBLIC_DIR, filename)
        create_icon(logo, size, output_path)

    # Also copy main apple-touch-icon to icons folder for manifest
    create_icon(logo, 180, os.path.join(ICONS_DIR, "apple-touch-icon.png"))

    # Generate favicon.ico in /public/
    print("\n--- Generating Favicon ---")
    create_favicon_ico(logo, os.path.join(PUBLIC_DIR, "favicon.ico"))

    # Copy favicon PNGs to public root as well
    create_icon(logo, 32, os.path.join(PUBLIC_DIR, "favicon-32x32.png"), with_glow=False)
    create_icon(logo, 16, os.path.join(PUBLIC_DIR, "favicon-16x16.png"), with_glow=False)

    print("\n--- All icons generated successfully! ---")

if __name__ == "__main__":
    main()
