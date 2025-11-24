# PWA Icon Generation Guide

## Required Icons

The Progressive Web App (PWA) configuration requires the following icon files in the `/public` directory:

### Icon Sizes Needed:
- `icon-72x72.png` (72×72 pixels)
- `icon-96x96.png` (96×96 pixels)
- `icon-128x128.png` (128×128 pixels)
- `icon-144x144.png` (144×144 pixels)
- `icon-152x152.png` (152×152 pixels)
- `icon-192x192.png` (192×192 pixels)
- `icon-384x384.png` (384×384 pixels)
- `icon-512x512.png` (512×512 pixels)
- `favicon.ico` (16×16, 32×32, 48×48 multi-resolution)

### Screenshots Needed:
- `screenshot-mobile.png` (540×720 pixels) - Mobile app screenshot
- `screenshot-desktop.png` (1280×720 pixels) - Desktop app screenshot

## Design Guidelines

### Logo/Icon Design:
1. **Brand Colors**: Use Ideal Smoke Supply's primary green (#10b981) and complementary colors
2. **Background**: Light cream background (#f5f1e8) or transparent
3. **Content**:
   - Simple, recognizable logo/symbol
   - Should work at all sizes (avoid fine details)
   - Consider a stylized smoke/vapor icon or letters "ISS"
4. **Safe Area**: Keep important content within 80% of the canvas (icons may be masked on some devices)

### Icon Requirements:
- **Format**: PNG with transparency (where appropriate)
- **Purpose**: Suitable for both `any` and `maskable` purposes
- **Maskable Icons**: Content should be within the safe zone (centered 80% of canvas)

## How to Generate Icons

### Option 1: Using Online Tools
1. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
   - Upload a single 512×512 source image
   - Automatically generates all required sizes

2. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - Generates all icon sizes and favicon
   - Provides Android, iOS, and Windows optimized versions

### Option 2: Using Design Tools
1. **Figma/Adobe Illustrator**:
   - Create master icon at 512×512 pixels
   - Export at all required sizes
   - Ensure crisp edges at smaller sizes

2. **ImageMagick** (Command Line):
   ```bash
   # Generate all sizes from source.png
   convert source.png -resize 72x72 public/icon-72x72.png
   convert source.png -resize 96x96 public/icon-96x96.png
   convert source.png -resize 128x128 public/icon-128x128.png
   convert source.png -resize 144x144 public/icon-144x144.png
   convert source.png -resize 152x152 public/icon-152x152.png
   convert source.png -resize 192x192 public/icon-192x192.png
   convert source.png -resize 384x384 public/icon-384x384.png
   convert source.png -resize 512x512 public/icon-512x512.png
   ```

### Option 3: Using Sharp (Node.js)
Create a script `generate-icons.js`:
```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = 'source-icon.png';

sizes.forEach(size => {
  sharp(sourceImage)
    .resize(size, size)
    .toFile(`public/icon-${size}x${size}.png`, (err) => {
      if (err) console.error(`Error generating ${size}x${size}:`, err);
      else console.log(`Generated icon-${size}x${size}.png`);
    });
});
```

Run with: `node generate-icons.js`

## Screenshots

### Mobile Screenshot (540×720):
- Show the shop page with products
- Include header with logo and navigation
- Show 2-3 product cards

### Desktop Screenshot (1280×720):
- Show the main landing page or shop
- Include full navigation and featured products
- Demonstrate responsive layout

## Favicon Generation

For the `favicon.ico`, you need a multi-resolution ICO file containing:
- 16×16 pixels (browser tabs)
- 32×32 pixels (taskbar)
- 48×48 pixels (desktop shortcuts)

Use tools like:
- https://www.favicon-generator.org/
- https://favicon.io/

## Current Status

✅ PWA manifest.json configured
✅ Service Worker implemented
✅ Meta tags added to index.html
⏳ **Icons need to be generated** (this file)
⏳ **Screenshots need to be created**

## Installation

Once icons are generated and placed in `/public`:
1. Test locally by running the dev server
2. Open Chrome DevTools > Application > Manifest to verify all icons load
3. Use Lighthouse PWA audit to check for issues
4. Deploy and test installation on mobile devices

## Branding Notes

**Ideal Smoke Supply** is a premium vaping and smoking products retailer. The icon should convey:
- Professionalism and quality
- Modern, clean aesthetic
- Vaping/smoking theme (subtle smoke, vapor wisps, or abstract representation)
- Trust and reliability

Consider incorporating:
- Stylized smoke/vapor clouds
- Modern geometric shapes
- Gradient effects with the primary green color
- Letter-based logo (ISS monogram)
