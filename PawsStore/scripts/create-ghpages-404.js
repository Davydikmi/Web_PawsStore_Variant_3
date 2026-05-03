const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'dist', 'PawsStore', 'browser');
const indexFile = path.join(buildDir, 'index.html');
const notFoundFile = path.join(buildDir, '404.html');

if (!fs.existsSync(indexFile)) {
  console.error('Error: index.html not found. Run npm run build:ghpages first.');
  process.exit(1);
}

fs.copyFileSync(indexFile, notFoundFile);
console.log('Created 404.html fallback for GitHub Pages.');
