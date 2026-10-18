import { build } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const webDistDir = path.join(rootDir, 'web', 'dist');

async function main() {
  console.log('[BUILD] Running programmatic Vite build via JavaScript API...');
  await build({
    configFile: path.join(rootDir, 'vite.config.js'),
    root: rootDir,
  });

  // Ensure _redirects file exists in dist for Cloudflare Pages SPA routing
  const redirectsContent = '/* /index.html 200\n';
  fs.writeFileSync(path.join(distDir, '_redirects'), redirectsContent);

  // Sync dist to web/dist for server.js Express compatibility
  console.log('[BUILD] Syncing dist to web/dist...');
  if (!fs.existsSync(webDistDir)) {
    fs.mkdirSync(webDistDir, { recursive: true });
  }
  fs.cpSync(distDir, webDistDir, { recursive: true });

  console.log('[BUILD] Full build completed successfully with SPA _redirects!');
}

main().catch(err => {
  console.error('[BUILD] Build failed:', err);
  process.exit(1);
});
