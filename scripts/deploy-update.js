const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Deploying Smarty Extension Update...');

// Read current version from manifest
const manifestPath = path.resolve(__dirname, '../public/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const currentVersion = manifest.version;

console.log(`📋 Current version: ${currentVersion}`);

// Build the extension
console.log('🔧 Building extension...');
try {
    execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// Package the extension
console.log('📦 Packaging extension...');
try {
    execSync('node scripts/package-crx.js', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
} catch (error) {
    console.error('❌ Packaging failed:', error.message);
    process.exit(1);
}

// Update the update.xml file
const updateXmlPath = path.resolve(__dirname, '../smarty-vercel-deploy/public/update.xml');
const newUpdateXml = `<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="EXTENSION_ID_WILL_BE_GENERATED">
    <updatecheck 
      codebase="https://smarty-extension.vercel.app/smarty-extension-v${currentVersion}.crx" 
      version="${currentVersion}" />
  </app>
</gupdate>`;

fs.writeFileSync(updateXmlPath, newUpdateXml);
console.log('📝 Updated update.xml with new version');

console.log('✅ Extension update ready for deployment!');
console.log('\nNext steps:');
console.log('1. cd smarty-vercel-deploy');
console.log('2. vercel --prod (if using Vercel CLI)');
console.log('3. Or commit and push to trigger auto-deployment');

console.log('\n📊 Deployment Summary:');
console.log(`   Version: ${currentVersion}`);
console.log(`   Files ready: smarty-extension-v${currentVersion}.crx`);
console.log(`   Update manifest: update.xml`);
console.log(`   Landing page: index.html`);
