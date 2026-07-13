import { describe, expect, it } from 'vitest';
import type { LiveFeed } from '@nascar/shared';
import { formatDelta, formatLapTime, stageProgress } from './format';

const baseFeed = (overrides: Partial<LiveFeed>): LiveFeed =>
  ({
    lap_number: 60,
    laps_in_race: 160,
    stage: { stage_num: 2, finish_at_lap: 95, laps_in_stage: 50 },
    vehicles: [],
    flag_state: 1,
  }) as unknown as LiveFeed;

describe('formatLapTime', () => {
  it('formats sub-minute laps', () => {
    expect(formatLapTime(48.123)).toBe('48.123');
  });
  it('formats over-a-minute laps (road courses)', () => {
    expect(formatLapTime(95.5)).toBe('1:35.500');
  });
  it('handles missing values', () => {
    expect(formatLapTime(0)).toBe('—');
    expect(formatLapTime(null)).toBe('—');
  });
});

describe('formatDelta', () => {
  const v = (delta: number, pos = 2) =>
    ({ delta, running_position: pos }) as Parameters<typeof formatDelta>[0];
  it('leader shows Leader', () => {
    expect(formatDelta(v(0, 1))).toBe('Leader');
  });
  it('positive deltas are gaps in seconds', () => {
    expect(formatDelta(v(1.234))).toBe('+1.234');
  });
  it('negative whole deltas are laps down', () => {
    expect(formatDelta(v(-2))).toBe('2 laps');
    expect(formatDelta(v(-1))).toBe('1 lap');
  });
});

describe('stageProgress', () => {
  it('computes laps into the current stage', () => {
    const info = stageProgress(baseFeed({}))!;
    // stage 2 spans laps 46-95; lap 60 is 15 laps in
    expect(info.lapsIntoStage).toBe(15);
    expect(info.lapsInStage).toBe(50);
    expect(info.fraction).toBeCloseTo(0.3);
  });
  it('returns null for practice (999 sentinel)', () => {
    const feed = baseFeed({});
    feed.stage = { stage_num: 1, finish_at_lap: 999, laps_in_stage: 999 };
    expect(stageProgress(feed)).toBeNull();
  });
});
