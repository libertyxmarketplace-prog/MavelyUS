import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  EmbedBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder
} from 'discord.js';
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  StreamType,
  VoiceConnectionStatus
} from '@discordjs/voice';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import ytdlp from 'yt-dlp-exec';
import YouTubeSr from 'youtube-sr';

const YouTube = YouTubeSr.default || YouTubeSr;

// Ensure ffmpeg binary is in process environment
if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

/**
 * Strips all local filesystem paths, Windows usernames, drive letters, and process command dumps
 * to prevent any internal system information from leaking into Discord channels.
 */
export function sanitizePublicMessage(input) {
  if (!input) return '';
  let str = String(input);

  // 1. Redact Windows drive paths (e.g. C:\Users\..., D:/..., etc.)
  str = str.replace(/[A-Za-z]:[\\/][^\s'"`<>]+/gi, '[system-path]');

  // 2. Redact Unix/Linux paths (e.g. /home/..., /root/..., /app/...)
  str = str.replace(/\/(?:home|root|app|var|usr|etc)[\\/][^\s'"`<>]+/gi, '[system-path]');

  // 3. Redact node_modules or binary paths
  str = str.replace(/node_modules[\\/][^\s'"`<>]+/gi, '[internal-module]');
  str = str.replace(/yt-dlp(?:\.exe)?[^\s'"`<>]*/gi, 'yt-dlp');
  str = str.replace(/ffmpeg(?:\.exe)?[^\s'"`<>]*/gi, 'ffmpeg');

  // 4. Redact any local usernames or sensitive keywords
  str = str.replace(/\bsulma\b/gi, 'user');
  str = str.replace(/\bsulmanelmiyo\b/gi, 'user');

  // 5. Redact CLI failure prefix dumps: "Command failed with exit code X: ..."
  str = str.replace(/Command failed with exit code \d+:[^\n]+/gi, 'Process execution failed');

  // 6. Clean up command line flag dumps: --dump-single-json --no-warnings ...
  str = str.replace(/--[a-z0-9-]+(?:\s+[^\s]+)?/gi, '');

  return str.trim();
}

/**
 * Returns a clean, user-friendly error message for music streaming failures,
 * completely hiding all internal paths, stack traces, and CLI arguments.
 */
export function cleanMusicError(err) {
  if (!err) return 'Audio source error';
  const raw = String(err.stderr || err.message || err);

  if (/This video is not available|unavailable/i.test(raw)) {
    return 'This video is unavailable or region-restricted';
  }
  if (/Private video/i.test(raw)) {
    return 'This video is private';
  }
  if (/confirm your age|age-restricted/i.test(raw)) {
    return 'This video is age-restricted and requires verification';
  }
  if (/copyright/i.test(raw)) {
    return 'Blocked due to copyright restrictions';
  }
  if (/ETIMEDOUT|ECONNRESET|socket hang up|network/i.test(raw)) {
    return 'Network connection timeout';
  }
  if (/format.*not available|requested format not available/i.test(raw)) {
    return 'Requested audio format is not available';
  }
  if (/All available sources for this track are unavailable/i.test(raw)) {
    return 'All sources for this track are unavailable or region-restricted';
  }

  // Generic fallback without any internal leak
  return 'Could not retrieve playable audio stream';
}

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const sec = Math.floor(seconds);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remSec = sec % 60;
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${remSec < 10 ? '0' : ''}${remSec}`;
  }
  return `${mins}:${remSec < 10 ? '0' : ''}${remSec}`;
}

/**
 * Create a sleek visual progress bar: 🔘▬▬▬▬▬▬▬▬▬
 */
export function createProgressBar(current, total, barLength = 12) {
  if (!total || total <= 0) return '🔴 LIVE';
  const progress = Math.min(Math.max(current / total, 0), 1);
  const dotIndex = Math.min(Math.floor(progress * barLength), barLength - 1);
  let bar = '';
  for (let i = 0; i < barLength; i++) {
    if (i === dotIndex) {
      bar += '🔘';
    } else {
      bar += '▬';
    }
  }
  return `${bar} **${formatDuration(current)} / ${formatDuration(total)}**`;
}

/**
 * Track structure:
 * {
 *   title: string,
 *   url: string,
 *   thumbnail: string,
 *   duration: number, // in seconds
 *   artist: string,
 *   requester: User
 * }
 */

// Active guild music managers (Map<guildId, GuildMusicManager>)
export const musicManagers = new Map();

export class GuildMusicManager {
  constructor(guildId, client) {
    this.guildId = guildId;
    this.client = client;
    this.queue = [];
    this.currentTrack = null;
    this.previousTrack = null;
    this.player = createAudioPlayer();
    this.connection = null;
    this.textChannelId = null;
    this.voiceChannelId = null;
    this.loopMode = 'off'; // 'off' | 'song' | 'queue'
    this.volume = 80;
    this.currentResource = null;
    this.currentFfmpeg = null;
    this.nowPlayingMessage = null;
    this.idleTimer = null;
    this.playbackStartTs = 0;
    this.pausedTs = 0;
    this.totalPausedDuration = 0;
    this.progressInterval = null;

    this._setupPlayerListeners();
  }

  _setupPlayerListeners() {
    this.player.on(AudioPlayerStatus.Playing, () => {
      this._clearIdleTimer();
      if (!this.playbackStartTs) {
        this.playbackStartTs = Date.now();
      }
      this.totalPausedDuration = 0;
      this.pausedTs = 0;
      this.startProgressInterval();
      if (this.nowPlayingMessage) {
        this.nowPlayingMessage.edit(this.buildNowPlayingComponents()).catch(() => null);
      }
    });

    this.player.on(AudioPlayerStatus.Paused, () => {
      this.pausedTs = Date.now();
      this.clearProgressInterval();
      if (this.nowPlayingMessage) {
        this.nowPlayingMessage.edit(this.buildNowPlayingComponents()).catch(() => null);
      }
    });

    this.player.on(AudioPlayerStatus.AutoPaused, () => {
      this.pausedTs = Date.now();
      this.clearProgressInterval();
    });

    this.player.on('stateChange', (oldState, newState) => {
      if (oldState.status === AudioPlayerStatus.Paused && newState.status === AudioPlayerStatus.Playing) {
        if (this.pausedTs > 0) {
          this.totalPausedDuration += Date.now() - this.pausedTs;
          this.pausedTs = 0;
        }
        this.startProgressInterval();
        if (this.nowPlayingMessage) {
          this.nowPlayingMessage.edit(this.buildNowPlayingComponents()).catch(() => null);
        }
      }
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.clearProgressInterval();
      this._cleanupCurrentProcess();
      this.handleSongFinish();
    });

    this.player.on('error', (error) => {
      console.error(`[Music] Player error in guild ${this.guildId}:`, cleanMusicError(error));
      this.clearProgressInterval();
      this._cleanupCurrentProcess();
      this.notifyTextChannel(`⚠️ Audio stream glitch (${cleanMusicError(error)}). Skipping to next track...`);
      this.handleSongFinish();
    });
  }

  _cleanupCurrentProcess() {
    this.clearProgressInterval();
    if (this.currentFfmpeg) {
      try {
        this.currentFfmpeg.kill('SIGKILL');
      } catch {}
      this.currentFfmpeg = null;
    }
    this.currentResource = null;
  }

  startProgressInterval() {
    this.clearProgressInterval();
    this.progressInterval = setInterval(async () => {
      if (!this.currentTrack || !this.nowPlayingMessage) {
        this.clearProgressInterval();
        return;
      }
      if (this.player.state.status !== AudioPlayerStatus.Playing) {
        return;
      }
      try {
        const payload = this.buildNowPlayingComponents();
        await this.nowPlayingMessage.edit(payload);
      } catch (err) {
        if (err.code === 10008 || err.code === 50083 || err.code === 404) {
          this.clearProgressInterval();
          this.nowPlayingMessage = null;
        }
      }
    }, 5000);
  }

  clearProgressInterval() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  _startIdleTimer() {
    this._clearIdleTimer();
    // Auto leave after 3 minutes of inactivity
    this.idleTimer = setTimeout(() => {
      if (this.queue.length === 0 && !this.currentTrack) {
        this.notifyTextChannel('👋 Leaving voice channel due to inactivity.');
        this.destroy();
      }
    }, 180000);
  }

  _clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  getCurrentPlaybackSeconds() {
    if (!this.playbackStartTs) return 0;
    const now = this.player.state.status === AudioPlayerStatus.Paused ? this.pausedTs : Date.now();
    const elapsedMs = now - this.playbackStartTs - this.totalPausedDuration;
    return Math.max(0, Math.floor(elapsedMs / 1000));
  }

  async connect(voiceChannel, textChannel) {
    this.textChannelId = textChannel.id;
    this.voiceChannelId = voiceChannel.id;

    if (!this.connection || this.connection.state.status === VoiceConnectionStatus.Destroyed) {
      this.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: this.guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true
      });

      this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000)
          ]);
        } catch {
          this.destroy();
        }
      });

      this.connection.subscribe(this.player);
    }
  }

  async enqueue(track, textChannel) {
    if (textChannel) this.textChannelId = textChannel.id;
    this.queue.push(track);
    if (this.player.state.status === AudioPlayerStatus.Idle && !this.currentTrack) {
      await this.playNext();
    }
  }

  async _streamTrack(track) {
    this._clearIdleTimer();
    this.currentTrack = track;
    this.previousTrack = track;
    this.playbackStartTs = 0;
    this.pausedTs = 0;
    this.totalPausedDuration = 0;

    let audioUrl = null;

    // 1. Try primary track URL
    try {
      const directStreamInfo = await ytdlp(track.url, {
        dumpSingleJson: true,
        noWarnings: true,
        preferFreeFormats: true,
        noPlaylist: true,
        format: 'bestaudio/best'
      });
      audioUrl = directStreamInfo?.url;
    } catch (primaryErr) {
      console.warn(`[Music] Primary URL failed for "${track.title}":`, cleanMusicError(primaryErr));
    }

    // 2. If primary failed (e.g. video unavailable, region blocked), auto-fallback search
    if (!audioUrl) {
      console.log(`[Music] Attempting fallback stream search for "${track.title}"...`);
      try {
        const searchQuery = `ytsearch5:${track.artist && track.artist !== 'Unknown Artist' ? `${track.artist} - ` : ''}${track.title} audio`;
        const searchRes = await ytdlp(searchQuery, {
          dumpSingleJson: true,
          noWarnings: true,
          noPlaylist: true,
          flatPlaylist: true
        });

        const candidates = searchRes?.entries || [];
        for (const cand of candidates) {
          if (!cand?.id) continue;
          const candUrl = `https://www.youtube.com/watch?v=${cand.id}`;
          if (candUrl === track.url) continue;
          try {
            const candInfo = await ytdlp(candUrl, {
              dumpSingleJson: true,
              noWarnings: true,
              preferFreeFormats: true,
              noPlaylist: true,
              format: 'bestaudio/best'
            });
            if (candInfo?.url) {
              audioUrl = candInfo.url;
              track.url = candUrl;
              if (cand.title) track.title = cand.title;
              console.log(`[Music] Fallback search succeeded with alternative: ${candUrl}`);
              break;
            }
          } catch {}
        }
      } catch (searchErr) {
        console.warn('[Music] Fallback search failed:', cleanMusicError(searchErr));
      }
    }

    if (!audioUrl) {
      throw new Error('All available sources for this track are unavailable or region-restricted.');
    }

    this._cleanupCurrentProcess();

    // Launch FFmpeg to transcode to raw PCM
    const ffmpeg = spawn(ffmpegPath, [
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5',
      '-i', audioUrl,
      '-analyzeduration', '0',
      '-loglevel', '0',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1'
    ]);

    this.currentFfmpeg = ffmpeg;

    ffmpeg.on('error', (err) => {
      console.error('[Music] FFmpeg process error:', cleanMusicError(err));
    });

    const resource = createAudioResource(ffmpeg.stdout, {
      inputType: StreamType.Raw,
      inlineVolume: true
    });

    if (resource.volume) {
      resource.volume.setVolumeLogarithmic(this.volume / 100);
    }

    this.currentResource = resource;
    this.player.play(resource);

    // Post or update Now Playing Card
    await this.sendNowPlayingCard();
  }

  async playNext() {
    this.clearProgressInterval();
    if (this.queue.length === 0) {
      this.currentTrack = null;
      this._startIdleTimer();
      return;
    }

    const track = this.queue.shift();
    try {
      await this._streamTrack(track);
    } catch (err) {
      console.error(`[Music] Error playing track "${track.title}":`, cleanMusicError(err));
      this.notifyTextChannel(`❌ Could not stream **${track.title}**: ${cleanMusicError(err)}. Moving to next track...`);
      this.playNext();
    }
  }

  handleSongFinish() {
    this.clearProgressInterval();
    if (this.currentTrack) {
      this.previousTrack = this.currentTrack;
      if (this.loopMode === 'song') {
        // Re-enqueue at the beginning of the queue
        this.queue.unshift(this.currentTrack);
      } else if (this.loopMode === 'queue') {
        // Re-enqueue at the end of the queue
        this.queue.push(this.currentTrack);
      } else {
        // Track finished and no loop: clear currentTrack completely
        this.currentTrack = null;
      }
    }
    this.playNext();
  }

  async replay() {
    const track = this.currentTrack || this.previousTrack;
    if (!track) return false;

    this.clearProgressInterval();
    this._cleanupCurrentProcess();
    this.currentTrack = track;
    this.previousTrack = track;
    this.playbackStartTs = 0;
    this.pausedTs = 0;
    this.totalPausedDuration = 0;

    try {
      await this._streamTrack(track);
      return true;
    } catch (err) {
      console.error(`[Music] Replay error for "${track.title}":`, cleanMusicError(err));
      this.notifyTextChannel(`❌ Could not replay **${track.title}**: ${cleanMusicError(err)}.`);
      return false;
    }
  }

  skip() {
    if (!this.currentTrack) return false;
    this.clearProgressInterval();
    this.player.stop();
    return true;
  }

  pause() {
    if (this.player.state.status === AudioPlayerStatus.Playing) {
      this.player.pause();
      this.clearProgressInterval();
      if (this.nowPlayingMessage) {
        this.nowPlayingMessage.edit(this.buildNowPlayingComponents()).catch(() => null);
      }
      return true;
    }
    return false;
  }

  resume() {
    if (this.player.state.status === AudioPlayerStatus.Paused || this.player.state.status === AudioPlayerStatus.AutoPaused) {
      this.player.unpause();
      this.startProgressInterval();
      if (this.nowPlayingMessage) {
        this.nowPlayingMessage.edit(this.buildNowPlayingComponents()).catch(() => null);
      }
      return true;
    }
    return false;
  }

  stop() {
    this.clearProgressInterval();
    this.queue = [];
    this.currentTrack = null;
    this.loopMode = 'off';
    this._cleanupCurrentProcess();
    this.player.stop();
    this.destroy();
  }

  setVolume(vol) {
    const num = Math.min(Math.max(vol, 1), 100);
    this.volume = num;
    if (this.currentResource && this.currentResource.volume) {
      this.currentResource.volume.setVolumeLogarithmic(num / 100);
    }
    return num;
  }

  cycleLoopMode() {
    if (this.loopMode === 'off') {
      this.loopMode = 'song';
    } else if (this.loopMode === 'song') {
      this.loopMode = 'queue';
    } else {
      this.loopMode = 'off';
    }
    return this.loopMode;
  }

  destroy() {
    this.clearProgressInterval();
    this._clearIdleTimer();
    this._cleanupCurrentProcess();
    this.queue = [];
    this.currentTrack = null;
    if (this.connection) {
      try {
        this.connection.destroy();
      } catch {}
      this.connection = null;
    }
    musicManagers.delete(this.guildId);
  }

  async notifyTextChannel(content) {
    if (!this.textChannelId) return;
    const sanitized = sanitizePublicMessage(content);
    try {
      const ch = await this.client.channels.fetch(this.textChannelId).catch(() => null);
      if (ch && ch.isTextBased()) {
        const msg = await ch.send({ content: sanitized }).catch(() => null);
        if (msg) {
          setTimeout(() => msg.delete().catch(() => null), 15000);
        }
      }
    } catch {}
  }

  buildNowPlayingComponents() {
    if (!this.currentTrack) {
      const emptyCard = new ContainerBuilder().setAccentColor(0x2b2d31);
      emptyCard.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## Music Player\n> No track is currently playing. Use **-play <song>** or **/play** to start!')
      );
      return { components: [emptyCard.toJSON()], flags: MessageFlags.IsComponentsV2 };
    }

    const track = this.currentTrack;
    const currentSec = this.getCurrentPlaybackSeconds();
    const totalSec = track.duration || 0;
    const progressBar = createProgressBar(currentSec, totalSec);

    const isPlaying = this.player.state.status === AudioPlayerStatus.Playing;

    let loopText = 'Off';
    if (this.loopMode === 'song') loopText = 'Single Track';
    if (this.loopMode === 'queue') loopText = 'Entire Queue';

    const card = new ContainerBuilder().setAccentColor(0x2b2d31);

    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## Now Playing\n*Alabama State Roleplay • High-Fidelity Audio*')
    );

    card.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    if (track.thumbnail) {
      const trackSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### [${track.title}](${track.url})\n` +
            `> **Artist:** **${track.artist || 'Unknown'}**\n` +
            `> **Requested By:** <@${track.requester?.id || track.requester}>`
          )
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(track.thumbnail));
      card.addSectionComponents(trackSection);
    } else {
      card.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### [${track.title}](${track.url})\n` +
          `> **Artist:** **${track.artist || 'Unknown'}**\n` +
          `> **Requested By:** <@${track.requester?.id || track.requester}>`
        )
      );
    }

    card.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> **Playback:** ${progressBar}\n` +
        `> **Status:** **${isPlaying ? 'Playing' : 'Paused'}** • **Volume:** **${this.volume}%** • **Loop:** **${loopText}** • **Up Next:** **${this.queue.length} track${this.queue.length === 1 ? '' : 's'}**`
      )
    );

    // Interactive button controls
    const playPauseBtn = new ButtonBuilder()
      .setCustomId(`music_pause_${this.guildId}`)
      .setLabel(isPlaying ? 'Pause' : 'Resume')
      .setEmoji(isPlaying ? '⏸️' : '▶️')
      .setStyle(isPlaying ? ButtonStyle.Secondary : ButtonStyle.Success);

    const replayBtn = new ButtonBuilder()
      .setCustomId(`music_replay_${this.guildId}`)
      .setLabel('Replay')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary);

    const skipBtn = new ButtonBuilder()
      .setCustomId(`music_skip_${this.guildId}`)
      .setLabel('Skip')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary);

    const loopBtn = new ButtonBuilder()
      .setCustomId(`music_loop_${this.guildId}`)
      .setLabel(this.loopMode === 'song' ? 'Loop Song' : this.loopMode === 'queue' ? 'Loop Queue' : 'Loop Off')
      .setEmoji(this.loopMode === 'song' ? '🔂' : this.loopMode === 'queue' ? '🔁' : '🔄')
      .setStyle(this.loopMode !== 'off' ? ButtonStyle.Primary : ButtonStyle.Secondary);

    const stopBtn = new ButtonBuilder()
      .setCustomId(`music_stop_${this.guildId}`)
      .setLabel('Stop')
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger);

    const controlRow = new ActionRowBuilder().addComponents(playPauseBtn, replayBtn, skipBtn, loopBtn, stopBtn);
    card.addActionRowComponents(controlRow);

    return { components: [card.toJSON()], flags: MessageFlags.IsComponentsV2 };
  }

  async sendNowPlayingCard() {
    if (!this.textChannelId) return;
    try {
      this.clearProgressInterval();
      const ch = await this.client.channels.fetch(this.textChannelId).catch(() => null);
      if (!ch || !ch.isTextBased()) return;

      const payload = this.buildNowPlayingComponents();
      if (this.nowPlayingMessage) {
        try {
          await this.nowPlayingMessage.edit(payload);
          if (this.player.state.status === AudioPlayerStatus.Playing) {
            this.startProgressInterval();
          }
          return;
        } catch {}
      }

      const sent = await ch.send(payload).catch(() => null);
      this.nowPlayingMessage = sent;

      if (this.player.state.status === AudioPlayerStatus.Playing) {
        this.startProgressInterval();
      }
    } catch {}
  }
}

/**
 * Get or create the MusicManager for a guild
 */
export function getOrCreateMusicManager(guildId, client) {
  let manager = musicManagers.get(guildId);
  if (!manager) {
    manager = new GuildMusicManager(guildId, client);
    musicManagers.set(guildId, manager);
  }
  return manager;
}

/**
 * Search and resolve a song or playlist from a query or URL using yt-dlp
 */
export async function resolveTracks(query, requester) {
  const trimmed = query.trim();
  const isUrl = /^https?:\/\//i.test(trimmed);

  // 1. Fast path: For plain text searches, use youtube-sr (resolves in ~1s, returns 1 accurate track)
  if (!isUrl) {
    try {
      const searchRes = await YouTube.search(trimmed, { limit: 1 });
      if (searchRes && searchRes.length > 0) {
        const video = searchRes[0];
        return [
          {
            title: video.title || 'Unknown Title',
            url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
            thumbnail: video.thumbnail?.url || '',
            duration: video.duration ? Math.floor(video.duration / 1000) : 0,
            artist: video.channel?.name || 'Unknown Artist',
            requester
          }
        ];
      }
    } catch (searchErr) {
      console.warn('[Music] YouTube.search fallback:', searchErr.message);
    }
  }

  // 2. URL or search fallback
  let target = trimmed;
  let isExplicitPlaylist = false;

  if (isUrl) {
    isExplicitPlaylist = /youtube\.com\/playlist\?list=/i.test(target);
    // If it's a YouTube watch URL with mix/radio (&list=RD...), clean it so only the single video is played!
    if (!isExplicitPlaylist) {
      if (/youtube\.com\/watch/i.test(target)) {
        try {
          const parsed = new URL(target);
          const v = parsed.searchParams.get('v');
          if (v) target = `https://www.youtube.com/watch?v=${v}`;
        } catch {}
      } else if (/youtu\.be\/([a-zA-Z0-9_-]+)/i.test(target)) {
        const match = target.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
        if (match) target = `https://www.youtube.com/watch?v=${match[1]}`;
      }
    }
  } else {
    target = `ytsearch1:${trimmed}`;
  }

  try {
    const raw = await ytdlp(target, {
      dumpSingleJson: true,
      noWarnings: true,
      noPlaylist: !isExplicitPlaylist,
      flatPlaylist: isExplicitPlaylist,
      defaultSearch: 'ytsearch'
    });

    if (!raw) return [];

    // Playlist resolution (only for explicit playlists)
    if (isExplicitPlaylist && (raw._type === 'playlist' || Array.isArray(raw.entries))) {
      const tracks = [];
      for (const entry of (raw.entries || [])) {
        if (!entry) continue;
        tracks.push({
          title: entry.title || 'Unknown Title',
          url: entry.url?.startsWith('http') ? entry.url : `https://www.youtube.com/watch?v=${entry.id}`,
          thumbnail: entry.thumbnails?.[0]?.url || entry.thumbnail || '',
          duration: entry.duration || 0,
          artist: entry.uploader || entry.channel || 'Unknown Artist',
          requester
        });
      }
      return tracks;
    }

    // Single video resolution
    const item = Array.isArray(raw.entries) && raw.entries.length > 0 ? raw.entries[0] : raw;
    return [
      {
        title: item.title || 'Unknown Title',
        url: item.webpage_url || item.url || (item.id ? `https://www.youtube.com/watch?v=${item.id}` : target),
        thumbnail: item.thumbnail || item.thumbnails?.[0]?.url || '',
        duration: item.duration || 0,
        artist: item.uploader || item.channel || 'Unknown Artist',
        requester
      }
    ];
  } catch (err) {
    console.error('[Music] resolveTracks error:', err.message);
    return [];
  }
}

