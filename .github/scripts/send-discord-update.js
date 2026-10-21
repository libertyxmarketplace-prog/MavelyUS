import fs from 'fs';

async function run() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID || '1559709889989841006';

  if (!webhookUrl && !botToken) {
    console.error('Error: Neither DISCORD_WEBHOOK_URL nor DISCORD_BOT_TOKEN is provided.');
    process.exit(1);
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    console.error('Error: GITHUB_EVENT_PATH not found.');
    process.exit(1);
  }

  const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));

  const repository = eventData.repository || {};
  const repoName = repository.name || 'erlc.us';
  const repoUrl = repository.html_url || 'https://github.com/cipherhex09/erlc.us';

  const ref = eventData.ref || 'refs/heads/main';
  const branch = ref.replace('refs/heads/', '');

  const sender = eventData.sender || {};
  const senderLogin = (sender.login || '').toLowerCase();

  // Map to the 2 Lead Developers: eazykims or George
  let devDisplayName = 'Lead Developer';
  if (senderLogin.includes('george') || senderLogin.includes('ford')) {
    devDisplayName = 'George • Lead Developer';
  } else if (senderLogin.includes('eazy') || senderLogin.includes('kim') || senderLogin.includes('sulman') || senderLogin.includes('lumora') || senderLogin.includes('liberty')) {
    devDisplayName = 'eazykims • Lead Developer';
  } else {
    // Check first commit author if sender is a generic bot/action
    const firstCommitAuthor = ((eventData.commits && eventData.commits[0]?.author?.name) || '').toLowerCase();
    if (firstCommitAuthor.includes('george')) {
      devDisplayName = 'George • Lead Developer';
    } else {
      devDisplayName = 'eazykims • Lead Developer';
    }
  }

  const commits = Array.isArray(eventData.commits) ? eventData.commits : [];
  if (commits.length === 0) {
    console.log('No commits in this push event, skipping update.');
    return;
  }

  const commitCount = commits.length;
  const compareUrl = eventData.compare || (commits[0] ? commits[0].url : repoUrl);

  // Format clean commit list: zero emojis, no leaked real names
  const commitLines = commits.slice(0, 10).map(c => {
    const shortSha = c.id.substring(0, 7);
    const firstLine = (c.message || 'Updated code').split('\n')[0].trim();
    return `- [\`${shortSha}\`](${c.url}) ${firstLine}`;
  }).join('\n');

  // Check if any commit contains an [ALERT], [MAJOR], or BREAKING flag
  const isMajorAlert = commits.some(c => {
    const msg = (c.message || '').toUpperCase();
    return msg.includes('[ALERT]') || msg.includes('[MAJOR]') || msg.includes('BREAKING:') || msg.includes('[CRITICAL]');
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + ' • ' + now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const erlcusLogoUrl = 'https://erlc.us/erlcus_logo.png';

  const embed = {
    color: isMajorAlert ? 0xed4245 : 0x1fd186, // Red for major alert, ERLC.US Mint Green for normal
    author: {
      name: isMajorAlert ? 'ERLC.US | Critical Alert' : 'ERLC.US | Development Update',
      icon_url: erlcusLogoUrl
    },
    thumbnail: {
      url: erlcusLogoUrl
    },
    description: [
      `**Developer:** ${devDisplayName}`,
      `**Repository:** [${repoName}](${repoUrl})`,
      `**Branch:** \`${branch}\` (${commitCount} commit${commitCount === 1 ? '' : 's'})`,
      ...(isMajorAlert ? ['**Alert:** Major / breaking changes detected in this push!'] : []),
      '',
      `**Changes**`,
      commitLines
    ].join('\n'),
    footer: {
      text: `ERLC.US Development • ${dateFormatted}`,
      icon_url: erlcusLogoUrl
    }
  };

  const payload = {
    content: isMajorAlert ? '@here' : '',
    embeds: [embed],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: 'View Changes',
            url: compareUrl
          },
          {
            type: 2,
            style: 5,
            label: 'Repository',
            url: repoUrl
          }
        ]
      }
    ]
  };

  if (webhookUrl) {
    console.log('Sending update via Discord Webhook...');
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: payload.content, embeds: payload.embeds })
      });
    } else {
      console.log('Successfully posted update to Discord!');
    }
  } else if (botToken && channelId) {
    console.log(`Sending update via Discord Bot API to channel ${channelId}...`);
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${botToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to send Discord message: ${res.status} ${errText}`);
      process.exit(1);
    } else {
      console.log('Successfully posted update to Discord!');
    }
  }
}

run().catch(err => {
  console.error('Fatal error running update script:', err);
  process.exit(1);
});
