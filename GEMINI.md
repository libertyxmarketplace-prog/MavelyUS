# Mavely (MavelyUS) Platform Development Rules & Standards

## Critical Core Principles

1. **No Fake Data / No AI Slop**:
   - Never use fake placeholder counts (e.g. 1,217 members, 1074 bumps, 211 views, 5.0 rating).
   - Never use fake review authors copied from other sites (e.g. `craftente`, `Deputy_Vance`, `OfficerK9`, etc.).
   - Only display real user/guild telemetry. If data is not yet available, show clean, elegant empty states or real zero counts.
   - Never use tacky glowing AI gradients, purple/neon halos, or buzzwords. Keep designs clean, minimal, flush, and elegant (like Claude, Linear, or Vercel).
   - In System Uptime & Status, never invent fake 90-day history or fake outages ("Scheduled gateway shard roll", etc.). Display live, honest process metrics from `/api/status`.

2. **Reference Images & Competitor Differentiations**:
   - When the user shares reference images, screenshots, or competitor mockups (e.g., CADLY or other dashboards): **NEVER** copy the text, names, labels, or layout verbatim.
   - Always differentiate and transform the design and copy into original, premium Mavely platform concepts unless the user specifically asks to preserve a phrase.

3. **Lenient URL Handling (`inviteUrl`)**:
   - `inviteUrl` must NEVER fail with strict "must be a valid HTTPS URL". It is completely optional.
   - If the user provides a Discord invite like `discord.gg/code` without `https://`, automatically format it to `https://discord.gg/code` rather than returning a validation error.

4. **No Unsolicited Banners**:
   - Never inject default stock banners (like sunset photos) unless the server owner has explicitly configured and uploaded a banner.
   - If no banner exists, show a clean, flush header without an artificial background image.

5. **Active Community & Server Switcher**:
   - Display the user's real Discord servers with their real Discord icons (`https://cdn.discordapp.com/icons/...`).
   - Do NOT include a search bar in the Select Server dropdown. Keep it clean, direct, and fast.
   - Blend the Active Community button at the top of the sidebar directly into the sidebar background (seamless, flush, no harsh rectangular contrast).
   - In the sidebar footer: Help & Support and Back to Home must be neutral muted gray (`text-zinc-400 hover:text-zinc-200`). Only Sign Out retains its red accent.

6. **Promote Server Studio & Directory**:
   - Remove heavy rectangular card backgrounds behind inputs, Community Links, Banner URL, Server Description, and directory previews. Keep sections flush and clean.
   - Anti-Raid & Churn Security: compact modal button directly next to "Save & Publish".
   - Remove any "● ACTIVE IN DIRECTORY" labels.
   - Primary Community Categories must be strictly ordered:
     1. `Design Server`
     2. `Roleplay Server`
     3. `Misc`
     4. `COTS`
     5. `Departments`
     6. `Events`
   - Real member count must be displayed on directory cards and detail modals.
   - Auto-update: When Promote Server is saved, immediately sync the updated server data to the Earn Credits directory and detail pages.

7. **Server Details Page**:
   - Completely original design—do NOT copy CADLY or other competitors.
   - Remove heavy rectangular background cards behind the profile.
   - "Join Server" must immediately open the community's real Discord invite URL.
   - No "Post Review" form or fake CADLY reviews. Real ratings only.
   - Do not display "VERIFIED" badges on servers unless explicitly verified in the database.

8. **Bumping & Cooldowns**:
   - Single bump only per cooldown window (no double bumping).
   - Bumping immediately elevates the server to the #1 spot in the directory.

9. **Earn Credits & Joins**:
   - Self-join is disabled: users cannot claim bounties or join their own server.
   - Real Discord invites: "Join Server" must open the real Discord invite link.
   - Verified Joins counter: Leaving a server must decrement the verified joins counter.
   - Minimalist stat badges: Remove heavy rectangular background cards behind balance, streak, and verified joins counters. Keep only the clean icons directly (`Coins`, `Check`, `Flame`).
   - Celebration modals ("Membership Confirmed & Bounty Secured!"): No heavy colored rectangles behind the checkmark. Ultra-clean typography and sleek modal design.

10. **No Rectangular Boxes Behind Logos/Icons**:
   - Never wrap naked SVG icons or logos in heavy colored rounded boxes/squares (`bg-[#27272a]`, `size-16 rounded-2xl`, etc.). Keep icons minimal, clean, and directly aligned with typography.

11. **Growth Trajectory Telemetry Standards**:
   - `M T W T F S S` must remain clean, non-clickable minimal day labels (never make day labels clickable buttons).
   - No `Live` badge and no `+2 cr/join` pills on the growth trajectory.
   - The chart must cleanly render honest telemetry without clunky or broken interactive states.

12. **Daily Check-In Staging**:
   - Daily Check-In displays a sleek, flush "Coming Soon" design with a 5-day countdown timer (matching the homepage aesthetic) until full production release.

13. **404 & Banned Pages (Minimalist Centered Aesthetics)**:
   - 404 page must follow the user's reference image: massive bold `404` centered on pitch-black background, `Page not found` heading, `The page you are looking for does not exist or has been moved.` subtitle, and two pill buttons (`Go home` in solid white and `Browse pages` in dark zinc).
   - Account Suspended / Banned page must follow the same aesthetic: massive bold `403` on pitch black, `Account Suspended`, clear administrative notice, and support pill buttons.

14. **Hidden Admin Portal (`/admin-portal`)**:
   - Located strictly at `/admin-portal` without being exposed in public navigation or sidebars.
   - Full portal capabilities: User moderation (ban/unban user accounts), Treasury management (gift credits/coins to user IDs), Changelog manager (add/remove/edit changelog items), Directory listing moderation, and live diagnostic telemetry.

