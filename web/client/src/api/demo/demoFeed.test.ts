import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoRace } from './demoFeed';
import type { LiveFeed } from '@nascar/shared';

/**
 * Fast-forwards a whole demo race with fake timers to verify the scripted
 * flag sequence and field behavior end-to-end.
 */
describe('DemoRace full-race simulation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-12T18:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function runRace(): { feeds: LiveFeed[]; race: DemoRace } {
    const race = new DemoRace();
    const feeds: LiveFeed[] = [];
    // 5s wall steps at 6x = 30s sim per poll; 2500 polls ≈ covers any race length
    for (let i = 0; i < 2500; i++) {
      vi.advanceTimersByTime(5000);
      const feed = race.getFeed();
      feeds.push(feed);
      if (feed.flag_state === 5 && i > 10) break;
    }
    return { feeds, race };
  }

  it('runs hot → green → cautions → white → checkered', () => {
    const { feeds, race } = runRace();
    const flagsSeen = [...new Set(feeds.map((f) => f.flag_state))];
    expect(flagsSeen).toContain(1); // green
    expect(flagsSeen).toContain(2); // yellow
    expect(flagsSeen).toContain(4); // white
    expect(flagsSeen[flagsSeen.length - 1]).toBe(5); // ends checkered
    // the hot period is shorter than one coarse poll step — assert via events
    const eventFlags = race.getFlagEvents().map((e) => e.flag_state);
    expect(eventFlags[0]).toBe(8);
  });

  it('reaches the full race distance and freezes after the checkered', () => {
    const { feeds, race } = runRace();
    const last = feeds[feeds.length - 1];
    expect(last.flag_state).toBe(5);
    expect(last.lap_number).toBe(last.laps_in_race);
    const frozenLeader = last.vehicles[0].driver.full_name;
    vi.advanceTimersByTime(60_000);
    const after = race.getFeed();
    expect(after.vehicles[0].driver.full_name).toBe(frozenLeader);
    expect(after.elapsed_time).toBe(last.elapsed_time);
  });

  it('bunches the field under caution and spreads it under green', () => {
    const { feeds } = runRace();
    const midRaceGreen = feeds.find((f) => f.flag_state === 1 && f.lap_number > 15)!;
    const greenDeltas = midRaceGreen.vehicles
      .filter((v) => v.running_position > 1 && v.running_position <= 10 && typeof v.delta === 'number' && v.delta > 0)
      .map((v) => v.delta);
    expect(Math.max(...greenDeltas)).toBeGreaterThan(1); // real spread in seconds

    // find a settled caution frame (several polls after the yellow flew)
    const yellowIdx = feeds.findIndex((f) => f.flag_state === 2);
    const settled = feeds.slice(yellowIdx).filter((f) => f.flag_state === 2).at(-1)!;
    const top5Deltas = settled.vehicles
      .filter((v) => v.running_position > 1 && v.running_position <= 5)
      .map((v) => (typeof v.delta === 'number' ? Math.abs(v.delta) : 0));
    expect(Math.max(...top5Deltas)).toBeLessThan(Math.max(...greenDeltas));
  });

  it('scores stage points after each of the first two stages', () => {
    const { race } = runRace();
    const stages = race.getStagePoints();
    expect(stages.length).toBe(2);
    expect(stages[0].results).toHaveLength(10);
    expect(stages[0].results![0].stage_points).toBe(10);
  });

  it('records pit stops during green-flag cycles', () => {
    const { feeds } = runRace();
    const last = feeds[feeds.length - 1];
    const stops = last.vehicles.reduce((s, v) => s + v.pit_stops.length, 0);
    expect(stops).toBeGreaterThan(10);
  });

  it('emits flag events consistent with the feed', () => {
    const { race } = runRace();
    const events = race.getFlagEvents();
    expect(events[0].flag_state).toBe(8);
    expect(events.some((e) => e.comment?.includes('Stage 1'))).toBe(true);
    expect(events[events.length - 1].flag_state).toBe(5);
  });
});
