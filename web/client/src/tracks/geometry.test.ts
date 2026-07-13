import { describe, expect, it } from 'vitest';
import { buildArcTable, catmullRomPathD, pointAtProgress } from './geometry';
import { TRACK_LAYOUTS, layoutForTrack } from './layouts';

describe('geometry', () => {
  const layout = TRACK_LAYOUTS[105]; // Daytona
  const table = buildArcTable(layout, 1000, 417);

  it('starts the arc table at the start/finish control point', () => {
    const sf = layout.points[layout.startFinishIndex];
    const p0 = pointAtProgress(table, 0);
    expect(p0.x).toBeCloseTo(sf[0] * 1000, 0);
    expect(p0.y).toBeCloseTo(sf[1] * 417, 0);
  });

  it('is arc-length uniform: equal progress steps move equal distances', () => {
    const N = 64;
    const dists: number[] = [];
    for (let i = 0; i < N; i++) {
      const a = pointAtProgress(table, i / N);
      const b = pointAtProgress(table, (i + 1) / N);
      dists.push(Math.hypot(b.x - a.x, b.y - a.y));
    }
    const mean = dists.reduce((s, d) => s + d, 0) / N;
    for (const d of dists) {
      expect(d).toBeGreaterThan(mean * 0.8);
      expect(d).toBeLessThan(mean * 1.2);
    }
  });

  it('wraps progress outside [0,1)', () => {
    const a = pointAtProgress(table, 0.25);
    const b = pointAtProgress(table, 1.25);
    const c = pointAtProgress(table, -0.75);
    expect(b.x).toBeCloseTo(a.x, 5);
    expect(c.y).toBeCloseTo(a.y, 5);
  });

  it('emits a closed SVG path', () => {
    const d = catmullRomPathD(layout.points, 1000, 417);
    expect(d.startsWith('M ')).toBe(true);
    expect(d.endsWith(' Z')).toBe(true);
    expect(d.match(/C /g)!.length).toBe(layout.points.length);
  });

  it('every known layout builds a valid table', () => {
    for (const l of Object.values(TRACK_LAYOUTS)) {
      const t = buildArcTable(l, 1000, Math.round(1000 / l.aspect));
      expect(t.totalLength).toBeGreaterThan(0);
      for (let i = 0; i < t.samples; i++) {
        expect(Number.isFinite(t.xs[i])).toBe(true);
        expect(Number.isFinite(t.ys[i])).toBe(true);
      }
    }
  });
});

describe('layoutForTrack fallbacks', () => {
  it('returns the known layout when the track id matches', () => {
    expect(layoutForTrack(105).name).toBe('Daytona');
  });
  it('picks a fallback by track length for unknown ids', () => {
    expect(layoutForTrack(9999, 0.5).name).toBe('Short Track');
    expect(layoutForTrack(9999, 1.5).name).toBe('Intermediate');
    expect(layoutForTrack(9999, 2.66).name).toBe('Superspeedway');
  });
});
