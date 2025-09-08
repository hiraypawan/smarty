const fs = require('fs');
const path = require('path');

// Create a simple PNG icon using base64 data
// This creates a simple colored square with white text
function createSimplePngIcon(size, text = 'S') {
    // This is a minimal PNG data structure for a simple icon
    // For a real extension, you'd want to use proper graphics software or canvas
    
    // Create SVG first, then we'll save it as a text-based icon
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" rx="${size * 0.15}" ry="${size * 0.15}" fill="url(#grad)" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="${size * 0.6}" font-weight="bold" fill="white">
            ${size >= 32 ? '🧠' : text}
        </text>
    </svg>`;
    
    return svg;
}

// Ensure icons directory exists
const iconsDir = path.join(__dirname, 'dist', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate all required icon sizes as SVG files (Chrome supports SVG icons)
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
    const iconContent = createSimplePngIcon(size);
    const filename = `icon${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, iconContent);
    console.log(`Created ${filename}`);
});

console.log('All icons created successfully!');
console.log('Note: These are SVG icons. For better Chrome extension compatibility,');
console.log('convert them to PNG using an online converter or graphics software.');
