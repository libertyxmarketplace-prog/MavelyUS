import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
  entersState,
  demuxProbe
} from '@discordjs/voice';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

// Ensure prism-media, internal FFmpeg, and yt-dlp spawns immediately locate the bundled static binary
if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
  const ffmpegDir = path.dirname(ffmpegPath);
  if (!process.env.PATH?.includes(ffmpegDir)) {
    process.env.PATH = `${ffmpegDir}${path.delimiter}${process.env.PATH || ''}`;
  }
}

const isWin = process.platform === 'win32';
const customYtdlPath = path.resolve(process.cwd(), 'bin', isWin ? 'yt-dlp.exe' : 'yt-dlp');

export function getYtdlExecutable() {
  if (fs.existsSync(customYtdlPath)) {
    if (!isWin) {
      try { fs.chmodSync(customYtdlPath, 0o755); } catch {}
    }
    return customYtdlPath;
  }
  return isWin ? 'yt-dlp.exe' : 'yt-dlp';
}

export function initMusicEngine() {
  if (process.env.YOUTUBE_COOKIES) {
    try {
      const cookieFile = path.resolve(process.cwd(), 'cookies.txt');
      fs.writeFileSync(cookieFile, process.env.YOUTUBE_COOKIES);
      console.log('[Music] Successfully created cookies.txt from YOUTUBE_COOKIES environment variable');
    } catch (err) {
      console.warn('[Music] Error writing YOUTUBE_COOKIES:', err.message);
    }
  }

  if (fs.existsSync(customYtdlPath) && !isWin) {
    try {
      fs.chmodSync(customYtdlPath, 0o755);
      console.log(`[Music] Standalone yt-dlp binary ready at ${customYtdlPath}`);
    } catch (err) {
      console.warn('[Music] Chmod error:', err.message);
    }
  }
}

/**
 * Sanitizes YouTube links to isolate the single video ID and strip playlist / radio / mix parameters.
 * E.g.: https://www.youtube.com/watch?v=XYZ&list=RD... -> https://www.youtube.com/watch?v=XYZ
 */
export function sanitizeTrackUrl(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.has('v')) {
      const v = parsed.searchParams.get('v');
      return `https://www.youtube.com/watch?v=${v}`;
    }
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      if (id) {
        return `https://www.youtube.com/watch?v=${id}`;
      }
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

function formatDuration(sec) {
  if (!sec || typeof sec !== 'number') return 'Unknown';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Fetches YouTube video title using Noembed and Google's official public oEmbed API.
 * Noembed runs outside YouTube's network and NEVER blocks cloud / datacenter IPs.
 */
export async function getTrackTitle(url) {
  // 1. Try Noembed (hosted on Cloudflare/AWS, bypasses YouTube IP bans)
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.title) return data.title;
    }
  } catch {}

  // 2. Try official YouTube oEmbed endpoint
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (res.ok) {
      const data = await res.json();
      if (data.title) return data.title;
    }
  } catch {}

  return null;
}

