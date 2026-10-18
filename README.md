# 🌴 LIBERTX - Discord Ticket System

<p align="center">
  <img src="assets/config-header.png" alt="LIBERTX Ticket System" width="100%" style="border-radius: 12px; margin-bottom: 16px;" onerror="this.style.display='none'"/>
</p>

<p align="center">
  <strong>Production-ready, ultra-modern Discord Ticket & Desk Management Engine</strong><br>
  Built with <code>discord.js v14 (ESM)</code> • Zero-SQL Local JSON Persistence • Live Real-Time Auto-Updating Panels
</p>

<p align="center">
  <a href="https://discord.js.org/"><img src="https://img.shields.io/badge/discord.js-v14.18.0-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="discord.js"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node.js-v20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"></a>
  <img src="https://img.shields.io/badge/Architecture-ESM%20Modules-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="ESM">
  <img src="https://img.shields.io/badge/Database-Local%20Atomic%20JSON-00C7B7?style=for-the-badge" alt="Local JSON">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge" alt="Production Ready">
</p>

---

## 🌟 What Makes LIBERTX Different?

Most Discord ticket bots are clunky, rely on heavy external databases, and leave outdated panels sitting in channels when staff are offline. **LIBERTX** is engineered from the ground up for responsiveness, speed, and clean Discord UI design:

- 🔄 **Real-Time Live Panel Synchronization:** When you change the operational status or toggle a category, *every single posted panel across your server updates instantly* without manual reposting.
- 🚦 **Operational Desk Status Engine:** Switch between `🟢 Online`, `🟡 Busy`, and `🔴 Closed` with `/ticket status` to manage community expectations.
- 🔒 **Staff Claim & Lock Workflow:** Instant one-click claiming. The ticket embed dynamically locks to the assigned staff member and provides direct unclaim/close controls.
- 📜 **Standalone Styled HTML Transcripts:** Generates clean, responsive HTML transcripts with dark-mode styling, message timestamps, avatars, and file embeds—automatically sent to your log channel and DMed to the ticket author.
- ✏️ **Retroactive Reason Editing:** Ticket closed with a generic note? Staff can easily update close reasons retroactively in the database records.
- 💾 **100% Local Persistence:** Never worry about database outages or complex setup. All states, panels, and tickets are stored in atomic JSON files under `data/`.

---

## 🚀 Quick Setup & Installation

### 1. Install Dependencies
Ensure you have **Node.js 18+** installed. In this folder, run:
```bash
npm install
```

### 2. Configure Environment Variables
Create or open your `.env` file in the project root:
```env
# Discord Bot Credentials
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_discord_server_id_here   # Recommended for instant server-wide slash command sync!
```

| Variable | Description |
| :--- | :--- |
| `DISCORD_TOKEN` | Your Discord Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications). |
| `CLIENT_ID` | Your Bot's Application ID. |
| `GUILD_ID` | *(Recommended)* Your server ID. Registers slash commands instantly without the 1-hour global Discord cache delay. |

### 3. Customize Config (`config.js`)
Open `config.js` to tailor the ticket system to your server's needs:
```javascript
export const CONFIG = {
  // Command Prefix for quick management commands (-close, -open)
  PREFIX: "-",

  // Channel ID where closed ticket logs and HTML transcripts are dispatched
  TRANSCRIPTS_CHANNEL_ID: "1548876816171798678",

  // Array of Role IDs permitted to view, claim, and manage tickets
  STAFF_ROLE_IDS: ["YOUR_STAFF_ROLE_ID", "YOUR_ADMIN_ROLE_ID"],

  // Top & Bottom Custom Embed Banners
  TOP_BANNER_URL: "https://your-domain.com/banner.png",
  BOTTOM_BANNER_URL: null,

  // Support categories mapping
  CATEGORIES: [
    {
      id: "general",
      label: "General",
      fullName: "General Support",
      categoryId: "1548331057911173140"
    },
    {
      id: "management",
      label: "Management",
      fullName: "Management Support",
      categoryId: "1548330987128229989"
    }
  ]
};
```

