import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const webDistDir = path.join(rootDir, 'web', 'dist');

console.log('[BUILD] Running vite build for root application...');
execSync('npm exec vite -- build --config vite.config.js', { stdio: 'inherit', cwd: rootDir });

// Ensure _redirects file exists in dist
const redirectsContent = '/* /index.html 200\n';
fs.writeFileSync(path.join(distDir, '_redirects'), redirectsContent);

// Copy dist to web/dist for server.js compatibility
console.log('[BUILD] Syncing dist to web/dist...');
if (!fs.existsSync(webDistDir)) {
  fs.mkdirSync(webDistDir, { recursive: true });
}
fs.cpSync(distDir, webDistDir, { recursive: true });

console.log('[BUILD] Full build completed successfully with SPA _redirects!');