function executeMetadataExtraction(target, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const bin = getYtdlExecutable();
    const cookiesPath = path.resolve(process.cwd(), 'cookies.txt');
    const cookieArgs = fs.existsSync(cookiesPath) ? ['--cookies', cookiesPath] : [];

    const args = [
      ...extraArgs,
      ...cookieArgs,
      '--dump-single-json',
      '--no-playlist',
      '--no-warnings',
      '--default-search', 'ytsearch',
      target
    ];
    const cp = spawn(bin, args);
    let stdout = '';
    let stderr = '';

    cp.stdout.on('data', chunk => {
      stdout += chunk;
    });
    cp.stderr.on('data', chunk => {
      stderr += chunk;
    });

    cp.on('error', err => {
      reject(new Error(`Failed to launch yt-dlp: ${err.message}`));
    });

    cp.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp failed (exit code ${code}): ${stderr.slice(0, 150)}`));
      }
      try {
        const json = JSON.parse(stdout);
        resolve(json);
      } catch (err) {
        reject(new Error(`Failed to parse yt-dlp output: ${err.message}`));
      }
    });
  });
}

/**
 * Extracts metadata for a track or query using multi-tiered fallback to bypass datacenter bot detection.
 */
export async function getTrackMetadata(target) {
  const isUrl = /^https?:\/\//i.test(target);
  const cleanTarget = isUrl ? sanitizeTrackUrl(target) : target;
  const isYoutube = /youtube\.com|youtu\.be/i.test(cleanTarget);

  let lastError = null;

  if (isYoutube) {
    // 1. Try direct YouTube extraction with multi-client inner-tube fallback
    try {
      const meta = await executeMetadataExtraction(cleanTarget, [
        '--extractor-args', 'youtube:player_client=android,ios,mweb;player_skip=configs'
      ]);
      return {
        title: meta.title,
        url: meta.webpage_url || meta.url || cleanTarget,
        duration: meta.duration_string || formatDuration(meta.duration),
        uploader: meta.uploader || 'YouTube'
      };
    } catch (err) {
      lastError = err;
      console.warn(`[Music] Direct YouTube extraction blocked: ${err.message}`);
    }

    // 2. Datacenter IP bypass: Retrieve title via Noembed and stream audio via SoundCloud
    console.log('[Music] Using resilient Noembed + SoundCloud fallback...');
    const trackTitle = await getTrackTitle(cleanTarget);
    const searchQuery = trackTitle ? `scsearch1:${trackTitle}` : `scsearch1:${cleanTarget}`;

    try {
      const scMeta = await executeMetadataExtraction(searchQuery);
      const item = scMeta.entries && scMeta.entries.length > 0 ? scMeta.entries[0] : scMeta;
      if (item && item.title) {
        console.log(`[Music] Successfully resolved audio stream via fallback: "${item.title}"`);
        return {
          title: trackTitle || item.title,
          url: item.webpage_url || item.url,
          duration: item.duration_string || formatDuration(item.duration),
          uploader: item.uploader || 'SoundCloud'
        };
      }
    } catch (scErr) {
      console.warn('[Music] SoundCloud fallback extraction failed:', scErr.message);
    }
  } else {
    // Search query or non-YouTube URL: try YouTube search first with android,ios,mweb
    const searchTarget = isUrl ? cleanTarget : `ytsearch1:${cleanTarget}`;
    try {
      const meta = await executeMetadataExtraction(searchTarget, [
        '--extractor-args', 'youtube:player_client=android,ios,mweb;player_skip=configs'
      ]);
      const item = meta.entries && meta.entries.length > 0 ? meta.entries[0] : meta;
      if (item && item.title) {
        return {
          title: item.title,
          url: item.webpage_url || item.url || cleanTarget,
          duration: item.duration_string || formatDuration(item.duration),
          uploader: item.uploader || 'YouTube'
        };
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Music] YouTube search failed for "${cleanTarget}":`, err.message);
      try {
        const scMeta = await executeMetadataExtraction(`scsearch1:${cleanTarget}`);
        const item = scMeta.entries && scMeta.entries.length > 0 ? scMeta.entries[0] : scMeta;
        if (item && item.title) {
          return {
            title: item.title,
            url: item.webpage_url || item.url,
            duration: item.duration_string || formatDuration(item.duration),
            uploader: item.uploader || 'SoundCloud'
          };
        }
      } catch (scErr) {
        // Fall back to lastError
      }
    }
  }

  throw lastError || new Error(`No tracks found for "${target}".`);
}

// Map storing active guild queues: guildId -> MusicQueue
const guildQueues = new Map();

