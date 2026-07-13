import { LIVE_FEED_PATHS, type LiveEndpoint } from '@nascar/shared';
import { useSettings, type DataSourceMode } from '../state/settingsStore';
import { demoRace } from './demo/demoFeed';

const PROXY_ROUTES: Record<LiveEndpoint, string> = {
  feed: '/api/live/feed',
  flags: '/api/live/flags',
  pits: '/api/live/pits',
  points: '/api/live/points',
  stagePoints: '/api/live/stage-points',
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as T;
}

/** Fetch a live endpoint from the active data source (proxy, replay server, or demo sim). */
export async function fetchLive<T>(endpoint: LiveEndpoint): Promise<T> {
  const { dataSource, replayBase } = useSettings.getState();
  switch (dataSource) {
    case 'demo':
      return demoFetch(endpoint) as T;
    case 'replay':
      return fetchJson<T>(`${replayBase}${LIVE_FEED_PATHS[endpoint]}`);
    case 'proxy':
    default:
      return fetchJson<T>(PROXY_ROUTES[endpoint]);
  }
}

function demoFetch(endpoint: LiveEndpoint): unknown {
  switch (endpoint) {
    case 'feed': return demoRace.getFeed();
    case 'flags': return demoRace.getFlagEvents();
    case 'pits': return demoRace.getPitData();
    case 'points': return demoRace.getPoints();
    case 'stagePoints': return demoRace.getStagePoints();
  }
}

export function sourceLabel(mode: DataSourceMode): string {
  switch (mode) {
    case 'demo': return 'DEMO';
    case 'replay': return 'REPLAY';
    case 'proxy': return 'LIVE';
  }
}

/** POST a replay-server control command (play/pause/seek/...). */
export async function replayControl(path: string): Promise<unknown> {
  const { replayBase } = useSettings.getState();
  const res = await fetch(`${replayBase}/replay/${path}`);
  if (!res.ok) throw new Error(`Replay control failed: ${res.status}`);
  return res.json();
}
