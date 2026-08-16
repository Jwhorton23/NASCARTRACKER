// Ported from led_sports_ticker/nascar_api.py lookup tables.

export const FLAG_STATES: Record<number, string> = {
  0: 'None',
  1: 'Green',
  2: 'Caution',
  3: 'Red',
  4: 'White',
  5: 'Checkered',
  8: 'Hot Track',
  9: 'Cold Track',
};

export type FlagName =
  | 'none'
  | 'green'
  | 'yellow'
  | 'red'
  | 'white'
  | 'checkered'
  | 'hot'
  | 'cold';

export function flagName(flagState: number): FlagName {
  switch (flagState) {
    case 1: return 'green';
    case 2: return 'yellow';
    case 3: return 'red';
    case 4: return 'white';
    case 5: return 'checkered';
    case 8: return 'hot';
    case 9: return 'cold';
    default: return 'none';
  }
}

export const SERIES_NAMES: Record<number, string> = {
  1: 'NASCAR Cup Series',
  2: 'NASCAR Xfinity Series',
  3: 'NASCAR Craftsman Truck Series',
};

export const SERIES_SHORT: Record<number, string> = {
  1: 'Cup',
  2: 'Xfinity',
  3: 'Trucks',
};

export const RUN_TYPES: Record<number, string> = {
  1: 'Practice',
  2: 'Qualifying',
  3: 'Race',
};

// Brand-identity colors (validated for CVD separation on dark surfaces;
// always paired with a direct label — car number or name — never color alone)
export const MFR_COLORS: Record<string, string> = {
  Tyt: '#e10600',
  Chv: '#dfa400',
  Frd: '#3d7de0',
};

export const MFR_NAMES: Record<string, string> = {
  Tyt: 'Toyota',
  Chv: 'Chevrolet',
  Frd: 'Ford',
};

export const PRACTICE_LAPS = 999;

// The public CDN that serves the live feeds. Every path in LIVE_FEED_PATHS
// answers with `Access-Control-Allow-Origin: *`, so a browser can read them
// cross-origin without help — which is what lets a static deploy (GitHub
// Pages) show live data with no proxy server of its own. See the 'direct'
// data source in web/client/src/api/dataSource.ts.
export const NASCAR_CDN_BASE = 'https://cf.nascar.com';

// Upstream feed paths on cf.nascar.com (also served by the Python replay server)
export const LIVE_FEED_PATHS = {
  feed: '/live/feeds/live-feed.json',
  flags: '/live/feeds/live-flag-data.json',
  pits: '/live/feeds/live-pit-data.json',
  points: '/live/feeds/live-points.json',
  stagePoints: '/live/feeds/live-stage-points.json',
} as const;

export type LiveEndpoint = keyof typeof LIVE_FEED_PATHS;
