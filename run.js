import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[supervisor] Alabama Bot Supervisor active. 24/7 auto-restart is armed.');

let isStopping = false;
let currentChild = null;

function launch() {
  if (isStopping) return;

  currentChild = spawn(process.execPath, [join(__dirname, 'src', 'index.js')], {
    stdio: 'inherit',
    env: process.env,
    cwd: __dirname
  });

  currentChild.on('exit', (code, signal) => {
    currentChild = null;
    if (isStopping) {
      console.log('[supervisor] Bot stopped gracefully.');
      return;
    }
    console.warn(`[supervisor] Bot exited (code=${code}, signal=${signal}). Restarting immediately in 1s...`);
    setTimeout(launch, 1000);
  });

  currentChild.on('error', (err) => {
    currentChild = null;
    if (isStopping) return;
    console.error('[supervisor] Spawn error:', err.message);
    setTimeout(launch, 2000);
  });
}

function stopSupervisor(signal) {
  isStopping = true;
  if (currentChild) {
    try {
      currentChild.kill(signal);
    } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', () => stopSupervisor('SIGINT'));
process.on('SIGTERM', () => stopSupervisor('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('[supervisor] Uncaught Exception kept alive:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[supervisor] Unhandled Rejection kept alive:', reason);
});

launch();
