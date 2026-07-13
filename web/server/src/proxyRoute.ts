import type { Request, Response } from 'express';
import { fetchThrough, getStale } from './cache.js';
import { fetchUpstream, UpstreamError } from './upstream.js';
import { config } from './config.js';

/**
 * Serve an upstream JSON path through the TTL cache, with ETag/304 support
 * and last-known-good fallback when the upstream fails.
 */
export async function serveUpstream(req: Request, res: Response, upstreamPath: string, ttlMs: number) {
  try {
    const entry = await fetchThrough(upstreamPath, ttlMs, () => fetchUpstream(upstreamPath));
    if (req.headers['if-none-match'] === entry.etag) {
      res.status(304).end();
      return;
    }
    res.set('ETag', entry.etag);
    res.set('Cache-Control', 'no-cache');
    res.type('application/json').send(entry.body);
  } catch (err) {
    const stale = getStale(upstreamPath, config.staleGraceMs);
    if (stale) {
      res.set('X-Stale', 'true');
      res.set('ETag', stale.etag);
      res.type('application/json').send(stale.body);
      return;
    }
    const status = err instanceof UpstreamError && err.status === 404 ? 404 : 502;
    res.status(status).json({ error: (err as Error).message });
  }
}
