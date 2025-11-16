#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Pre-build script for GitHub Pages deployment');

// Ensure public/data directory exists
const publicDataDir = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
  console.log('📁 Created public/data directory');
}

// Copy data files to public directory for GitHub Pages
const dataDir = path.join(__dirname, '..', 'data');
const filesToCopy = [
  'data.csv',
  'IV_PotentialDecline.csv',
  'stock_data.csv',
  'probability_history.csv',
  'recovery_report_data.csv',
  'validation_report_data.csv',
  'last_updated.json'
];

let copiedFiles = 0;
filesToCopy.forEach(filename => {
  const sourcePath = path.join(dataDir, filename);
  const destPath = path.join(publicDataDir, filename);
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${filename} to public/data/`);
      copiedFiles++;
    } catch (error) {
      console.error(`❌ Failed to copy ${filename}:`, error.message);
    }
  } else {
    console.warn(`⚠️  ${filename} not found in data directory`);
  }
});

// Set environment variable for GitHub Pages
if (process.env.GITHUB_PAGES === 'true' || process.env.CI === 'true') {
  console.log('🔧 GitHub Pages deployment detected');
  process.env.NODE_ENV = 'production';
}

console.log(`📦 Pre-build complete: ${copiedFiles}/${filesToCopy.length} files copied`);

// Validate critical files exist
const criticalFiles = ['data.csv', 'IV_PotentialDecline.csv'];
const missingCritical = criticalFiles.filter(file => 
  !fs.existsSync(path.join(publicDataDir, file))
);

if (missingCritical.length > 0) {
  console.error('❌ Critical data files missing:', missingCritical);
  process.exit(1);
} else {
  console.log('✅ All critical data files are ready for deployment');
}