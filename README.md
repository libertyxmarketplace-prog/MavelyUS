# Mavely Bot

Mavely is an all-in-one Discord bot and web management platform designed for Emergency Response: Liberty County (ER:LC) Roblox communities. It combines a multi-tenant Discord bot with a real-time web dashboard.

---

## The Mavely Website

The Mavely website gives server owners and staff a full web-based control room for their Discord community and in-game ER:LC server. Instead of configuring everything through Discord chat commands, you can manage your entire setup from your web browser.

### Key Website Features

1. **Web Dashboard (`/dashboard`)**
   - Manage your bot customizations: change the bot nickname, activity status, and embed colors.
   - Configure server join codes, banner URLs, and channel links visually.
   - View real-time statistics including active tickets, total members, and server uptime.

2. **Live ER:LC Telemetry**
   - Connect your private server API key to view live in-game data.
   - Track current player counts, server queue numbers, and on-duty police rosters.
   - Schedule and broadcast Server Start Up (SSU) patrol notifications with one click.

3. **Support Ticket Center**
   - Monitor open and closed tickets across your server.
   - View styled HTML transcripts of closed tickets.
   - Edit ticket close reasons and track staff response times.

4. **Staff Management and Applications**
   - Review submitted staff quiz applications with accept and deny actions.
   - Track staff Leave of Absence (LOA) records.
   - View staff action logs, warnings, and activity records.

5. **Discord Login**
   - Secure login through Discord OAuth2.
   - Automatically detects the servers where you have management permissions.

---

## How to Run the Website and Bot

### 1. Install Dependencies
Open PowerShell or your terminal in this directory and run:
```bash
npm install
```

### 2. Configure Environment Variables
Create or open the `.env` file in the project root and add your Discord credentials:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_discord_server_id_here
```

- `DISCORD_TOKEN`: Your Discord bot token from the Discord Developer Portal.
- `CLIENT_ID`: Your bot application ID.
- `GUILD_ID`: Your Discord server ID (recommended for instant slash command registration).

### 3. Start the Website Frontend
Run the Vite development server:
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:3000`

### 4. Start the Web Backend API
In a second terminal window, start the Express backend server:
```bash
node server.js
```
The backend listens on port 3001 and handles all dashboard data and Discord authentication.

### 5. Deploy Slash Commands
Register all bot slash commands with Discord:
```bash
npm run deploy
```

### 6. Start the Discord Bot
Run the master bot process:
```bash
node index.js
```

---

## Discord Slash Commands Reference

| Command | Permission | Description |
| :--- | :---: | :--- |
| `/ticket panel [channel]` | Staff / Admin | Sends the ticket creation panel to a channel and enables live updates. |
| `/ticket status <online\|busy\|closed>` | Staff / Admin | Sets the desk status (online, busy, or closed) and refreshes active panels. |
| `/ticket category <category> <enable\|disable>` | Staff / Admin | Turns a support category on or off in the ticket panels. |
| `/ticket close [reason]` | Staff / Author | Closes the ticket, creates an HTML transcript, and logs it to the transcripts channel. |
| `/ticket claim` | Staff | Claims the ticket and assigns it to you. |
| `/ticket unclaim` | Staff | Releases the ticket back to the public staff queue. |
| `/ticket add <user>` | Staff | Adds a member to the ticket channel. |
| `/ticket remove <user>` | Staff | Removes a member from the ticket channel. |
| `/ticket rename <name>` | Staff | Renames the current ticket channel. |
| `/config` | Admin | Opens the interactive bot setup panel inside Discord. |
| `/panel` | Admin | Opens the unified panel menu to post tickets, applications, or session embeds. |

---

## File Storage and Persistence

All data is saved locally in the `data/` folder as JSON files:
- `data/tickets.json`: Active tickets, claim data, and closed ticket records.
- `data/ticket_desk.json`: Current operational desk status and disabled categories.
- `data/ticket_panels.json`: List of all posted panel messages for live auto-updating.
- `data/bot_instances.db.json`: Customer bot configurations and saved settings.
- `data/applications.json`: Submitted staff application responses and scores.
- `data/web_sessions.json`: Active web dashboard sessions.
