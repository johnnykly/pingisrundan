# Pingisrundan

Ping pong tracker for colleagues at HEAR. Log games, see standings, streaks,
head-to-head records and player profiles. Installable as a PWA. Data lives in a
Google Sheet.

- **Stack:** Next.js (App Router) + TypeScript + Tailwind v4, Google Sheets API via a
  service account (server-only), Serwist service worker.
- **Languages:** Swedish (default) and English, toggle in the header. All strings live
  in `src/i18n/sv.ts` and `src/i18n/en.ts`.
- **Setup and deploy:** see [docs/SETUP.md](docs/SETUP.md).

## Rules

A game is to 11 (default) or 21, two serves each, win by 2. The winner must reach the
target and lead by at least 2; past the target (deuce) the margin must be exactly 2.
Valid: 11-6, 13-11, 21-19, 24-22. Invalid: 11-10, 14-11, 9-7. See `src/lib/rules.ts`.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Dev server (needs `.env.local`) |
| `npm run dev:mock` | Dev server with an in-memory store |
| `npm test` | Unit tests (rules and stats) |
| `npm run lint` / `npm run typecheck` | Static checks |
| `npm run build` | Production build (also generates `public/sw.js`) |
| `npm run icons` | Regenerate PWA icons |

## Structure

```
src/app/            routes: / (standings), /ny, /historik, /h2h, /spelare, /spelare/[id]
src/app/actions.ts  server actions: add game, add player, soft delete / undo
src/lib/store.ts    Google Sheets access (server-only) + mock store
src/lib/rules.ts    score validation (shared by client and server)
src/lib/stats.ts    leaderboard, streaks, head-to-head
src/i18n/           dictionaries and language provider
```

Branding: HEAR ink `#171617` and orange `#ff902d`. The header uses a text wordmark;
swap `Logo` in `src/components/shell.tsx` for the official SVG when available.
