import type { LiveFeed, Vehicle } from '@nascar/shared';

/**
 * The NASCAR feed has no coordinates — only running_position and delta
 * (seconds behind the leader; whole negative numbers = laps down). This
 * module synthesizes a lap-progress target (0-1 around the track) per car,
 * an improved port of track_overlay.py _calculate_car_positions:
 *  - the leader advances continuously by dt / leader lap time
 *  - cars are spaced by real time gaps converted to track distance
 *  - under caution/red the field bunches into pace-car spacing
 *  - lapped cars sit a physically-meaningful distance back
 */

export interface CarTarget {
  carNumber: string;
  progress: number; // 0-1 around the track
  lapsDown: number;
  inPit: boolean;
  running: boolean;
  position: number;
}

export interface SynthesisState {
  leaderProgress: number; // accumulates continuously across polls
  initialized: boolean;
}

export function initialSynthesisState(): SynthesisState {
  return { leaderProgress: 0.5, initialized: false };
}

const FALLBACK_LAP_TIME = 45;
const CAUTION_PACE_FACTOR = 2.3; // pace car ≈ 2.3x slower than race pace
const CAUTION_SPACING = 0.007; // laps between cars behind the pace car
const GREEN_FALLBACK_SPACING = 0.02; // when delta data is unusable

export function estimateLapTime(v: Vehicle | undefined, trackLengthMiles: number): number {
  if (!v) return FALLBACK_LAP_TIME;
  if (v.last_lap_time > 0 && v.last_lap_time < 600) return v.last_lap_time;
  if (v.best_lap_time > 0 && v.best_lap_time < 600) return v.best_lap_time;
  if (v.average_speed > 0) return (trackLengthMiles / v.average_speed) * 3600;
  return FALLBACK_LAP_TIME;
}

function wrap01(t: number): number {
  const f = t % 1;
  return f < 0 ? f + 1 : f;
}

/**
 * Advance the synthesis state by dtSeconds and compute per-car target
 * positions from the current feed. Pure aside from the passed-in state.
 */
export function computeTargets(
  feed: LiveFeed,
  state: SynthesisState,
  dtSeconds: number,
): CarTarget[] {
  const vehicles = [...feed.vehicles].sort((a, b) => a.running_position - b.running_position);
  if (vehicles.length === 0) return [];
  const leader = vehicles[0];
  const leaderLapTime = estimateLapTime(leader, feed.track_length);

  const flag = feed.flag_state;
  const isCaution = flag === 2;
  const isStopped = flag === 3 || flag === 5 || flag === 9; // red, checkered, cold
  const isGreenish = flag === 1 || flag === 4; // green, white

  // advance the leader around the track
  let speedFactor = 0;
  if (isGreenish) speedFactor = 1;
  else if (isCaution) speedFactor = 1 / CAUTION_PACE_FACTOR;
  else if (!isStopped) speedFactor = 0.4; // hot track / pace laps
  state.leaderProgress += (dtSeconds / leaderLapTime) * speedFactor;
  state.initialized = true;

  const leaderLaps = leader.laps_completed;
  const deltasUsable =
    isGreenish &&
    vehicles.filter((v) => v.running_position > 1 && typeof v.delta === 'number' && v.delta > 0).length >=
      Math.min(3, vehicles.length - 1);

  let lappedRank = 0;
  return vehicles.map((v, idx) => {
    const lapsDown = Math.max(0, leaderLaps - v.laps_completed);
    const inPit = !v.is_on_track && v.status === 1;
    const running = v.status === 1;

    let behindLaps: number; // distance behind the leader, in laps
    if (v.running_position === 1) {
      behindLaps = 0;
    } else if (isCaution || isStopped || !deltasUsable) {
      // field bunched behind the pace car (or no trustworthy delta data)
      const spacing = isCaution || isStopped ? CAUTION_SPACING : GREEN_FALLBACK_SPACING;
      behindLaps = idx * spacing;
      if (lapsDown > 0 && !isCaution && !isStopped) behindLaps += 0.3;
    } else if (typeof v.delta === 'number' && v.delta > 0) {
      behindLaps = Math.min(0.95, v.delta / leaderLapTime);
    } else if (lapsDown > 0) {
      // lapped: the feed only gives whole laps down — spread them along the
      // back half of the track so they don't stack on one pixel
      lappedRank += 1;
      behindLaps = 0.35 + (lappedRank * 0.08) % 0.5;
    } else {
      behindLaps = idx * GREEN_FALLBACK_SPACING;
    }

    return {
      carNumber: v.vehicle_number,
      progress: wrap01(state.leaderProgress - behindLaps),
      lapsDown,
      inPit,
      running,
      position: v.running_position,
    };
  });
}
