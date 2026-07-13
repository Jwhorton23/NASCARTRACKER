// Track outlines as normalized (0-1) control points, ported from
// led_sports_ticker/track_overlay.py TRACK_LAYOUTS and re-densified for
// smooth spline rendering. Point order follows race direction
// (counterclockwise: frontstretch runs right-to-left at the bottom).

export interface TrackLayout {
  trackId: number;
  name: string;
  type: 'oval' | 'tri_oval' | 'short' | 'superspeedway' | 'quad_oval' | 'paperclip';
  points: Array<[number, number]>;
  startFinishIndex: number; // index in points where the S/F line sits
  aspect: number; // width / height ratio of the drawing region
}

export const TRACK_LAYOUTS: Record<number, TrackLayout> = {
  // Daytona International Speedway — 2.5mi tri-oval
  105: {
    trackId: 105,
    name: 'Daytona',
    type: 'tri_oval',
    aspect: 2.4,
    points: [
      [0.34, 0.82], [0.22, 0.78], [0.12, 0.66], [0.09, 0.50], [0.12, 0.34], [0.22, 0.22], // T1-T2
      [0.36, 0.17], [0.50, 0.15], [0.64, 0.17],                                            // backstretch
      [0.78, 0.22], [0.88, 0.34], [0.91, 0.50], [0.88, 0.66], [0.78, 0.78],                // T3-T4
      [0.64, 0.83], [0.50, 0.87],                                                          // tri-oval frontstretch
    ],
    startFinishIndex: 15,
  },
  // Bristol Motor Speedway — 0.533mi concrete bowl
  14: {
    trackId: 14,
    name: 'Bristol',
    type: 'short',
    aspect: 1.8,
    points: [
      [0.35, 0.78], [0.22, 0.72], [0.15, 0.50], [0.22, 0.28], [0.35, 0.22],
      [0.50, 0.20], [0.65, 0.22], [0.78, 0.28], [0.85, 0.50], [0.78, 0.72],
      [0.65, 0.78], [0.50, 0.80],
    ],
    startFinishIndex: 11,
  },
  // Bowman Gray Stadium — 0.25mi flat quarter-mile
  159: {
    trackId: 159,
    name: 'Bowman Gray',
    type: 'short',
    aspect: 2.0,
    points: [
      [0.35, 0.72], [0.22, 0.66], [0.16, 0.50], [0.22, 0.34], [0.35, 0.28],
      [0.50, 0.26], [0.65, 0.28], [0.78, 0.34], [0.84, 0.50], [0.78, 0.66],
      [0.65, 0.72], [0.50, 0.74],
    ],
    startFinishIndex: 11,
  },
  // Atlanta Motor Speedway — 1.54mi reconfigured superspeedway
  111: {
    trackId: 111,
    name: 'Atlanta',
    type: 'superspeedway',
    aspect: 2.2,
    points: [
      [0.36, 0.80], [0.22, 0.74], [0.13, 0.62], [0.10, 0.50], [0.13, 0.38], [0.22, 0.26],
      [0.36, 0.20], [0.50, 0.18], [0.64, 0.20],
      [0.78, 0.26], [0.87, 0.38], [0.90, 0.50], [0.87, 0.62], [0.78, 0.74],
      [0.64, 0.80], [0.50, 0.82],
    ],
    startFinishIndex: 15,
  },
  // Martinsville Speedway — 0.526mi paperclip
  22: {
    trackId: 22,
    name: 'Martinsville',
    type: 'paperclip',
    aspect: 2.3,
    points: [
      [0.32, 0.76], [0.20, 0.72], [0.13, 0.58], [0.13, 0.42], [0.20, 0.28], [0.32, 0.24],
      [0.50, 0.22], [0.68, 0.24],
      [0.80, 0.28], [0.87, 0.42], [0.87, 0.58], [0.80, 0.72], [0.68, 0.76],
      [0.50, 0.78],
    ],
    startFinishIndex: 13,
  },
};

// Generic fallbacks picked by track_length when the track_id is unknown
const DEFAULT_SHORT: TrackLayout = {
  trackId: -1,
  name: 'Short Track',
  type: 'short',
  aspect: 1.9,
  points: TRACK_LAYOUTS[14].points,
  startFinishIndex: TRACK_LAYOUTS[14].startFinishIndex,
};

const DEFAULT_INTERMEDIATE: TrackLayout = {
  trackId: -2,
  name: 'Intermediate',
  type: 'oval',
  aspect: 2.2,
  points: TRACK_LAYOUTS[111].points,
  startFinishIndex: TRACK_LAYOUTS[111].startFinishIndex,
};

const DEFAULT_SUPERSPEEDWAY: TrackLayout = {
  trackId: -3,
  name: 'Superspeedway',
  type: 'superspeedway',
  aspect: 2.4,
  points: TRACK_LAYOUTS[105].points,
  startFinishIndex: TRACK_LAYOUTS[105].startFinishIndex,
};

export function layoutForTrack(trackId: number, trackLengthMiles?: number): TrackLayout {
  const known = TRACK_LAYOUTS[trackId];
  if (known) return known;
  const len = trackLengthMiles ?? 1.5;
  if (len < 1.0) return DEFAULT_SHORT;
  if (len >= 2.0) return DEFAULT_SUPERSPEEDWAY;
  return DEFAULT_INTERMEDIATE;
}
