# ERLC.US Website

The site is a Vite, React, TypeScript, and Tailwind app served by the existing Express process. The authenticated API stores each server's settings in the JSON records under `data/` (still named `bot_instances*.json` from the old bot); Discord OAuth access tokens remain in the server process and the browser only receives an HTTP-only session cookie.

## Local development

1. Copy the website OAuth settings from the root `.env.example` into `.env`.
2. Create a Discord OAuth2 application and set `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`.
3. Add `http://localhost:5173/auth/discord` as an OAuth2 redirect URL in the Discord Developer Portal.
4. Run `npm run web:server` in one terminal and `npm run web:dev` in another.
5. Open `http://localhost:5173`.

For the production app, set `APP_ORIGIN` to the public HTTPS origin and set `DISCORD_REDIRECT_URI` to `https://your-domain.example/auth/discord`; register that exact callback URL with Discord. `npm start` starts the Express website server. Build static site files with `npm run web:build`.

Dashboard sessions are saved to `data/web_sessions.json`. Stored ER:LC API keys use the local JSON persistence and are not encrypted at rest; secure the host and its data directory accordingly. Configure a durable session store and encrypted credential storage before using this as a multi-process or multi-host production service.

## Current backend boundaries

Discord server selection uses the signed-in user's Discord `Manage Server` or `Administrator` permission. Configuration writes are scoped to the matching Discord user and guild. Live ER:LC data is requested server-side and unavailable values remain empty states.

The Discord bot has been removed. Discord is only used for login and for listing the servers you manage.