class MusicQueue {
  constructor(guildId, voiceChannel, textChannel) {
    this.guildId = guildId;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.connection = null;
    this.subscription = null;
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
        maxMissedFrames: 500
      }
    });
    this.tracks = [];
    this.currentTrack = null;
    this.currentResource = null;
    this.currentProcess = null;
    this.volume = 1.0; // 0.0 to 1.0 (1.0 = 100%)
    this.isLooping = false;
    this.isPlaying = false;

    this.setupPlayerListeners();
  }

  setupPlayerListeners() {
    this.player.on('stateChange', (oldState, newState) => {
      console.log(`[Music Player ${this.guildId}] State: ${oldState.status} -> ${newState.status}`);
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.cleanupProcess();

      if (this.isLooping && this.currentTrack) {
        // Replay current track on loop
        this.playStream(this.currentTrack).catch(err => {
          console.error('[Music] Error looping track:', err);
          this.playNext();
        });
      } else {
        this.playNext();
      }
    });

    this.player.on('error', err => {
      console.error('[Music] Audio Player Error:', err.message);
      this.cleanupProcess();
      if (this.textChannel) {
        this.textChannel.send(`⚠️ Audio playback error: ${err.message}`).catch(() => null);
      }
      this.playNext();
    });
  }

  cleanupProcess() {
    if (this.currentProcess) {
      try {
        this.currentProcess.kill('SIGKILL');
      } catch {}
      this.currentProcess = null;
    }
  }

  async startStreamProcess(streamUrl) {
    const bin = getYtdlExecutable();
    const cookiesPath = path.resolve(process.cwd(), 'cookies.txt');
    const cookieArgs = fs.existsSync(cookiesPath) ? ['--cookies', cookiesPath] : [];
    const ffmpegArgs = ffmpegPath ? ['--ffmpeg-location', ffmpegPath] : [];

    console.log(`[Music] Launching stream for: ${streamUrl} using ${bin}`);
    const cp = spawn(bin, [
      streamUrl,
      '--extractor-args', 'youtube:player_client=android,ios,mweb;player_skip=configs',
      ...cookieArgs,
      ...ffmpegArgs,
      '-o', '-',
      '-q',
      '-f', 'bestaudio/best',
      '--no-playlist',
      '--no-warnings',
      '--no-part',
      '--no-cache-dir',
      '--socket-timeout', '30',
      '--retries', '10',
      '--fragment-retries', '10',
      '--file-access-retries', '5'
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.currentProcess = cp;

    cp.on('error', err => {
      console.warn('[Music] yt-dlp spawn error:', err.message);
    });

    cp.on('close', (code, signal) => {
      console.log(`[Music yt-dlp] Stream child process exited (code ${code}, signal ${signal})`);
    });

    if (cp.stderr) {
      cp.stderr.on('data', data => {
        const msg = data.toString();
        if (msg.toLowerCase().includes('error')) {
          console.warn('[Music yt-dlp stderr]:', msg.trim());
        }
      });
    }

    // Demux probe with a 15-second timeout to prevent indefinite hanging
    const probePromise = demuxProbe(cp.stdout);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Audio stream demux probe timed out after 15s')), 15000)
    );
    const probe = await Promise.race([probePromise, timeoutPromise]);
    console.log(`[Music] Demux probe resolved stream type: ${probe.type}`);

    // Ensure probed stream is resumed and not left in paused mode
    if (probe.stream.isPaused()) {
      probe.stream.resume();
    }

    const resource = createAudioResource(probe.stream, {
      inputType: probe.type,
      inlineVolume: true,
      silencePaddingFrames: 10
    });

    if (resource.volume) {
      resource.volume.setVolume(this.volume);
    }

    resource.playStream.on('error', err => {
      console.error('[Music AudioResource] Stream error:', err.message);
    });

    this.currentResource = resource;
    this.player.play(resource);
    this.isPlaying = true;
  }

  async playStream(track) {
    this.cleanupProcess();
    this.currentTrack = track;

    try {
      await this.startStreamProcess(track.url);
    } catch (err) {
      console.warn(`[Music] Playback failed for "${track.title}":`, err.message);

      // If playback failed on a YouTube URL, try SoundCloud fallback stream immediately
      if (/youtube\.com|youtu\.be/i.test(track.url)) {
        console.log(`[Music] Attempting SoundCloud audio fallback for "${track.title}"...`);
        try {
          const scMeta = await executeMetadataExtraction(`scsearch1:${track.title}`);
          const item = scMeta.entries && scMeta.entries.length > 0 ? scMeta.entries[0] : scMeta;
          if (item && (item.webpage_url || item.url)) {
            const scUrl = item.webpage_url || item.url;
            console.log(`[Music] Found SoundCloud fallback: ${scUrl}`);
            await this.startStreamProcess(scUrl);
            return;
          }
        } catch (scErr) {
          console.warn('[Music] SoundCloud stream fallback failed:', scErr.message);
        }
      }
      this.cleanupProcess();
      this.currentTrack = null;
      this.isPlaying = false;
      throw err;
    }
  }

  async playNext() {
    this.cleanupProcess();

    if (this.tracks.length === 0) {
      this.isPlaying = false;
      this.currentTrack = null;
      this.currentResource = null;
      if (this.textChannel) {
        this.textChannel.send('🎶 Queue concluded. Add more tracks with `-play <song or url>`.').catch(() => null);
      }
      return;
    }

    const nextTrack = this.tracks.shift();
    try {
      await this.playStream(nextTrack);
      if (this.textChannel) {
        this.textChannel.send(`▶️ **Now Playing:** **${nextTrack.title}** (${nextTrack.duration || 'Live/Unknown'}) • Added by <@${nextTrack.requesterId}>`).catch(() => null);
      }
    } catch (err) {
      if (this.textChannel) {
        this.textChannel.send(`⚠️ Failed to play **${nextTrack.title}**: ${err.message}`).catch(() => null);
      }
      this.playNext();
    }
  }

  setVolume(level) {
    const normalized = Math.max(1, Math.min(100, level)) / 100;
    this.volume = normalized;
    if (this.currentResource?.volume) {
      this.currentResource.volume.setVolume(this.volume);
    }
    return Math.round(this.volume * 100);
  }

  pause() {
    if (this.player.state.status === AudioPlayerStatus.Playing) {
      this.player.pause();
      return true;
    }
    return false;
  }

  resume() {
    if (this.player.state.status === AudioPlayerStatus.Paused) {
      this.player.unpause();
      return true;
    }
    return false;
  }

  async replay() {
    if (this.currentTrack) {
      await this.playStream(this.currentTrack);
      return true;
    }
    return false;
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    return this.isLooping;
  }

  destroy() {
    this.cleanupProcess();
    this.tracks = [];
    this.currentTrack = null;
    this.isPlaying = false;
    try {
      this.player.stop(true);
    } catch {}
    try {
      if (this.connection) {
        this.connection.destroy();
      }
    } catch {}
    guildQueues.delete(this.guildId);
  }
}

