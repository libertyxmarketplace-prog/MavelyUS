# Mavely (MavelyUS)

Mavely is the community management platform and web dashboard for Discord communities. Sign in with Discord, pick a server you manage, and configure growth campaigns, directory listings, partner exchanges, and server telemetry.

---

## Features

1. **Discord OAuth2 Login**
   - Secure server-side OAuth2 authentication. Discord tokens stay protected on the server.
   - Automatic discovery of servers where you have Manage Server or Administrator permissions.

2. **Dashboard (`/dashboard`)**
   - Clean, modern community workspace switcher with Discord server icons.
   - Manage community directory listings, custom descriptions, and verified invite links.

3. **Community Discovery & Directory**
   - Publish servers to the directory.
   - Single-bump cooldown engine to elevate active communities.
   - Earn credits, verified joins tracking, and automated rewards.

4. **Telemetry & Live Stats**
   - Real-time process metrics, memory tracking, and server health monitoring.

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your Discord OAuth2 values:
```env
DISCORD_CLIENT_ID=your_oauth_application_id
DISCORD_CLIENT_SECRET=your_oauth_client_secret
APP_ORIGIN=http://localhost:3000
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
```
Register `<APP_ORIGIN>/auth/discord/callback` as a Redirect URI in your Discord Developer Application.

### 3. Start development
```bash
npm run dev
```
Open `http://localhost:3000`.

### 4. Build for production
```bash
npm run build
npm start
```
