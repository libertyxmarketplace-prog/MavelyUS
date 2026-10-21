# ERLC.US

ERLC.US is a website and web dashboard for Emergency Response: Liberty County (ER:LC) Roblox communities. You sign in with Discord, pick a server you manage, and set up its listing, growth campaigns and live ER:LC stats from the browser.

There is no Discord bot any more. Discord is only used for login and for listing the servers you have Manage Server or Administrator permission in.

---

## What the website does

1. **Discord login**
   - Sign in through Discord OAuth2. The backend runs the login, so your Discord access token never reaches the browser.
   - For now only members of the ERLC.US testing server can log in (`LOGIN_GUILD_IDS`).

2. **Dashboard (`/dashboard`)**
   - Shows the Discord servers you can manage.
   - Saves each server's settings (listing text, invite link, banners, growth settings).

3. **Live ER:LC stats**
   - Add your private server API key to see player counts, queue size and staff online.

4. **Server directory and bumps**
   - Publish your server in the directory and bump it once per cooldown window.

---

## How to run it

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in the Discord OAuth2 values of the "ERLC US" Discord application:
```env
DISCORD_CLIENT_ID=your_oauth_application_id
DISCORD_CLIENT_SECRET=your_oauth_client_secret
APP_ORIGIN=http://localhost:3000
LOGIN_GUILD_IDS=1562353446294781972
```
Register `<APP_ORIGIN>/auth/discord/callback` as a redirect URL in the Discord Developer Portal. Without `DISCORD_CLIENT_SECRET` nobody can log in.

### 3. Start the frontend
```bash
npm run dev
```
Open `http://localhost:3000`.

### 4. Start the backend
In a second terminal:
```bash
npm start
```
The backend listens on port 3001 and handles login, the server list and saved settings. In production it also serves the built site from `dist/` (build it with `npm run build`).

---

## File storage

Data is saved in the `data/` folder as JSON files:
- `data/bot_instances.db.json` (and `bot_instances.json`): saved settings for each server. The file name is left over from the old bot so existing settings keep loading.
- `data/web_sessions.json`: active dashboard sessions.
