const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Auto-deploying Smarty Extension...');

try {
  // Read current version from manifest
  const manifestPath = path.resolve(__dirname, '../public/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const currentVersion = manifest.version;
  
  console.log(`📋 Current version: ${currentVersion}`);
  
  // Build the extension
  console.log('🔧 Building extension...');
  execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  
  // Package the extension
  console.log('📦 Packaging extension...');
  execSync('npm run package', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  
  // Update deployment files
  const deployDir = path.resolve(__dirname, '../smarty-vercel-deploy');
  const sourceDir = path.resolve(__dirname, '..');
  
  // Copy new extension files
  const crxSource = path.join(sourceDir, `smarty-vercel-deploy/public/smarty-extension-v${currentVersion}.crx`);
  const crxDest = path.join(deployDir, `smarty-extension-v${currentVersion}.crx`);
  const zipSource = path.join(sourceDir, `smarty-vercel-deploy/public/smarty-extension-v${currentVersion}.zip`);
  const zipDest = path.join(deployDir, `smarty-extension-v${currentVersion}.zip`);
  
  if (fs.existsSync(crxSource)) {
    fs.copyFileSync(crxSource, crxDest);
    console.log(`✅ Copied ${path.basename(crxSource)}`);
  }
  
  if (fs.existsSync(zipSource)) {
    fs.copyFileSync(zipSource, zipDest);
    console.log(`✅ Copied ${path.basename(zipSource)}`);
  }
  
  // Update update.xml
  const updateXmlPath = path.join(deployDir, 'update.xml');
  const newUpdateXml = `<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="jkdmbibpjjneabedgeflbcjffkjdpdfa">
    <updatecheck 
      codebase="https://mysmarty.vercel.app/smarty-extension-v${currentVersion}.crx" 
      version="${currentVersion}" />
  </app>
</gupdate>`;
  
  fs.writeFileSync(updateXmlPath, newUpdateXml);
  console.log('📝 Updated update.xml');
  
  // Git operations in deploy directory
  console.log('📤 Committing to deployment directory...');
  process.chdir(deployDir);
  
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "Auto-deploy: Update to version ${currentVersion}"`, { stdio: 'inherit' });
    console.log('✅ Committed changes');
    
    // Try to push if remote exists
    try {
      execSync('git push', { stdio: 'inherit' });
      console.log('✅ Pushed to GitHub - Vercel will auto-deploy');
    } catch (pushError) {
      console.log('⚠️ Could not push to GitHub (remote might not be set up)');
      console.log('💡 Deploy manually with: cd smarty-vercel-deploy && npx vercel --prod');
    }
  } catch (gitError) {
    console.log('⚠️ Git operations failed:', gitError.message);
  }
  
  console.log('🎉 Auto-deployment completed!');
  console.log('🌐 Your extension will be live at: https://mysmarty.vercel.app');
  
} catch (error) {
  console.error('❌ Auto-deployment failed:', error.message);
  process.exit(1);
}