/**
 * Connects the bot to the specified voice channel and awaits the Ready state.
 */
export async function joinVoice(voiceChannel, textChannel) {
  if (!voiceChannel) throw new Error('Voice channel required.');

  let queue = guildQueues.get(voiceChannel.guild.id);
  if (!queue) {
    queue = new MusicQueue(voiceChannel.guild.id, voiceChannel, textChannel);
    guildQueues.set(voiceChannel.guild.id, queue);
  } else {
    queue.voiceChannel = voiceChannel;
    if (textChannel) queue.textChannel = textChannel;
  }

  let connection = queue.connection;
  const isDead = !connection ||
    connection.state.status === VoiceConnectionStatus.Destroyed ||
    connection.state.status === VoiceConnectionStatus.Disconnected;

  if (isDead) {
    try { if (connection) connection.destroy(); } catch {}
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true
    });

    queue.connection = connection;
    queue.subscription = connection.subscribe(queue.player);

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
        ]);
      } catch {
        queue.destroy();
      }
    });

    connection.on('stateChange', (oldState, newState) => {
      console.log(`[VoiceConnection ${voiceChannel.guild.id}] State: ${oldState.status} -> ${newState.status}`);
    });

    connection.on('error', err => {
      console.warn('[VoiceConnection] error:', err.message);
    });
  } else {
    if (connection.joinConfig?.channelId !== voiceChannel.id) {
      connection.rejoin({
        channelId: voiceChannel.id,
        selfDeaf: true
      });
    }
    // Always guarantee player is actively subscribed to the voice connection
    if (!queue.subscription || queue.subscription.connection !== connection) {
      queue.subscription = connection.subscribe(queue.player);
    }
  }

  try {
    if (connection.state.status !== VoiceConnectionStatus.Ready) {
      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    }
  } catch (err) {
    console.warn('[VoiceConnection] Connection not ready, auto-recovering:', err.message);
    try { connection.destroy(); } catch {}
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true
    });
    queue.connection = connection;
    queue.subscription = connection.subscribe(queue.player);
    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
  }

  return queue;
}

