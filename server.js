import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { createDashboardRouter, createDiscordCallbackRouter } from './web/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;

// Railway and most hosts sit behind a proxy: needed for secure cookies and real client IPs.
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', createDashboardRouter());
app.use('/auth/discord', createDiscordCallbackRouter());

// /api/health, /api/status, Discord login and the dashboard settings all live in web/api.js.

// ─── SERVE FRONTEND STATIC FILES IN PRODUCTION ──────────────────────────────
const candidatePaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'web', 'dist'),
  path.join(__dirname, 'WEBSITE', 'artifacts', 'testaa-preview', 'dist', 'public'),
  path.join(__dirname, 'zip-repl-1', 'artifacts', 'testaa-preview', 'dist', 'public')
];

const webDistPath = candidatePaths.find(p => fs.existsSync(p));
console.log('[MAVELY WEB] Serving frontend from:', webDistPath || 'NOT FOUND');

if (webDistPath) {
  app.use(express.static(webDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      return res.sendFile(path.join(webDistPath, 'index.html'));
    }
    next();
  });
}

// Last line of defence: any thrown error becomes a clean response, never a crash.
app.use((err, req, res, _next) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request body.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  console.error('[MAVELY WEB API] Unhandled route error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Something went wrong on our side. Try again.' });
});

const server = app.listen(PORT, () => {
  console.log(`[ERLC.US WEB API] Dashboard backend listening on http://localhost:${PORT}`);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[ERLC.US WEB API] Port ${PORT} is already in use by another instance. Web dashboard active on previous instance.`);
  } else {
    console.error('[ERLC.US WEB API] Server error:', err);
  }
});

export default app;
