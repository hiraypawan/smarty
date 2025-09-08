const fs = require('fs');
const path = require('path');

// Base64 data for simple colored PNG icons
// These are minimal 1x1 pixel PNGs that we'll resize conceptually

// Simple blue square PNG (1x1 pixel) - we'll make different sizes
const bluePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Create a basic PNG with gradient-like colors for different sizes
function createIconBase64(size) {
    // For simplicity, I'll create different colored squares for different sizes
    const colors = {
        16: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafgwQSCxsLwcJCG1sLG0uxEFsLwUKwsLBQsLGwUbCwsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQ',
        32: 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGYSURBVFiFtZc9SwNBEIafgwQSCxsLwcJCG1sLG0uxEFsLwUKwsLBQsLGwUbCwsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQ',
        48: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHYSURBVGiB1Zk9SwNBEIafgwQSCxsLwcJCG1sLG0uxEFsLwUKwsLBQsLGwUbCwsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQ',
        128: 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAOYSURBVHic7Zk9aBRBFIafgwQSCxsLwcJCG1sLG0uxEFsLwUKwsLBQsLGwUbCwsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQsLGwsLBQ'
    };
    
    return colors[size] || colors[16];
}

// Create simple solid color PNGs using sharp alternative
function createSimpleIcon(size, outputPath) {
    // Create a simple SVG and save it as SVG first
    const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea" />
                <stop offset="100%" style="stop-color:#764ba2" />
            </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.15)}" fill="url(#grad)" />
        <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="Arial" font-size="${Math.floor(size * 0.6)}" font-weight="bold" fill="white">
            ${size >= 32 ? '🧠' : 'S'}
        </text>
    </svg>`;
    
    fs.writeFileSync(outputPath.replace('.png', '.svg'), svg);
    
    // Also create a simple base64 PNG placeholder
    const base64Data = createIconBase64(size);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(outputPath, buffer);
}

// Ensure icons directory exists
const iconsDir = path.join(__dirname, 'dist', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate all required icon sizes
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
    const outputPath = path.join(iconsDir, `icon${size}.png`);
    try {
        createSimpleIcon(size, outputPath);
        console.log(`Created icon${size}.png and icon${size}.svg`);
    } catch (error) {
        console.error(`Failed to create icon${size}.png:`, error.message);
    }
});

console.log('Icon generation completed!');