/**
 * Searches and queues or plays a track from a YouTube URL or keyword query.
 */
export async function playMusic(voiceChannel, textChannel, query, member) {
  if (!query || query.trim() === '') {
    throw new Error('Please specify a song name or YouTube link to play.');
  }

  const queue = await joinVoice(voiceChannel, textChannel);

  const cleanQuery = query.trim();
  const isUrl = /^https?:\/\//i.test(cleanQuery);
  const target = isUrl ? sanitizeTrackUrl(cleanQuery) : cleanQuery;

  let meta;
  try {
    meta = await getTrackMetadata(target);
  } catch (err) {
    console.error('[Music] Metadata extraction error:', err);
    throw new Error(`Could not load track: ${err.message?.slice(0, 100) || 'Unknown error'}`);
  }

  const trackInfo = {
    title: meta.title,
    url: meta.url,
    duration: meta.duration || 'Unknown',
    requesterId: member.id
  };

  const isCurrentlyPlaying = queue.isPlaying && queue.player.state.status === AudioPlayerStatus.Playing;

  if (!isCurrentlyPlaying) {
    try {
      await queue.playStream(trackInfo);
      return { status: 'playing', track: trackInfo };
    } catch (err) {
      queue.currentTrack = null;
      queue.isPlaying = false;
      throw err;
    }
  } else {
    queue.tracks.push(trackInfo);
    return { status: 'queued', track: trackInfo, position: queue.tracks.length };
  }
}

/**
 * Adjusts volume (1-100).
 */
export function setMusicVolume(guildId, level) {
  const queue = guildQueues.get(guildId);
  if (!queue) throw new Error('No active music session in this server.');
  return queue.setVolume(level);
}

/**
 * Pauses music playback.
 */
export function pauseMusic(guildId) {
  const queue = guildQueues.get(guildId);
  if (!queue) throw new Error('No active music session in this server.');
  return queue.pause();
}

/**
 * Resumes music playback.
 */
export function resumeMusic(guildId) {
  const queue = guildQueues.get(guildId);
  if (!queue) throw new Error('No active music session in this server.');
  return queue.resume();
}

/**
 * Replays current track from start.
 */
export async function replayMusic(guildId) {
  const queue = guildQueues.get(guildId);
  if (!queue) throw new Error('No active music session in this server.');
  return await queue.replay();
}

/**
 * Toggles repeat/loop mode for current track.
 */
export function toggleMusicLoop(guildId) {
  const queue = guildQueues.get(guildId);
  if (!queue) throw new Error('No active music session in this server.');
  return queue.toggleLoop();
}

/**
 * Stops playback, clears queue, and leaves voice channel.
 */
export function leaveVoice(guildId) {
  const queue = guildQueues.get(guildId);
  if (!queue) throw new Error('Bot is not currently in a voice channel.');
  queue.destroy();
  return true;
}

/**
 * Retrieves the current guild music queue state.
 */
export function getMusicQueue(guildId) {
  return guildQueues.get(guildId) || null;
}

