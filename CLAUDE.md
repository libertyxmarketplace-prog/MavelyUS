# ERLC.US - AI Development Guide

This repository contains the **ERLC.US** website (Vite + React) and its Node/Express backend. The old Discord bot has been removed; Discord is only used for login.

## Tech Stack & Architecture
- **Environment:** Node.js (ES modules: `import` / `export`)
- **Main Files:**
  - `server.js`: Express server. Mounts the API and serves the built site from `dist/`.
  - `web/api.js`: Dashboard API: Discord OAuth login, sessions, server list, workspace settings, ER:LC stats, bumps.
  - `botManager.js` & `botDatabase.js`: JSON storage for each server's saved settings. The names and the `data/bot_instances*.json` files are kept from the old bot so existing data still loads.
  - `src/` and `web/src/`: the two copies of the frontend. Keep them in sync.

## Critical Rules for AI Agents (DO NOT VIOLATE)
1. **NO Nuclear File Rewrites:**
   - Do NOT rewrite entire files from scratch.
   - Always preserve existing functions, commands, listeners, and custom ID patterns.
   - When modifying a feature, edit ONLY the targeted logic.
2. **Keep both frontends in sync:**
   - Every change in `src/` must also be made in `web/src/` (and the other way round).
3. **No bot code:**
   - Do not add a Discord bot, bot tokens or slash commands back without the owner asking.
4. **Environment & Secrets:**
   - Never hardcode tokens, client IDs, or webhook URLs in code.
   - Always retrieve them from `process.env`.
5. **Data Persistence (`data/` folder):**
   - Files in `data/` are gitignored.
   - Code must gracefully handle empty or missing files on startup by creating default `{}` objects if `!fs.existsSync(...)`.

## Development & Testing Workflow
- To run the backend: `npm start` (or `node server.js`)
- To run the frontend: `npm run dev`
- To build: `npm run build`
- Run Git branches for every new feature: `git checkout -b feature/your-feature-name`

## Commit & Git Push Rules (MANDATORY)
1. **Simple, Plain English Commit Messages:**
   - Commit messages MUST be written in very simple, plain English so the lead developer can easily understand what was changed.
   - Do NOT use overly complex technical jargon or confusing words.
   - Explain what feature was added or what bug was fixed in plain everyday language.
   - Example: "Fixed ticket close button error" or "Added music pause and resume command".
2. **Major / Breaking Changes Alerting:**
   - If a change is dangerous, breaks an existing feature, modifies database schemas, or touches login or stored settings, ALWAYS start the commit message with `[ALERT]` (e.g. `[ALERT] Changed database schema for tickets`).
   - The Discord notification system will automatically flag this and ping `@here` to alert the team.
