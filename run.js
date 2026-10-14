import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[supervisor] Alabama Bot Supervisor active. 24/7 auto-restart is armed.');

let isStopping = false;

function launch() {
  if (isStopping) return;

  const child = spawn(process.execPath, [join(__dirname, 'src', 'index.js')], {
    stdio: 'inherit',
    env: process.env,
    cwd: __dirname
  });

  child.on('exit', (code, signal) => {
    if (isStopping) {
      console.log('[supervisor] Bot stopped gracefully.');
      return;
    }
    console.warn(`[supervisor] Bot exited (code=${code}, signal=${signal}). Restarting immediately in 1.5s...`);
    setTimeout(launch, 1500);
  });

  child.on('error', (err) => {
    if (isStopping) return;
    console.error('[supervisor] Spawn error:', err.message);
    setTimeout(launch, 3000);
  });
}

process.on('SIGINT', () => {
  isStopping = true;
  process.exit(0);
});

process.on('SIGTERM', () => {
  isStopping = true;
  process.exit(0);
});

launch();
