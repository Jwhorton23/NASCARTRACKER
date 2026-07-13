import express from 'express';
import cors from 'cors';
import { LIVE_FEED_PATHS } from '@nascar/shared';
import { config } from './config.js';
import { serveUpstream } from './proxyRoute.js';
import { lastFetchOk, lastFetchAt } from './upstream.js';

const app = express();
app.use(cors());

// Live feeds (~1s TTL)
const liveRoutes: Record<string, string> = {
  '/api/live/feed': LIVE_FEED_PATHS.feed,
  '/api/live/flags': LIVE_FEED_PATHS.flags,
  '/api/live/pits': LIVE_FEED_PATHS.pits,
  '/api/live/points': LIVE_FEED_PATHS.points,
  '/api/live/stage-points': LIVE_FEED_PATHS.stagePoints,
};
for (const [route, upstreamPath] of Object.entries(liveRoutes)) {
  app.get(route, (req, res) => serveUpstream(req, res, upstreamPath, config.liveTtlMs));
}

// Cacher passthrough — allowlist of known-safe file patterns
const CACHER_ALLOW = [
  /^drivers\.json$/,
  /^tracks\.json$/,
  /^\d{4}\/race_list_basic\.json$/,
  /^\d{4}\/\d\/\d+\/weekend-feed\.json$/,
  /^\d{4}\/\d\/\d+\/lap-times\.json$/,
  /^\d{4}\/\d\/\d+\/lap-notes\.json$/,
];

app.get(/^\/api\/cacher\/(.+)$/, (req, res) => {
  const sub = (req.params as Record<string, string>)[0];
  if (!CACHER_ALLOW.some((re) => re.test(sub))) {
    res.status(404).json({ error: 'Unknown cacher path' });
    return;
  }
  const isStatic = sub === 'drivers.json' || sub === 'tracks.json';
  void serveUpstream(req, res, `/cacher/${sub}`, isStatic ? config.staticTtlMs : config.cacherTtlMs);
});

app.get('/api/loopstats/:year/:series/:raceId', (req, res) => {
  const { year, series, raceId } = req.params;
  if (!/^\d{4}$/.test(year) || !/^\d$/.test(series) || !/^\d+$/.test(raceId)) {
    res.status(400).json({ error: 'Bad loopstats params' });
    return;
  }
  void serveUpstream(req, res, `/loopstats/prod/${year}/${series}/${raceId}.json`, config.cacherTtlMs);
});

app.get('/api/health', (_req, res) => {
  res.json({
    upstream: config.upstreamBase,
    lastFetchOk,
    lastFetchAt: lastFetchAt ? new Date(lastFetchAt).toISOString() : null,
  });
});

app.listen(config.port, () => {
  console.log(`[nascar-proxy] listening on http://localhost:${config.port}`);
  console.log(`[nascar-proxy] upstream: ${config.upstreamBase}`);
});
