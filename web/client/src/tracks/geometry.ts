import type { TrackLayout } from './layouts';

export interface ArcTable {
  xs: Float32Array;
  ys: Float32Array;
  angles: Float32Array; // tangent angle in radians at each sample
  samples: number;
  totalLength: number; // in viewBox units
}

export interface Pt {
  x: number;
  y: number;
  angle: number;
}

function catmullRom(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}

/** Closed Catmull-Rom spline through the layout points as an SVG path `d` string. */
export function catmullRomPathD(points: Array<[number, number]>, width: number, height: number): string {
  const n = points.length;
  const scaled = points.map(([x, y]) => [x * width, y * height] as [number, number]);
  let d = `M ${scaled[0][0].toFixed(2)} ${scaled[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = scaled[(i - 1 + n) % n];
    const p1 = scaled[i];
    const p2 = scaled[(i + 1) % n];
    const p3 = scaled[(i + 2) % n];
    // Catmull-Rom to cubic Bézier conversion
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + ' Z';
}

/**
 * Sample the closed spline into an arc-length-uniform lookup table so that
 * progress t ∈ [0,1) maps to a point at constant ground speed. Index 0 is
 * rotated to the layout's start/finish point.
 */
export function buildArcTable(layout: TrackLayout, width: number, height: number, samples = 512): ArcTable {
  const pts = layout.points;
  const n = pts.length;
  const fine: Array<[number, number]> = [];
  const STEPS = 32; // per segment

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let s = 0; s < STEPS; s++) {
      const [x, y] = catmullRom(p0, p1, p2, p3, s / STEPS);
      fine.push([x * width, y * height]);
    }
  }

  // cumulative arc length over the fine polyline
  const cum = new Float64Array(fine.length + 1);
  for (let i = 0; i < fine.length; i++) {
    const a = fine[i];
    const b = fine[(i + 1) % fine.length];
    cum[i + 1] = cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  const total = cum[fine.length];

  // rotate so the start/finish control point is at t = 0
  const sfFineIndex = layout.startFinishIndex * STEPS;
  const sfLength = cum[sfFineIndex];

  const xs = new Float32Array(samples);
  const ys = new Float32Array(samples);
  const angles = new Float32Array(samples);

  let cursor = 0;
  for (let k = 0; k < samples; k++) {
    const targetLen = (sfLength + (k / samples) * total) % total;
    // find fine segment containing targetLen (cum is sorted; scan with wrap reset)
    if (k === 0 || targetLen < cum[cursor]) cursor = 0;
    while (cursor < fine.length - 1 && cum[cursor + 1] < targetLen) cursor++;
    const a = fine[cursor];
    const b = fine[(cursor + 1) % fine.length];
    const segLen = cum[cursor + 1] - cum[cursor] || 1;
    const t = (targetLen - cum[cursor]) / segLen;
    xs[k] = a[0] + (b[0] - a[0]) * t;
    ys[k] = a[1] + (b[1] - a[1]) * t;
    angles[k] = Math.atan2(b[1] - a[1], b[0] - a[0]);
  }

  return { xs, ys, angles, samples, totalLength: total };
}

/** O(1) lookup of the point at lap progress t ∈ [0,1). */
export function pointAtProgress(table: ArcTable, t: number): Pt {
  let f = t % 1;
  if (f < 0) f += 1;
  const idxF = f * table.samples;
  const i0 = Math.floor(idxF) % table.samples;
  const i1 = (i0 + 1) % table.samples;
  const frac = idxF - Math.floor(idxF);
  return {
    x: table.xs[i0] + (table.xs[i1] - table.xs[i0]) * frac,
    y: table.ys[i0] + (table.ys[i1] - table.ys[i0]) * frac,
    angle: table.angles[i0],
  };
}