### 4. Deploy Slash Commands
Push all slash commands to Discord's API with one command:
```bash
npm run deploy
```

### 5. Launch the Bot
```bash
npm start
```

---

## 🛠️ Slash Commands Reference

All commands are organized under the unified `/ticket` namespace:

| Command | Syntax | Permission | Description |
| :--- | :--- | :---: | :--- |
| **Deploy Panel** | `/ticket panel [channel]` | `Staff / Admin` | Sends the interactive ticket creation panel to the specified channel and registers it for live synchronization. |
| **Desk Status** | `/ticket status <online\|busy\|closed>` | `Staff / Admin` | Toggles the operational desk state and instantly refreshes all active panels across the server. |
| **Toggle Category** | `/ticket category <category> <enable\|disable>` | `Staff / Admin` | Dynamically enables or disables specific ticket categories without deleting panel messages. |
| **Close Ticket** | `/ticket close [reason]` | `Staff / Author` | Archives the ticket, compiles the HTML transcript, logs to the transcript channel, and DMs the ticket creator. |
| **Claim Ticket** | `/ticket claim` | `Staff` | Assigns the ticket to you, locks staff controls, and updates the ticket header in real-time. |
| **Unclaim Ticket** | `/ticket unclaim` | `Staff` | Releases the ticket back to the public staff queue. |
| **Add Member** | `/ticket add <user>` | `Staff` | Grants a specific member read/write access to the current ticket channel. |
| **Remove Member** | `/ticket remove <user>` | `Staff` | Revokes a member's access from the ticket channel. |
| **Rename Ticket** | `/ticket rename <name>` | `Staff` | Updates the ticket channel name (e.g. `resolved-john`). |

---

## ⚡ Fast Prefix Commands

Staff members inside an active ticket channel can also use quick prefix shortcuts:
- `-close [reason]` — Closes and archives the current ticket.
- `-claim` — Instantly claims the ticket.
- `-unclaim` — Returns the ticket to the open queue.

---

## 📂 Architecture & Persistence

Data is stored locally under the `data/` directory using atomic disk writes so nothing is lost during bot reboots or crashes:

```
data/
├── tickets.json          # Active & archived ticket metadata, participants, claims, and close reasons
├── ticket_desk.json      # Current operational desk state (online, busy, closed) and category toggles
└── ticket_panels.json    # Registry of posted panel messages (channelId & messageId) for live sync
```

### Data Structures at a Glance:

<details>
<summary><strong>🔍 Click to view sample <code>ticket_desk.json</code></strong></summary>

```json
{
  "status": "online",
  "disabledCategories": [],
  "updatedAt": "2026-10-18T23:45:00.000Z"
}
```
</details>

<details>
<summary><strong>🔍 Click to view sample <code>ticket_panels.json</code></strong></summary>

```json
[
  {
    "channelId": "1548331111222333444",
    "messageId": "1548331555666777888",
    "createdAt": "2026-10-18T23:30:00.000Z"
  }
]
```
</details>

---

## 🛡️ Security & Role Hierarchy Requirements

To ensure smooth operation:
1. **Bot Role Position:** In **Server Settings > Roles**, ensure the bot's highest role is positioned **above** the ticket staff roles and any role it needs to manage.
2. **Channel Permissions:** The bot requires:
   - `Manage Channels` (to spawn and archive private ticket rooms)
   - `Manage Messages` (to clean up panel inputs and interactions)
   - `Attach Files` & `Embed Links` (to dispatch HTML transcripts and styled panels)
   - `Read Message History` (to compile transcript logs)
3. **Privileged Gateway Intents:** Ensure **Server Members Intent** and **Message Content Intent** are toggled **ON** in the Discord Developer Portal under the Bot tab.

---

<p align="center">
  <sub>Developed for LIBERTX • Crafted for high-traffic Discord communities.</sub>
</p>
