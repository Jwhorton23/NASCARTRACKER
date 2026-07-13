import { fileURLToPath } from 'node:url';

// Load server/.env if present (Node 20.12+ built-in; no dotenv dependency)
try {
  process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
} catch {
  // no .env file — env vars or defaults apply
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  upstreamBase: (process.env.UPSTREAM_BASE ?? 'https://cf.nascar.com').replace(/\/$/, ''),
  port: intEnv('PROXY_PORT', 3001),
  liveTtlMs: intEnv('LIVE_TTL_MS', 1000),
  cacherTtlMs: intEnv('CACHER_TTL_MS', 5 * 60 * 1000),
  staticTtlMs: intEnv('STATIC_TTL_MS', 60 * 60 * 1000),
  upstreamTimeoutMs: intEnv('UPSTREAM_TIMEOUT_MS', 10_000),
  staleGraceMs: intEnv('STALE_GRACE_MS', 30_000),
};
