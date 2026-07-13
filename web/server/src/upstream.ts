import { config } from './config.js';

export class UpstreamError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export let lastFetchOk = false;
export let lastFetchAt = 0;

export async function fetchUpstream(path: string): Promise<string> {
  const url = `${config.upstreamBase}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.upstreamTimeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'NascarRaceTracker/0.1 (+web dashboard)' },
    });
    lastFetchAt = Date.now();
    if (!res.ok) {
      lastFetchOk = false;
      throw new UpstreamError(`Upstream ${res.status} for ${path}`, res.status);
    }
    const body = await res.text();
    lastFetchOk = true;
    return body;
  } catch (err) {
    lastFetchAt = Date.now();
    lastFetchOk = false;
    if (err instanceof UpstreamError) throw err;
    throw new UpstreamError(`Upstream fetch failed for ${path}: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}
