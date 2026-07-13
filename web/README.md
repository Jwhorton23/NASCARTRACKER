# NASCAR Race Tracker — Web App

A live race dashboard for NASCAR's public timing feeds (`cf.nascar.com`): an
overview dashboard with flag-state theming and an animated track minimap, plus
dedicated dashboards for the leaderboard, pit stops, points & stages, and flag
history.

![stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TS-blue)

## Quick start

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173. The app starts in **Demo race** mode — a built-in
simulated 160-lap race (green/yellow/white/checkered sequence, pit stops,
stage points) so everything works with zero setup. Use the selector in the
top-right to switch sources:

| Source | What it does |
|---|---|
| **Demo race** | Built-in simulator, no network needed |
| **Live (proxy)** | Real `cf.nascar.com` feeds via the local proxy server |
| **Replay server** | A recorded race served by `python led_sports_ticker/replay.py` |

## Architecture

npm workspaces:

- **`shared/`** — TypeScript types mirroring the NASCAR JSON feeds (see the
  `*.MD` docs in the repo root) plus flag/series/manufacturer constants.
- **`server/`** — Express proxy on port **3001**. Adds CORS, a read-through TTL
  cache (1 s live / 5 min cacher / 1 h static) with in-flight dedup, ETag/304,
  and last-known-good fallback (`X-Stale: true`). Routes:
  `/api/live/feed|flags|pits|points|stage-points`, `/api/cacher/*`,
  `/api/loopstats/:year/:series/:raceId`, `/api/health`.
  Env (`server/.env`, see `.env.example`): `UPSTREAM_BASE` points at
  `https://cf.nascar.com` or a local replay server; `PROXY_PORT` overrides 3001.
- **`client/`** — Vite + React SPA. TanStack Query polls the feed every second;
  Vite dev-proxies `/api` to the server.

### The track minimap

The NASCAR API exposes **no car coordinates** — only `running_position` and
`delta` (seconds behind the leader). `client/src/tracks/positionSynthesis.ts`
converts those into lap-progress around a track outline
(`tracks/layouts.ts`, ported from `led_sports_ticker/track_overlay.py`):
the leader dead-reckons forward by its lap time, everyone else is placed by
their real time gap, the field bunches to pace-car spacing under caution, and
pitted cars drop to an infield pit grid. A single `requestAnimationFrame`
loop (`hooks/useAnimatedCarPositions.ts`) eases each dot toward its target so
the 1 Hz feed looks like 60 fps. Positions are estimates, not telemetry.

Known layouts: Daytona (105), Bristol (14), Bowman Gray (159), Atlanta (111),
Martinsville (22). Unknown tracks fall back to a generic short/intermediate/
superspeedway shape by track length. Add layouts in `tracks/layouts.ts`.

### Flag-state theming

`useFlagTheme` stamps `data-flag` on `<html>`; `theme/flags.css` swaps CSS
variables (`--flag-accent`, `--flag-glow`, `--flag-banner-bg`) so the entire
app — banner, progress bars, track glow, top bar — turns green/yellow/red/
white/checkered with the race.

### Cameras

There is no public camera-feed API. The **Watch** button opens a panel of
deep links to official broadcasts (FOX, Prime, TNT/Max, NBC/Peacock), radio
(MRN/PRN/SiriusXM) and NASCAR.com. Edit
`client/src/components/cameras/cameraLinks.ts` when broadcast packages change.

## Replay workflow (dev without a live race)

```bash
# 1. record during any live session (from repo root)
python led_sports_ticker/recorder.py

# 2. serve the recording on :8080
python led_sports_ticker/replay.py led_sports_ticker/recordings/<file>.json.gz

# 3. either point the client straight at it (top-right selector → Replay server)
#    or run the proxy against it:
npm run dev:replay
```

When the Replay source is active, a floating transport strip (play/pause,
speed, seek) drives the replay server's `/replay/*` API.

## Commands

```bash
npm run dev        # proxy (:3001) + client (:5173)
npm run dev:replay # proxy pointed at localhost:8080 + client
npm test           # vitest: geometry, position synthesis, demo race sim
npm run typecheck  # server + client
npm run build      # production build (client/dist)
```

## Notes

- Unofficial fan project; data comes from NASCAR's publicly documented CDN
  feeds (reverse-engineering notes in the repo root `*.MD` files).
- Off race weekends the live feed returns the most recent session, which may
  look "frozen" — that's upstream, not a bug.
