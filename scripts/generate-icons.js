const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = path.join(__dirname, '../public/images/logo.png');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 20, g: 18, b: 16, alpha: 1 } // #141210
      })
      .png()
      .toFile(outputPath);

    console.log(`Created: icon-${size}x${size}.png`);
  }

  // Create maskable icon with padding (safe zone is 80% of total area)
  const maskableSize = 512;
  const padding = Math.floor(maskableSize * 0.1); // 10% padding on each side
  const innerSize = maskableSize - (padding * 2);

  await sharp(inputPath)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 20, g: 18, b: 16, alpha: 1 }
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 20, g: 18, b: 16, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'maskable-512x512.png'));

  console.log('Created: maskable-512x512.png');

  // Create Apple touch icon
  await sharp(inputPath)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 20, g: 18, b: 16, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));

  console.log('Created: apple-touch-icon.png');

  // Create favicon
  await sharp(inputPath)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 20, g: 18, b: 16, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'favicon-32x32.png'));

  console.log('Created: favicon-32x32.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
