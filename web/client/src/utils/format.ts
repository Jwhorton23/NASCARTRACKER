import type { LiveFeed, Vehicle } from '@nascar/shared';
import { PRACTICE_LAPS } from '@nascar/shared';

export function formatLapTime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—';
  if (seconds < 60) return seconds.toFixed(3);
  const m = Math.floor(seconds / 60);
  return `${m}:${(seconds - m * 60).toFixed(3).padStart(6, '0')}`;
}

export function formatDelta(v: Vehicle): string {
  if (v.running_position === 1) return 'Leader';
  const d = v.delta;
  if (d == null) return '—';
  if (d < 0) {
    const laps = Math.abs(Math.round(d));
    return `${laps} lap${laps > 1 ? 's' : ''}`;
  }
  return `+${d.toFixed(3)}`;
}

export function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

export function sortedVehicles(feed: LiveFeed): Vehicle[] {
  return [...feed.vehicles].sort((a, b) => a.running_position - b.running_position);
}

export function isPractice(feed: LiveFeed): boolean {
  return feed.laps_in_race >= PRACTICE_LAPS;
}

export function lapsLedTotal(v: Vehicle): number {
  return (v.laps_led ?? []).reduce((sum, r) => sum + Math.max(0, r.end_lap - r.start_lap + 1), 0);
}

export interface StageProgressInfo {
  stageNum: number;
  lapsIntoStage: number;
  lapsInStage: number;
  finishAtLap: number;
  fraction: number;
}

export function stageProgress(feed: LiveFeed): StageProgressInfo | null {
  const s = feed.stage;
  if (!s || s.finish_at_lap >= PRACTICE_LAPS || s.laps_in_stage <= 0) return null;
  const lapsIntoStage = Math.max(0, Math.min(s.laps_in_stage, s.laps_in_stage - (s.finish_at_lap - feed.lap_number)));
  return {
    stageNum: s.stage_num,
    lapsIntoStage,
    lapsInStage: s.laps_in_stage,
    finishAtLap: s.finish_at_lap,
    fraction: lapsIntoStage / s.laps_in_stage,
  };
}

export function raceProgress(feed: LiveFeed): number {
  if (isPractice(feed) || feed.laps_in_race <= 0) return 0;
  return Math.max(0, Math.min(1, feed.lap_number / feed.laps_in_race));
}

/** Session-best lap time across the field (for purple highlighting). */
export function sessionBestLap(feed: LiveFeed): number {
  let best = Infinity;
  for (const v of feed.vehicles) {
    if (v.best_lap_time > 0 && v.best_lap_time < best) best = v.best_lap_time;
  }
  return best;
}
