import { AttachmentBuilder } from 'discord.js';

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');
}

/**
 * Fetches all messages in a channel, handling pagination.
 */
async function fetchAllMessages(channel, maxLimit = 1000) {
  let allMessages = [];
  let lastId = null;

  while (allMessages.length < maxLimit) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const messages = await channel.messages.fetch(options);
    if (!messages || messages.size === 0) break;

    allMessages.push(...messages.values());
    lastId = messages.last().id;

    if (messages.size < 100) break;
  }

  // Reverse so they are in chronological order
  return allMessages.reverse();
}

/**
 * Generates an HTML transcript buffer for a ticket channel.
 */
export async function generateTranscript(channel, ticketData, closedByUser, closeReason) {
  const messages = await fetchAllMessages(channel);

  const openedDate = ticketData?.createdAt ? new Date(ticketData.createdAt).toUTCString() : 'Unknown';
  const closedDate = new Date().toUTCString();
  const authorTag = ticketData?.authorTag || 'Unknown User';
  const authorId = ticketData?.authorId || 'Unknown ID';
  const categoryLabel = ticketData?.categoryLabel || 'Support';
  const closerTag = closedByUser?.tag || closedByUser?.username || 'System';

  const messageRows = messages.map(msg => {
    const author = msg.author;
    const avatarUrl = author.displayAvatarURL({ extension: 'png', size: 64 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';
    const timestamp = new Date(msg.createdTimestamp).toLocaleString();
    const isBot = author.bot ? '<span class="bot-tag">BOT</span>' : '';
    const content = escapeHtml(msg.cleanContent || msg.content);

    let attachmentsHtml = '';
    if (msg.attachments && msg.attachments.size > 0) {
      const attachList = msg.attachments.map(att => {
        const isImage = att.contentType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(att.name);
        if (isImage) {
          return `<div class="attachment-image"><a href="${att.url}" target="_blank"><img src="${att.url}" alt="${escapeHtml(att.name)}" /></a></div>`;
        }
        return `<div class="attachment-file"><a href="${att.url}" target="_blank">📁 ${escapeHtml(att.name)} (${Math.round(att.size / 1024)} KB)</a></div>`;
      }).join('');
      attachmentsHtml = `<div class="attachments-container">${attachList}</div>`;
    }

    let embedsHtml = '';
    if (msg.embeds && msg.embeds.length > 0) {
      embedsHtml = msg.embeds.map(emb => {
        const title = emb.title ? `<div class="embed-title">${escapeHtml(emb.title)}</div>` : '';
        const desc = emb.description ? `<div class="embed-desc">${escapeHtml(emb.description)}</div>` : '';
        return `<div class="embed-card">${title}${desc}</div>`;
      }).join('');
    }

    return `
      <div class="message-row">
        <img class="avatar" src="${avatarUrl}" alt="${escapeHtml(author.username)}" />
        <div class="message-content-col">
          <div class="message-header">
            <span class="author-name">${escapeHtml(author.username)}</span>
            ${isBot}
            <span class="timestamp">${timestamp}</span>
          </div>
          ${content ? `<div class="message-text">${content}</div>` : ''}
          ${embedsHtml}
          ${attachmentsHtml}
        </div>
      </div>
    `;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Transcript - #${escapeHtml(channel.name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'gg sans', 'Segoe UI', Helvetica, Arial, sans-serif;
      background-color: #1e1f22;
      color: #dbdee1;
      padding: 24px;
      line-height: 1.4;
    }
    .header-card {
      background-color: #2b2d31;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
    .header-card h1 {
      color: #ffffff;
      font-size: 22px;
      margin-bottom: 12px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      font-size: 14px;
    }
    .meta-item strong {
      color: #949ba4;
    }
    .transcript-container {
      background-color: #2b2d31;
      border-radius: 8px;
      padding: 16px;
    }
    .message-row {
      display: flex;
      gap: 16px;
      padding: 10px 8px;
      border-radius: 4px;
      transition: background-color 0.15s ease;
    }
    .message-row:hover {
      background-color: #313338;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .message-content-col {
      flex: 1;
      min-width: 0;
    }
    .message-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 4px;
    }
    .author-name {
      font-weight: 600;
      color: #ffffff;
      font-size: 15px;
    }
    .bot-tag {
      background-color: #5865f2;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .timestamp {
      color: #949ba4;
      font-size: 12px;
    }
    .message-text {
      color: #dbdee1;
      font-size: 14.5px;
      word-break: break-word;
    }
    .attachments-container {
      margin-top: 8px;
    }
    .attachment-image img {
      max-width: 400px;
      max-height: 300px;
      border-radius: 6px;
      margin-top: 4px;
    }
    .attachment-file a {
      color: #00a8fc;
      text-decoration: none;
      font-size: 13px;
    }
    .embed-card {
      background-color: #1e1f22;
      border-radius: 4px;
      padding: 10px 14px;
      margin-top: 8px;
      border-left: 4px solid #5865f2;
    }
    .embed-title {
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .embed-desc {
      font-size: 13.5px;
      color: #c4c9ce;
    }
  </style>
</head>
<body>
  <div class="header-card">
    <h1>LIBERTX Support | Ticket Archive</h1>
    <div class="meta-grid">
      <div class="meta-item"><strong>Ticket:</strong> #${escapeHtml(channel.name)}</div>
      <div class="meta-item"><strong>Category:</strong> ${escapeHtml(categoryLabel)}</div>
      <div class="meta-item"><strong>Author:</strong> ${escapeHtml(authorTag)} (${escapeHtml(authorId)})</div>
      <div class="meta-item"><strong>Closed By:</strong> ${escapeHtml(closerTag)}</div>
      <div class="meta-item"><strong>Opened At:</strong> ${escapeHtml(openedDate)}</div>
      <div class="meta-item"><strong>Closed At:</strong> ${escapeHtml(closedDate)}</div>
      <div class="meta-item" style="grid-column: 1 / -1;"><strong>Close Reason:</strong> ${escapeHtml(closeReason || 'No reason provided.')}</div>
    </div>
  </div>

  <div class="transcript-container">
    ${messageRows || '<div style="color:#949ba4; padding:12px;">No messages recorded in this channel.</div>'}
  </div>
</body>
</html>`;

  const htmlBuffer = Buffer.from(html, 'utf-8');
  const fileName = `transcript-${channel.name}.html`;

  return new AttachmentBuilder(htmlBuffer, { name: fileName });
}
