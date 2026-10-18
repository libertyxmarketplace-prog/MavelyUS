import fs from 'fs';
import path from 'path';
import https from 'https';
import { chmodSync } from 'fs';

const binDir = path.resolve(process.cwd(), 'bin');
if (process.env.CF_PAGES || process.env.VERCEL || process.env.NETLIFY) {
  console.log('[POSTINSTALL] Cloud static build environment detected. Skipping yt-dlp binary download.');
  process.exit(0);
}
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isArm = process.arch === 'arm64';

let filename = 'yt-dlp';
let downloadName = 'yt-dlp_linux';

if (isWin) {
  filename = 'yt-dlp.exe';
  downloadName = 'yt-dlp.exe';
} else if (isMac) {
  downloadName = 'yt-dlp_macos';
} else if (isArm) {
  downloadName = 'yt-dlp_linux_aarch64';
}

const targetPath = path.join(binDir, filename);

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'LIBERTXBot/1.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed with status ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  if (fs.existsSync(targetPath)) {
    console.log(`yt-dlp standalone binary already present at ${targetPath}`);
    try {
      if (!isWin) chmodSync(targetPath, 0o755);
    } catch {}
    process.exit(0);
  }

  const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${downloadName}`;
  console.log(`Downloading standalone yt-dlp binary from ${downloadUrl}...`);
  try {
    await downloadFile(downloadUrl, targetPath);
    if (!isWin) {
      chmodSync(targetPath, 0o755);
    }
    console.log(`Successfully installed standalone yt-dlp binary to ${targetPath}`);
  } catch (err) {
    console.error('Failed to download standalone yt-dlp binary:', err.message);
  }
  process.exit(0);
}

main();
