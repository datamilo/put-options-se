const fs = require('fs');
const path = require('path');

// Ensure public/data directory exists
const publicDataDir = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// Copy data files to public directory
const dataDir = path.join(__dirname, '..', 'data');
const filesToCopy = ['data.csv', 'IV_PotentialDecline.csv', 'stock_data.csv', 'probability_history.csv'];

filesToCopy.forEach(filename => {
  const sourcePath = path.join(dataDir, filename);
  const destPath = path.join(publicDataDir, filename);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${filename} to public/data/`);
  } else {
    console.warn(`⚠️  ${filename} not found in data directory`);
  }
});

console.log('📦 Data files copied to public directory for GitHub Pages');