import { create } from 'zustand';
import type { LiveFeed } from '@nascar/shared';

export interface HistorySample {
  lap: number;
  timestamp: number;
  position: number;
  lastLapTime: number; // seconds; 0 = not available
  lastLapSpeed: number; // mph; 0 = not available
  gapSeconds: number | null; // seconds behind leader; null when lapped (unit mismatch) or unknown
  flagState: number;
}

interface RaceHistoryState {
  sessionKey: string | null;
  history: Record<string, HistorySample[]>;
  lastRecordedLap: Record<string, number>;
  /** Appends a sample for every car that has completed a new lap since the last poll. */
  recordFeed: (feed: LiveFeed) => void;
  reset: () => void;
}

function sessionKeyFor(feed: LiveFeed): string {
  return `${feed.race_id}_${feed.run_id}_${feed.track_id}`;
}

export const useRaceHistory = create<RaceHistoryState>()((set, get) => ({
  sessionKey: null,
  history: {},
  lastRecordedLap: {},

  recordFeed: (feed) => {
    const key = sessionKeyFor(feed);
    const state = get();
    if (state.sessionKey !== key) {
      set({ sessionKey: key, history: {}, lastRecordedLap: {} });
    }

    const history = { ...get().history };
    const lastRecordedLap = { ...get().lastRecordedLap };
    let changed = false;

    for (const v of feed.vehicles) {
      const car = v.vehicle_number;
      const prevLap = lastRecordedLap[car] ?? -1;
      if (v.laps_completed <= prevLap) continue;

      const sample: HistorySample = {
        lap: v.laps_completed,
        timestamp: Date.now(),
        position: v.running_position,
        lastLapTime: v.last_lap_time > 0 ? v.last_lap_time : 0,
        lastLapSpeed: v.last_lap_speed > 0 ? v.last_lap_speed : 0,
        gapSeconds: v.running_position === 1 ? 0 : v.delta >= 0 ? v.delta : null,
        flagState: feed.flag_state,
      };
      history[car] = [...(history[car] ?? []), sample];
      lastRecordedLap[car] = v.laps_completed;
      changed = true;
    }

    if (changed) set({ history, lastRecordedLap });
  },

  reset: () => set({ sessionKey: null, history: {}, lastRecordedLap: {} }),
}));
