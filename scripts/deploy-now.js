const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Quick Deploy: Deploying Smarty Extension Now!');

try {
  // Run auto-deploy to build and package
  console.log('1️⃣ Building and packaging...');
  execSync('npm run deploy:auto', { stdio: 'inherit' });
  
  // Move to deploy directory and deploy
  console.log('2️⃣ Deploying to Vercel...');
  const deployDir = path.resolve(__dirname, '../smarty-vercel-deploy');
  process.chdir(deployDir);
  
  // Try deployment
  try {
    execSync('npx vercel --prod --yes --force', { stdio: 'inherit' });
    console.log('✅ Successfully deployed to Vercel!');
  } catch (deployError) {
    console.log('⚠️ Vercel CLI deployment had issues, but changes are ready');
    console.log('💡 You can deploy manually from Vercel dashboard');
  }
  
  console.log('🎉 Deployment process completed!');
  console.log('🌐 Check: https://mysmarty.vercel.app');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
}
