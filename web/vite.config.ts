import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const webRoot = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = path.resolve(webRoot, '..');
const backend = process.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default defineConfig({
  root: webRoot,
  envDir: projectRoot,
  publicDir: path.join(projectRoot, 'assets'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.join(webRoot, 'src') }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': backend,
      '/auth': backend
    }
  },
  build: {
    outDir: path.join(webRoot, 'dist'),
    emptyOutDir: true
  }
});