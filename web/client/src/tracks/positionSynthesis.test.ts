import { describe, expect, it } from 'vitest';
import type { LiveFeed, Vehicle } from '@nascar/shared';
import { computeTargets, initialSynthesisState } from './positionSynthesis';

function makeVehicle(overrides: Partial<Vehicle>): Vehicle {
  return {
    average_restart_speed: 0,
    average_running_position: 0,
    average_speed: 180,
    best_lap: 10,
    best_lap_speed: 190,
    best_lap_time: 47.5,
    vehicle_manufacturer: 'Chv',
    vehicle_number: '0',
    driver: { driver_id: 1, full_name: 'Test Driver', first_name: 'Test', last_name: 'Driver', is_in_chase: false },
    vehicle_elapsed_time: 0,
    fastest_laps_run: 0,
    laps_position_improved: 0,
    laps_completed: 50,
    laps_led: [],
    last_lap_speed: 185,
    last_lap_time: 48,
    passes_made: 0,
    passing_differential: 0,
    position_differential_last_10_percent: 0,
    pit_stops: [],
    qualifying_status: 0,
    running_position: 1,
    status: 1,
    delta: 0,
    sponsor_name: '',
    starting_position: 1,
    times_passed: 0,
    quality_passes: 0,
    is_on_track: true,
    is_on_dvp: false,
    ...overrides,
  };
}

function makeFeed(flag: number, vehicles: Vehicle[]): LiveFeed {
  return {
    lap_number: 51,
    elapsed_time: 2500,
    flag_state: flag,
    race_id: 1,
    laps_in_race: 160,
    laps_to_go: 109,
    run_id: 1,
    run_name: 'Test',
    series_id: 1,
    time_of_day: 0,
    time_of_day_os: '',
    track_id: 105,
    track_length: 2.5,
    track_name: 'Daytona',
    run_type: 3,
    number_of_caution_segments: 0,
    number_of_caution_laps: 0,
    number_of_lead_changes: 0,
    number_of_leaders: 1,
    avg_diff_1to3: 0,
    stage: { stage_num: 2, finish_at_lap: 95, laps_in_stage: 50 },
    vehicles,
  };
}

const field = (deltas: Array<number | undefined>) =>
  deltas.map((delta, i) =>
    makeVehicle({
      vehicle_number: String(i + 1),
      running_position: i + 1,
      delta: delta ?? 0,
      laps_completed: delta != null && delta < 0 ? 50 + Math.round(delta) : 50,
    }),
  );

describe('computeTargets', () => {
  it('advances the leader continuously under green', () => {
    const state = initialSynthesisState();
    const feed = makeFeed(1, field([0, 1.2, 2.4]));
    const t0 = computeTargets(feed, state, 0)[0].progress;
    computeTargets(feed, state, 12); // 12s at ~48s/lap = ~0.25 laps
    const t1 = computeTargets(feed, state, 0)[0].progress;
    const moved = (t1 - t0 + 1) % 1;
    expect(moved).toBeGreaterThan(0.2);
    expect(moved).toBeLessThan(0.3);
  });

  it('spaces cars by real time gaps under green', () => {
    const state = initialSynthesisState();
    const feed = makeFeed(1, field([0, 4.8, 9.6, 14.4])); // 4.8s ≈ 0.1 laps at 48s lap
    const targets = computeTargets(feed, state, 1);
    const gap12 = (targets[0].progress - targets[1].progress + 1) % 1;
    const gap13 = (targets[0].progress - targets[2].progress + 1) % 1;
    expect(gap12).toBeCloseTo(0.1, 1);
    expect(gap13).toBeCloseTo(0.2, 1);
  });

  it('bunches the field tightly under caution', () => {
    const state = initialSynthesisState();
    const feed = makeFeed(2, field([0, 4.8, 9.6, 14.4]));
    const targets = computeTargets(feed, state, 1);
    const gapFirstToLast = (targets[0].progress - targets[3].progress + 1) % 1;
    expect(gapFirstToLast).toBeLessThan(0.05);
  });

  it('freezes the field after the checkered flag', () => {
    const state = initialSynthesisState();
    const feed = makeFeed(5, field([0, 1, 2]));
    computeTargets(feed, state, 0);
    const before = state.leaderProgress;
    computeTargets(feed, state, 10);
    expect(state.leaderProgress).toBe(before);
  });

  it('marks lapped cars and keeps them behind on track', () => {
    const state = initialSynthesisState();
    const feed = makeFeed(1, field([0, 3.5, 7.1, -1])); // P4 one lap down
    const targets = computeTargets(feed, state, 1);
    expect(targets[3].lapsDown).toBe(1);
    const gapToLeader = (targets[0].progress - targets[3].progress + 1) % 1;
    expect(gapToLeader).toBeGreaterThan(0.3);
  });

  it('flags cars in the pits', () => {
    const state = initialSynthesisState();
    const vehicles = field([0, 3.5, 7.1]);
    vehicles[2] = { ...vehicles[2], is_on_track: false };
    const targets = computeTargets(makeFeed(1, vehicles), state, 1);
    expect(targets[2].inPit).toBe(true);
  });

  it('falls back to position spacing when deltas are unusable', () => {
    const state = initialSynthesisState();
    const feed = makeFeed(1, field([0, 0, 0, 0])); // all-zero deltas
    const targets = computeTargets(feed, state, 1);
    const gaps = targets.slice(1).map((t, i) => (targets[i].progress - t.progress + 1) % 1);
    for (const g of gaps) expect(g).toBeGreaterThan(0.005);
  });
});
