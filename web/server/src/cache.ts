import { createHash } from 'node:crypto';

export interface CacheEntry {
  body: string;
  etag: string;
  fetchedAt: number;
}

const entries = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<CacheEntry>>();

export function getCached(key: string, ttlMs: number): CacheEntry | undefined {
  const entry = entries.get(key);
  if (entry && Date.now() - entry.fetchedAt < ttlMs) return entry;
  return undefined;
}

export function getStale(key: string, graceMs: number): CacheEntry | undefined {
  const entry = entries.get(key);
  if (entry && Date.now() - entry.fetchedAt < graceMs) return entry;
  return undefined;
}

/**
 * Read-through fetch with in-flight dedup: N simultaneous requests for the
 * same key trigger a single upstream call.
 */
export async function fetchThrough(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<string>,
): Promise<CacheEntry> {
  const cached = getCached(key, ttlMs);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const body = await fetcher();
      const entry: CacheEntry = {
        body,
        etag: `"${createHash('sha1').update(body).digest('hex')}"`,
        fetchedAt: Date.now(),
      };
      entries.set(key, entry);
      return entry;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, promise);
  return promise;
}