/**
 * Prefix & Slash Command Handlers
 */

export async function handlePlayCommand(interactionOrMessage, queryText) {
  const isSlash = typeof interactionOrMessage.reply === 'function' && interactionOrMessage.isChatInputCommand?.();
  const guild = interactionOrMessage.guild;
  const member = interactionOrMessage.member;
  const channel = interactionOrMessage.channel;
  const user = isSlash ? interactionOrMessage.user : interactionOrMessage.author;

  if (!guild || !member) {
    const replyContent = '❌ This command can only be used in a server.';
    if (isSlash) return interactionOrMessage.reply({ content: replyContent, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(replyContent);
  }

  // Check user voice state
  const voiceChannel = member.voice?.channel;
  if (!voiceChannel) {
    const replyContent = '❌ You must join a voice channel first before using music commands!';
    if (isSlash) return interactionOrMessage.reply({ content: replyContent, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(replyContent);
  }

  if (!queryText || !queryText.trim()) {
    const replyContent = '❌ Please provide a song name, YouTube URL, or search query. Example: `-play despacito` or `-play https://youtube.com/...`';
    if (isSlash) return interactionOrMessage.reply({ content: replyContent, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(replyContent);
  }

  // Immediately acknowledge to dismiss "thinking..." right away
  let initialMsg = null;
  if (isSlash) {
    await interactionOrMessage.deferReply();
    await interactionOrMessage.editReply({ content: '🔍 **Searching and connecting...**' }).catch(() => null);
  } else {
    initialMsg = await interactionOrMessage.reply('🔍 **Searching for music...**').catch(() => null);
  }

  const manager = getOrCreateMusicManager(guild.id, interactionOrMessage.client);

  try {
    await manager.connect(voiceChannel, channel);
  } catch (connErr) {
    const errMsg = `❌ Failed to connect to voice channel: ${connErr.message}`;
    if (isSlash) return interactionOrMessage.editReply({ content: errMsg }).catch(() => null);
    if (initialMsg) return initialMsg.edit({ content: errMsg }).catch(() => null);
    return channel.send(errMsg).catch(() => null);
  }

  const tracks = await resolveTracks(queryText, user);
  if (!tracks.length) {
    const notFoundMsg = `❌ No results found for: **${queryText.slice(0, 100)}**`;
    if (isSlash) return interactionOrMessage.editReply({ content: notFoundMsg }).catch(() => null);
    if (initialMsg) return initialMsg.edit({ content: notFoundMsg }).catch(() => null);
    return channel.send(notFoundMsg).catch(() => null);
  }

  if (tracks.length === 1) {
    const track = tracks[0];
    const isFirstTrack = manager.queue.length === 0 && !manager.currentTrack;
    await manager.enqueue(track, channel);

    const card = new ContainerBuilder().setAccentColor(0x2b2d31);
    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## Added to Queue\n` +
        `> **Track:** [${track.title}](${track.url})\n` +
        `> **Duration:** **${formatDuration(track.duration)}** • **Requested By:** <@${user.id}>\n` +
        `> **Position in Queue:** **${isFirstTrack ? 'Playing Now' : `#${manager.queue.indexOf(track) + 1}`}**`
      )
    );

    const payload = { content: null, components: [card.toJSON()], flags: MessageFlags.IsComponentsV2 };
    if (isSlash) {
      await interactionOrMessage.editReply(payload).catch(() => null);
    } else {
      if (initialMsg) await initialMsg.delete().catch(() => null);
      const m = await channel.send(payload).catch(() => null);
      if (m) setTimeout(() => m.delete().catch(() => null), 20000);
    }
  } else {
    // Playlist
    for (const t of tracks) {
      await manager.enqueue(t, channel);
    }

    const card = new ContainerBuilder().setAccentColor(0x2b2d31);
    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 📑 Playlist Loaded\n` +
        `> Added **${tracks.length} tracks** to the queue!\n` +
        `> **Requested By:** <@${user.id}> • **First Up:** [${tracks[0].title}](${tracks[0].url})`
      )
    );

    const payload = { content: null, components: [card.toJSON()], flags: MessageFlags.IsComponentsV2 };
    if (isSlash) {
      await interactionOrMessage.editReply(payload).catch(() => null);
    } else {
      if (initialMsg) await initialMsg.delete().catch(() => null);
      const m = await channel.send(payload).catch(() => null);
      if (m) setTimeout(() => m.delete().catch(() => null), 25000);
    }
  }
}

export async function handleStopCommand(interactionOrMessage) {
  const isSlash = typeof interactionOrMessage.reply === 'function' && interactionOrMessage.isChatInputCommand?.();
  const guild = interactionOrMessage.guild;
  const manager = musicManagers.get(guild?.id);

  if (!manager || (!manager.currentTrack && manager.queue.length === 0)) {
    const msg = '❌ Nothing is currently playing in this server.';
    if (isSlash) return interactionOrMessage.reply({ content: msg, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(msg);
  }

  manager.stop();

  const card = new ContainerBuilder().setAccentColor(0xed4245);
  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## ⏹️ Music Stopped\n> Cleared the queue and disconnected from the voice channel.')
  );
  const payload = { components: [card.toJSON()], flags: MessageFlags.IsComponentsV2 };

  if (isSlash) return interactionOrMessage.reply(payload);
  const m = await interactionOrMessage.channel.send(payload).catch(() => null);
  if (m) setTimeout(() => m.delete().catch(() => null), 15000);
}

export async function handleLoopCommand(interactionOrMessage, modeArg) {
  const isSlash = typeof interactionOrMessage.reply === 'function' && interactionOrMessage.isChatInputCommand?.();
  const guild = interactionOrMessage.guild;
  const manager = musicManagers.get(guild?.id);

  if (!manager || !manager.currentTrack) {
    const msg = '❌ Nothing is currently playing to loop.';
    if (isSlash) return interactionOrMessage.reply({ content: msg, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(msg);
  }

  let newMode;
  if (modeArg && ['off', 'song', 'queue', 'track'].includes(modeArg.toLowerCase())) {
    newMode = modeArg.toLowerCase() === 'track' ? 'song' : modeArg.toLowerCase();
    manager.loopMode = newMode;
  } else {
    newMode = manager.cycleLoopMode();
  }

  let label = 'Off';
  let emoji = '⏹️';
  if (newMode === 'song') {
    label = 'Looping Current Song';
    emoji = '🔂';
  } else if (newMode === 'queue') {
    label = 'Looping Entire Queue';
    emoji = '🔁';
  }

  const card = new ContainerBuilder().setAccentColor(0x5865f2);
  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## ${emoji} Loop Mode Updated\n> Loop mode set to: **${label}**`)
  );
  const payload = { components: [card.toJSON()], flags: MessageFlags.IsComponentsV2 };

  if (isSlash) return interactionOrMessage.reply(payload);
  const m = await interactionOrMessage.channel.send(payload).catch(() => null);
  if (m) setTimeout(() => m.delete().catch(() => null), 15000);
}

export async function handleReplayCommand(interactionOrMessage) {
  const isSlash = typeof interactionOrMessage.reply === 'function' && interactionOrMessage.isChatInputCommand?.();
  const guild = interactionOrMessage.guild;
  const manager = musicManagers.get(guild?.id);

  const track = manager?.currentTrack || manager?.previousTrack;
  if (!manager || !track) {
    const msg = '❌ There is no active or recently played song to replay.';
    if (isSlash) return interactionOrMessage.reply({ content: msg, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(msg);
  }

  await manager.replay();

  const card = new ContainerBuilder().setAccentColor(0x5865f2);
  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## 🔄 Replaying Track\n> Restarting **[${track.title}](${track.url})** from the beginning!`)
  );
  const payload = { components: [card.toJSON()], flags: MessageFlags.IsComponentsV2 };

  if (isSlash) return interactionOrMessage.reply(payload);
  const m = await interactionOrMessage.channel.send(payload).catch(() => null);
  if (m) setTimeout(() => m.delete().catch(() => null), 15000);
}

export async function handleSkipCommand(interactionOrMessage) {
  const isSlash = typeof interactionOrMessage.reply === 'function' && interactionOrMessage.isChatInputCommand?.();
  const guild = interactionOrMessage.guild;
  const manager = musicManagers.get(guild?.id);

  if (!manager || !manager.currentTrack) {
    const msg = '❌ There is no active song playing to skip.';
    if (isSlash) return interactionOrMessage.reply({ content: msg, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(msg);
  }

  const skipped = manager.currentTrack;
  manager.skip();

  const card = new ContainerBuilder().setAccentColor(0x5865f2);
  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## ⏭️ Track Skipped\n> Skipped **[${skipped.title}](${skipped.url})**.`)
  );
  const payload = { components: [card.toJSON()], flags: MessageFlags.IsComponentsV2 };

  if (isSlash) return interactionOrMessage.reply(payload);
  const m = await interactionOrMessage.channel.send(payload).catch(() => null);
  if (m) setTimeout(() => m.delete().catch(() => null), 15000);
}

export async function handlePauseCommand(interactionOrMessage) {
  const isSlash = typeof interactionOrMessage.reply === 'function' && interactionOrMessage.isChatInputCommand?.();
  const guild = interactionOrMessage.guild;
  const manager = musicManagers.get(guild?.id);

  if (!manager || !manager.currentTrack) {
    const msg = '❌ Nothing is currently playing to pause.';
    if (isSlash) return interactionOrMessage.reply({ content: msg, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(msg);
  }

  const ok = manager.pause();
  const card = new ContainerBuilder().setAccentColor(0xfee75c);
  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      ok ? '## ⏸️ Playback Paused\n> Use `-resume` or `/resume` to continue playing.' : 'ℹ️ Playback is already paused.'
    )
  );
  const payload = { components: [card.toJSON()], flags: MessageFlags.IsComponentsV2 };

  if (isSlash) return interactionOrMessage.reply(payload);
  const m = await interactionOrMessage.channel.send(payload).catch(() => null);
  if (m) setTimeout(() => m.delete().catch(() => null), 15000);
}

export async function handleResumeCommand(interactionOrMessage) {
  const isSlash = typeof interactionOrMessage.reply === 'function' && interactionOrMessage.isChatInputCommand?.();
  const guild = interactionOrMessage.guild;
  const manager = musicManagers.get(guild?.id);

  if (!manager || !manager.currentTrack) {
    const msg = '❌ Nothing is currently paused to resume.';
    if (isSlash) return interactionOrMessage.reply({ content: msg, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(msg);
  }

  const ok = manager.resume();
  const card = new ContainerBuilder().setAccentColor(0x57f287);
  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      ok ? '## ▶️ Playback Resumed\n> Enjoy the music!' : 'ℹ️ Playback is already active.'
    )
  );
  const payload = { components: [card.toJSON()], flags: MessageFlags.IsComponentsV2 };

  if (isSlash) return interactionOrMessage.reply(payload);
  const m = await interactionOrMessage.channel.send(payload).catch(() => null);
  if (m) setTimeout(() => m.delete().catch(() => null), 15000);
}

export async function handleNowPlayingCommand(interactionOrMessage) {
  const isSlash = typeof interactionOrMessage.reply === 'function' && interactionOrMessage.isChatInputCommand?.();
  const guild = interactionOrMessage.guild;
  const manager = musicManagers.get(guild?.id);

  if (!manager || !manager.currentTrack) {
    const msg = '❌ Nothing is currently playing in this server.';
    if (isSlash) return interactionOrMessage.reply({ content: msg, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(msg);
  }

  const payload = manager.buildNowPlayingComponents();
  if (isSlash) return interactionOrMessage.reply(payload);
  const m = await interactionOrMessage.channel.send(payload).catch(() => null);
  if (m) setTimeout(() => m.delete().catch(() => null), 30000);
}

export async function handleQueueCommand(interactionOrMessage) {
  const isSlash = typeof interactionOrMessage.reply === 'function' && interactionOrMessage.isChatInputCommand?.();
  const guild = interactionOrMessage.guild;
  const manager = musicManagers.get(guild?.id);

  if (!manager || (!manager.currentTrack && manager.queue.length === 0)) {
    const msg = '❌ The music queue is currently empty.';
    if (isSlash) return interactionOrMessage.reply({ content: msg, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(msg);
  }

  const card = new ContainerBuilder().setAccentColor(0x5865f2);

  let desc = '## Music Queue\n';
  if (manager.currentTrack) {
    desc += `**Now Playing:** [${manager.currentTrack.title}](${manager.currentTrack.url}) **${formatDuration(manager.currentTrack.duration)}** (<@${manager.currentTrack.requester?.id || manager.currentTrack.requester}>)\n\n`;
  }

  if (manager.queue.length === 0) {
    desc += '> *No upcoming songs in the queue. Add more with **-play <song>**!*\n';
  } else {
    desc += `### Upcoming Tracks (${manager.queue.length})\n`;
    const slice = manager.queue.slice(0, 10);
    slice.forEach((t, i) => {
      desc += `> **${i + 1}.** [${t.title}](${t.url}) **${formatDuration(t.duration)}** • <@${t.requester?.id || t.requester}>\n`;
    });
    if (manager.queue.length > 10) {
      desc += `> *...and ${manager.queue.length - 10} more track(s)*\n`;
    }
  }

  const totalSec = (manager.currentTrack?.duration || 0) + manager.queue.reduce((acc, t) => acc + (t.duration || 0), 0);
  desc += `\n> **Total Duration:** **${formatDuration(totalSec)}** • **Loop:** **${manager.loopMode}** • **Volume:** **${manager.volume}%**`;

  card.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
  const payload = { components: [card.toJSON()], flags: MessageFlags.IsComponentsV2 };

  if (isSlash) return interactionOrMessage.reply(payload);
  const m = await interactionOrMessage.channel.send(payload).catch(() => null);
  if (m) setTimeout(() => m.delete().catch(() => null), 30000);
}

export async function handleVolumeCommand(interactionOrMessage, volArg) {
  const isSlash = typeof interactionOrMessage.reply === 'function' && interactionOrMessage.isChatInputCommand?.();
  const guild = interactionOrMessage.guild;
  const manager = musicManagers.get(guild?.id);

  if (!manager) {
    const msg = '❌ Nothing is currently playing in this server.';
    if (isSlash) return interactionOrMessage.reply({ content: msg, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(msg);
  }

  const num = parseInt(volArg, 10);
  if (isNaN(num) || num < 1 || num > 100) {
    const msg = '❌ Volume level must be a number between **1** and **100**.';
    if (isSlash) return interactionOrMessage.reply({ content: msg, flags: MessageFlags.Ephemeral });
    return interactionOrMessage.reply(msg);
  }

  const setVol = manager.setVolume(num);
  const card = new ContainerBuilder().setAccentColor(0x5865f2);
  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## 🔊 Volume Adjusted\n> Playback volume set to: **${setVol}%**`)
  );
  const payload = { components: [card.toJSON()], flags: MessageFlags.IsComponentsV2 };

  if (isSlash) return interactionOrMessage.reply(payload);
  const m = await interactionOrMessage.channel.send(payload).catch(() => null);
  if (m) setTimeout(() => m.delete().catch(() => null), 15000);
}

/**
 * Handle button clicks from Now Playing cards
 */
export async function handleMusicButtonInteraction(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith('music_')) return false;

  const parts = interaction.customId.split('_');
  const action = parts[1];
  const guildId = parts[2];

  const manager = musicManagers.get(guildId);
  if (!manager) {
    await interaction.reply({ content: '❌ No active music session for this server.', flags: MessageFlags.Ephemeral });
    return true;
  }

  // Check if user is in a voice channel
  const member = interaction.member;
  if (!member?.voice?.channel) {
    await interaction.reply({ content: '❌ You must be in a voice channel to control music playback.', flags: MessageFlags.Ephemeral });
    return true;
  }

  if (action === 'pause') {
    if (manager.player.state.status === AudioPlayerStatus.Playing) {
      manager.pause();
    } else {
      manager.resume();
    }
  } else if (action === 'skip') {
    manager.skip();
  } else if (action === 'loop') {
    manager.cycleLoopMode();
  } else if (action === 'replay') {
    const ok = await manager.replay();
    if (!ok) {
      await interaction.reply({ content: '❌ No active or recently played track to replay.', flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }
  } else if (action === 'stop') {
    manager.stop();
    await interaction.update({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xed4245)
          .addTextDisplayComponents(new TextDisplayBuilder().setContent('## ⏹️ Music Stopped\n> Playback was stopped via card controls.'))
          .toJSON()
      ],
      flags: MessageFlags.IsComponentsV2
    });
    return true;
  }

  // Update card
  const payload = manager.buildNowPlayingComponents();
  await interaction.update(payload).catch(() => null);
  return true;
}
