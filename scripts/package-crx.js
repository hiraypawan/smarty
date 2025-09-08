const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Packaging Smarty Extension to .crx...');

const distDir = path.resolve(__dirname, '../dist');
const outputDir = path.resolve(__dirname, '../smarty-vercel-deploy/public');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ directory not found. Please run npm run build first.');
    process.exit(1);
}

// Create a simple zip file (Chrome will handle the .crx conversion)
try {
    // Use PowerShell to create a zip file since we're on Windows
    const zipCommand = `Compress-Archive -Path "${distDir}\\*" -DestinationPath "${outputDir}\\smarty-extension-v1.0.0.zip" -Force`;
    execSync(zipCommand, { shell: 'powershell' });
    
    // Copy the zip as .crx (for simplicity - users can rename or we'll handle conversion later)
    fs.copyFileSync(
        path.join(outputDir, 'smarty-extension-v1.0.0.zip'),
        path.join(outputDir, 'smarty-extension-v1.0.0.crx')
    );
    
    console.log('✅ Extension packaged successfully!');
    console.log(`📁 Files created:`);
    console.log(`   - smarty-extension-v1.0.0.zip`);
    console.log(`   - smarty-extension-v1.0.0.crx`);
    
} catch (error) {
    console.error('❌ Error packaging extension:', error.message);
    process.exit(1);
}
