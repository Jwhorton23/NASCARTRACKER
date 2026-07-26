import { beforeEach, describe, expect, it } from 'vitest';
import type { LiveFeed, Vehicle } from '@nascar/shared';
import { useRaceHistory } from './raceHistoryStore';

function makeVehicle(overrides: Partial<Vehicle>): Vehicle {
  return {
    average_restart_speed: 0,
    average_running_position: 0,
    average_speed: 180,
    best_lap: 1,
    best_lap_speed: 190,
    best_lap_time: 47.5,
    vehicle_manufacturer: 'Chv',
    vehicle_number: '5',
    driver: { driver_id: 1, full_name: 'Test Driver', first_name: 'Test', last_name: 'Driver', is_in_chase: false },
    vehicle_elapsed_time: 0,
    fastest_laps_run: 0,
    laps_position_improved: 0,
    laps_completed: 1,
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

function makeFeed(overrides: Partial<LiveFeed>): LiveFeed {
  return {
    lap_number: 1,
    elapsed_time: 0,
    flag_state: 1,
    race_id: 100,
    laps_in_race: 160,
    laps_to_go: 159,
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
    stage: { stage_num: 1, finish_at_lap: 45, laps_in_stage: 45 },
    vehicles: [makeVehicle({})],
    ...overrides,
  };
}

describe('raceHistoryStore', () => {
  beforeEach(() => {
    useRaceHistory.getState().reset();
  });

  it('records one sample per car per completed lap', () => {
    const { recordFeed } = useRaceHistory.getState();
    recordFeed(makeFeed({ vehicles: [makeVehicle({ laps_completed: 1, last_lap_time: 48 })] }));
    recordFeed(makeFeed({ vehicles: [makeVehicle({ laps_completed: 1, last_lap_time: 48 })] })); // same lap, no dup
    recordFeed(makeFeed({ vehicles: [makeVehicle({ laps_completed: 2, last_lap_time: 47.8 })] }));

    const history = useRaceHistory.getState().history['5'];
    expect(history).toHaveLength(2);
    expect(history[0].lap).toBe(1);
    expect(history[1].lap).toBe(2);
    expect(history[1].lastLapTime).toBe(47.8);
  });

  it('resets history when the session changes (new race_id)', () => {
    const { recordFeed } = useRaceHistory.getState();
    recordFeed(makeFeed({ race_id: 1, vehicles: [makeVehicle({ laps_completed: 5 })] }));
    expect(useRaceHistory.getState().history['5']).toHaveLength(1);

    recordFeed(makeFeed({ race_id: 2, vehicles: [makeVehicle({ laps_completed: 1 })] }));
    const history = useRaceHistory.getState().history['5'];
    expect(history).toHaveLength(1);
    expect(history[0].lap).toBe(1);
  });

  it('stores a null gapSeconds for lapped cars (negative whole-lap delta)', () => {
    const { recordFeed } = useRaceHistory.getState();
    recordFeed(
      makeFeed({
        vehicles: [makeVehicle({ vehicle_number: '9', running_position: 5, delta: -1, laps_completed: 1 })],
      }),
    );
    expect(useRaceHistory.getState().history['9'][0].gapSeconds).toBeNull();
  });

  it('records the leader with a zero gap regardless of delta field', () => {
    const { recordFeed } = useRaceHistory.getState();
    recordFeed(makeFeed({ vehicles: [makeVehicle({ running_position: 1, delta: 0, laps_completed: 1 })] }));
    expect(useRaceHistory.getState().history['5'][0].gapSeconds).toBe(0);
  });

  it('tracks each car independently within the same feed', () => {
    const { recordFeed } = useRaceHistory.getState();
    recordFeed(
      makeFeed({
        vehicles: [
          makeVehicle({ vehicle_number: '5', running_position: 1, laps_completed: 1 }),
          makeVehicle({ vehicle_number: '11', running_position: 2, laps_completed: 1, delta: 2.1 }),
        ],
      }),
    );
    const state = useRaceHistory.getState();
    expect(state.history['5']).toHaveLength(1);
    expect(state.history['11']).toHaveLength(1);
    expect(state.history['11'][0].gapSeconds).toBe(2.1);
  });
});
