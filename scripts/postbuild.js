#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Post-build script for GitHub Pages deployment');

// Check if this is a GitHub Pages build
const isGitHubPages = process.env.GITHUB_PAGES === 'true' || process.env.CI === 'true';

if (!isGitHubPages) {
  console.log('ℹ️  Not a GitHub Pages build, skipping post-build steps');
  process.exit(0);
}

const distDir = path.join(__dirname, '..', 'dist');

// Verify dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory not found');
  process.exit(1);
}

// Create .nojekyll file to prevent Jekyll processing
const nojekyllPath = path.join(distDir, '.nojekyll');
fs.writeFileSync(nojekyllPath, '');
console.log('✅ Created .nojekyll file');

// Copy 404.html to dist for SPA routing
const source404 = path.join(__dirname, '..', 'public', '404.html');
const dest404 = path.join(distDir, '404.html');

if (fs.existsSync(source404)) {
  fs.copyFileSync(source404, dest404);
  console.log('✅ Copied 404.html to dist');
} else {
  console.warn('⚠️  404.html not found in public directory');
}

// Verify that index.html exists and has the correct base path
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check if the index.html has the correct asset paths
  const hasCorrectBasePath = indexContent.includes('/put-options-se/assets/');
  
  if (hasCorrectBasePath) {
    console.log('✅ index.html has correct base path for assets');
  } else {
    console.error('❌ index.html does not have correct base path for assets');
    console.log('Content preview:', indexContent.substring(0, 500));
  }
} else {
  console.error('❌ index.html not found in dist directory');
  process.exit(1);
}

console.log('🎉 Post-build script completed successfully');