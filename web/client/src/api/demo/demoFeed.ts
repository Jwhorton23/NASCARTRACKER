import type { FlagEvent, LiveFeed, PitStop, PointsEntry, StagePointsFeed, Vehicle } from '@nascar/shared';

/**
 * Synthetic race generator. Simulates a 160-lap superspeedway race at ~6x
 * speed with stage cautions, pit stops, a white flag, and a checkered finish,
 * so every dashboard is exercised with zero external dependencies.
 */

const TIME_SCALE = 6; // simulated seconds per wall-clock second
const BASE_LAP_TIME = 48; // seconds at Daytona pace
const CAUTION_LAP_TIME = 110; // pace-car speed
const RACE_LAPS = 160;
const STAGE_ENDS = [45, 95, RACE_LAPS];
const TRACK_ID = 105;
const TRACK_NAME = 'Daytona International Speedway';
const TRACK_LENGTH = 2.5;

interface RosterEntry {
  num: string;
  first: string;
  last: string;
  mfr: 'Tyt' | 'Chv' | 'Frd';
  sponsor: string;
  chase: boolean;
}

const ROSTER: RosterEntry[] = [
  { num: '5', first: 'Kyle', last: 'Larson', mfr: 'Chv', sponsor: 'HendrickCars.com', chase: true },
  { num: '11', first: 'Denny', last: 'Hamlin', mfr: 'Tyt', sponsor: 'FedEx', chase: true },
  { num: '24', first: 'William', last: 'Byron', mfr: 'Chv', sponsor: 'Axalta', chase: true },
  { num: '12', first: 'Ryan', last: 'Blaney', mfr: 'Frd', sponsor: 'Menards', chase: true },
  { num: '22', first: 'Joey', last: 'Logano', mfr: 'Frd', sponsor: 'Shell-Pennzoil', chase: true },
  { num: '19', first: 'Chase', last: 'Briscoe', mfr: 'Tyt', sponsor: 'Bass Pro Shops', chase: true },
  { num: '9', first: 'Chase', last: 'Elliott', mfr: 'Chv', sponsor: 'NAPA', chase: true },
  { num: '20', first: 'Christopher', last: 'Bell', mfr: 'Tyt', sponsor: 'Rheem', chase: true },
  { num: '2', first: 'Austin', last: 'Cindric', mfr: 'Frd', sponsor: 'Discount Tire', chase: false },
  { num: '45', first: 'Tyler', last: 'Reddick', mfr: 'Tyt', sponsor: 'Jordan Brand', chase: true },
  { num: '48', first: 'Alex', last: 'Bowman', mfr: 'Chv', sponsor: 'Ally', chase: false },
  { num: '17', first: 'Chris', last: 'Buescher', mfr: 'Frd', sponsor: 'Fastenal', chase: false },
  { num: '6', first: 'Brad', last: 'Keselowski', mfr: 'Frd', sponsor: 'Castrol', chase: false },
  { num: '23', first: 'Bubba', last: 'Wallace', mfr: 'Tyt', sponsor: 'McDonald\'s', chase: true },
  { num: '1', first: 'Ross', last: 'Chastain', mfr: 'Chv', sponsor: 'Busch Light', chase: false },
  { num: '54', first: 'Ty', last: 'Gibbs', mfr: 'Tyt', sponsor: 'Monster Energy', chase: false },
  { num: '8', first: 'Kyle', last: 'Busch', mfr: 'Chv', sponsor: 'Cheddar\'s', chase: false },
  { num: '3', first: 'Austin', last: 'Dillon', mfr: 'Chv', sponsor: 'Get Bioethanol', chase: false },
  { num: '34', first: 'Todd', last: 'Gilliland', mfr: 'Frd', sponsor: 'Love\'s', chase: false },
  { num: '38', first: 'Zane', last: 'Smith', mfr: 'Frd', sponsor: 'Speedco', chase: false },
  { num: '21', first: 'Josh', last: 'Berry', mfr: 'Frd', sponsor: 'Motorcraft', chase: false },
  { num: '10', first: 'Ty', last: 'Dillon', mfr: 'Chv', sponsor: 'Sea Best', chase: false },
  { num: '41', first: 'Cole', last: 'Custer', mfr: 'Frd', sponsor: 'HaasTooling', chase: false },
  { num: '99', first: 'Daniel', last: 'Suarez', mfr: 'Chv', sponsor: 'Freeway Insurance', chase: false },
  { num: '43', first: 'Erik', last: 'Jones', mfr: 'Tyt', sponsor: 'Family Dollar', chase: false },
  { num: '7', first: 'Justin', last: 'Haley', mfr: 'Chv', sponsor: 'Gainbridge', chase: false },
  { num: '77', first: 'Carson', last: 'Hocevar', mfr: 'Chv', sponsor: 'Delaware Life', chase: false },
  { num: '71', first: 'Michael', last: 'McDowell', mfr: 'Chv', sponsor: 'DePaul', chase: false },
  { num: '4', first: 'Noah', last: 'Gragson', mfr: 'Frd', sponsor: 'Bass Pro Shops', chase: false },
  { num: '16', first: 'AJ', last: 'Allmendinger', mfr: 'Chv', sponsor: 'Action Industries', chase: false },
  { num: '47', first: 'Ricky', last: 'Stenhouse', mfr: 'Chv', sponsor: 'Kroger', chase: false },
  { num: '35', first: 'Riley', last: 'Herbst', mfr: 'Tyt', sponsor: 'Monster Energy', chase: false },
  { num: '60', first: 'Ryan', last: 'Preece', mfr: 'Frd', sponsor: 'Kroger', chase: false },
  { num: '51', first: 'Cody', last: 'Ware', mfr: 'Frd', sponsor: 'Arby\'s', chase: false },
  { num: '62', first: 'Jesse', last: 'Love', mfr: 'Chv', sponsor: 'Whelen', chase: false },
  { num: '66', first: 'Chad', last: 'Finchum', mfr: 'Tyt', sponsor: 'Bommarito', chase: false },
];

// deterministic PRNG so demo races are repeatable
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CarState {
  roster: RosterEntry;
  driverId: number;
  progress: number; // total laps (float)
  pace: number; // multiplier on base lap time (lower = faster)
  lastLapTime: number;
  bestLapTime: number;
  bestLapAt: number;
  lastLapMark: number; // integer lap at which lastLapTime was rolled
  startPos: number;
  inPitUntil: number; // sim-time until which the car is on pit road
  nextPitLap: number;
  pitStops: PitStop[];
  lapsLed: Array<{ start_lap: number; end_lap: number }>;
  fastestLaps: number;
  running: boolean; // false = crashed out
  outAtLap: number;
}

interface FlagPhase {
  untilLap: number;
  flag: number;
}

export class DemoRace {
  private rand = mulberry32(20260712);
  private cars: CarState[] = [];
  private simTime = 0; // simulated race seconds
  private lastWall = 0;
  private started = Date.now();
  private flagEvents: FlagEvent[] = [];
  private currentFlag = 8; // hot track before green
  private cautionUntil = -1; // sim-time when current caution ends
  private cautionsServed = new Set<number>();
  private cautionLaps = 0;
  private leadChanges = 0;
  private leadersSeen = new Set<string>();
  private lastLeader = '';
  private stagePoints: StagePointsFeed[] = [];
  private stagesScored = new Set<number>();

  constructor() {
    ROSTER.forEach((roster, i) => {
      this.cars.push({
        roster,
        driverId: 4000 + i,
        progress: -(i * 0.008), // gridded behind the line
        pace: 1 + i * 0.0012 + this.rand() * 0.004,
        lastLapTime: 0,
        bestLapTime: Infinity,
        bestLapAt: 0,
        lastLapMark: 0,
        startPos: i + 1,
        inPitUntil: -1,
        nextPitLap: 38 + Math.floor(this.rand() * 8),
        pitStops: [],
        lapsLed: [],
        fastestLaps: 0,
        running: true,
        outAtLap: 0,
      });
    });
    this.lastWall = Date.now();
    this.pushFlag(8, 0, 'Hot track — pace laps');
  }

  private pushFlag(flag: number, lap: number, comment?: string, beneficiary?: string) {
    this.currentFlag = flag;
    this.flagEvents.push({
      lap_number: lap,
      flag_state: flag,
      elapsed_time: Math.floor(this.simTime),
      comment,
      beneficiary,
      time_of_day: Math.floor((this.started / 1000 + this.simTime) % 86400),
      time_of_day_os: new Date(this.started + this.simTime * 1000).toISOString(),
    });
  }

  private leader(): CarState {
    return this.cars.reduce((a, b) => (b.progress > a.progress ? b : a));
  }

  private advance() {
    const now = Date.now();
    let dt = ((now - this.lastWall) / 1000) * TIME_SCALE;
    this.lastWall = now;
    // clamp long gaps (tab was hidden) so the sim stays smooth
    dt = Math.min(dt, 30);

    const steps = Math.max(1, Math.ceil(dt / 2));
    for (let s = 0; s < steps; s++) this.step(dt / steps);
  }

  private step(dt: number) {
    if (this.currentFlag === 5) return; // race over — freeze everything
    this.simTime += dt;
    const leaderBefore = this.leader();
    const leaderLap = Math.floor(leaderBefore.progress);

    // ---- flag scripting ----
    if (this.currentFlag === 8 && this.simTime > 20) {
      this.pushFlag(1, 1, 'Green flag');
    }
    const isCaution = this.currentFlag === 2 || this.currentFlag === 3;

    // stage-end + scripted cautions
    if (this.currentFlag === 1) {
      const stageEnd = STAGE_ENDS.slice(0, 2).find(
        (end) => leaderLap >= end && !this.cautionsServed.has(end),
      );
      const scripted = [26, 118].find((lap) => leaderLap >= lap && !this.cautionsServed.has(lap));
      const trigger = stageEnd ?? scripted;
      if (trigger !== undefined) {
        this.cautionsServed.add(trigger);
        const lucky = this.firstLappedCar();
        this.pushFlag(
          2,
          leaderLap,
          stageEnd ? `Caution — End of Stage ${STAGE_ENDS.indexOf(stageEnd) + 1}` : 'Caution — debris in turn 2',
          lucky,
        );
        this.cautionUntil = this.simTime + 6 * CAUTION_LAP_TIME * 0.35;
      }
      // white / checkered
      if (leaderLap >= RACE_LAPS - 1 && this.currentFlag === 1) {
        this.pushFlag(4, RACE_LAPS, 'White flag — one to go');
      }
    } else if (this.currentFlag === 2 && this.simTime > this.cautionUntil) {
      this.pushFlag(1, leaderLap + 1, 'Green flag — back to racing');
    } else if (this.currentFlag === 4 && leaderBefore.progress >= RACE_LAPS) {
      this.pushFlag(5, RACE_LAPS, 'Checkered flag');
      return;
    }

    if (isCaution) this.cautionLaps += dt / CAUTION_LAP_TIME;

    // ---- car movement ----
    const leaderProgress = leaderBefore.progress;
    const sorted = [...this.cars].sort((a, b) => b.progress - a.progress);

    sorted.forEach((car, idx) => {
      if (!car.running) return;

      // pit stops (green-flag cycles)
      const lap = Math.floor(car.progress);
      if (
        this.currentFlag === 1 &&
        lap >= car.nextPitLap &&
        car.inPitUntil < this.simTime &&
        lap < RACE_LAPS - 10
      ) {
        car.inPitUntil = this.simTime + 32;
        car.nextPitLap = lap + 42 + Math.floor(this.rand() * 10);
        car.pitStops.push({
          pit_in_elapsed_time: Math.floor(this.simTime),
          pit_out_elapsed_time: Math.floor(this.simTime + 32),
          pit_in_lap_count: lap,
          pit_out_lap_count: lap + 1,
          positions_gained_lost: Math.floor(this.rand() * 7) - 3,
        });
      }
      const inPit = car.inPitUntil > this.simTime;

      let lapTime: number;
      if (inPit) {
        lapTime = BASE_LAP_TIME * 3;
      } else if (this.currentFlag === 2 || this.currentFlag === 3) {
        // caution: field closes to pace-car spacing behind the leader
        const target = leaderProgress - idx * 0.006;
        const gap = target - car.progress;
        lapTime = gap > 0.02 ? CAUTION_LAP_TIME * 0.55 : CAUTION_LAP_TIME;
        if (this.currentFlag === 3) lapTime = Infinity; // red flag: stopped
      } else {
        // green: pace + drafting noise; backmarkers slightly slower
        const noise = 1 + (this.rand() - 0.5) * 0.01;
        lapTime = BASE_LAP_TIME * car.pace * noise;
      }

      const before = car.progress;
      if (Number.isFinite(lapTime)) car.progress += dt / lapTime;

      // lap crossing: roll last/best lap
      if (Math.floor(car.progress) > Math.floor(before) && car.progress > 1) {
        const completed = Math.floor(car.progress);
        car.lastLapTime = +(lapTime * (0.98 + this.rand() * 0.04)).toFixed(3);
        car.lastLapMark = completed;
        if (this.currentFlag === 1 && car.lastLapTime < car.bestLapTime) {
          car.bestLapTime = car.lastLapTime;
          car.bestLapAt = completed;
          car.fastestLaps += 1;
        }
      }

      // rare mechanical DNF mid-race
      if (this.currentFlag === 1 && this.rand() < dt * 0.00002 && idx > 20 && lap > 40) {
        car.running = false;
        car.outAtLap = lap;
      }
    });

    // ---- leader bookkeeping ----
    const newLeader = this.leader();
    if (newLeader.roster.num !== this.lastLeader) {
      if (this.lastLeader) this.leadChanges += 1;
      this.lastLeader = newLeader.roster.num;
      this.leadersSeen.add(newLeader.roster.num);
      const lap = Math.max(1, Math.floor(newLeader.progress));
      const ranges = newLeader.lapsLed;
      if (!ranges.length || ranges[ranges.length - 1].end_lap < lap - 1) {
        ranges.push({ start_lap: lap, end_lap: lap });
      }
    }
    const lr = newLeader.lapsLed;
    if (lr.length) lr[lr.length - 1].end_lap = Math.max(lr[lr.length - 1].end_lap, Math.floor(newLeader.progress));

    // ---- stage points scoring ----
    for (const [i, end] of STAGE_ENDS.slice(0, 2).entries()) {
      if (Math.floor(newLeader.progress) >= end && !this.stagesScored.has(end)) {
        this.stagesScored.add(end);
        const order = [...this.cars].sort((a, b) => b.progress - a.progress).slice(0, 10);
        this.stagePoints.push({
          race_id: 9999,
          run_id: 1,
          stage_number: i + 1,
          results: order.map((c, p) => ({
            position: p + 1,
            vehicle_number: c.roster.num,
            driver_id: c.driverId,
            full_name: `${c.roster.first} ${c.roster.last}`,
            stage_points: 10 - p,
          })),
        });
      }
    }
  }

  private firstLappedCar(): string | undefined {
    const leaderLaps = Math.floor(this.leader().progress);
    const lapped = [...this.cars]
      .filter((c) => c.running && Math.floor(c.progress) < leaderLaps)
      .sort((a, b) => b.progress - a.progress);
    return lapped[0]?.roster.num;
  }

  getFeed(): LiveFeed {
    this.advance();
    const sorted = [...this.cars].sort((a, b) => {
      if (a.running !== b.running) return a.running ? -1 : 1;
      return b.progress - a.progress;
    });
    const leader = sorted[0];
    const leaderLapTime = leader.lastLapTime || BASE_LAP_TIME;
    const lapNumber = Math.min(RACE_LAPS, Math.max(0, Math.floor(leader.progress) + 1));
    const stageIdx = STAGE_ENDS.findIndex((end) => lapNumber <= end);
    const stageNum = stageIdx === -1 ? 3 : stageIdx + 1;
    const stageEnd = STAGE_ENDS[stageIdx === -1 ? 2 : stageIdx];
    const stageStart = stageIdx <= 0 ? 0 : STAGE_ENDS[stageIdx - 1];

    const vehicles: Vehicle[] = sorted.map((car, idx) => {
      // laps down = full laps of actual distance deficit (not lap-counter
      // crossings, which would mark the whole field "lapped" on lap 1)
      const lapsDown = Math.max(0, Math.floor(leader.progress - car.progress));
      const deltaSec = (leader.progress - car.progress) * leaderLapTime;
      // NASCAR convention: whole negative numbers for cars laps down
      const delta = car.running ? (lapsDown >= 1 ? -lapsDown : +deltaSec.toFixed(3)) : -99;
      const avgSpeed = (TRACK_LENGTH / (BASE_LAP_TIME * car.pace)) * 3600;
      return {
        average_restart_speed: +(avgSpeed * 0.7).toFixed(2),
        average_running_position: idx + 1,
        average_speed: +avgSpeed.toFixed(2),
        best_lap: car.bestLapAt,
        best_lap_speed: Number.isFinite(car.bestLapTime)
          ? +((TRACK_LENGTH / car.bestLapTime) * 3600).toFixed(2)
          : 0,
        best_lap_time: Number.isFinite(car.bestLapTime) ? car.bestLapTime : 0,
        vehicle_manufacturer: car.roster.mfr,
        vehicle_number: car.roster.num,
        driver: {
          driver_id: car.driverId,
          full_name: `${car.roster.first} ${car.roster.last}`,
          first_name: car.roster.first,
          last_name: car.roster.last,
          is_in_chase: car.roster.chase,
        },
        vehicle_elapsed_time: +this.simTime.toFixed(1),
        fastest_laps_run: car.fastestLaps,
        laps_position_improved: Math.max(0, car.startPos - (idx + 1)),
        laps_completed: Math.max(0, Math.floor(car.progress)),
        laps_led: car.lapsLed,
        last_lap_speed: car.lastLapTime ? +((TRACK_LENGTH / car.lastLapTime) * 3600).toFixed(2) : 0,
        last_lap_time: car.lastLapTime,
        passes_made: Math.floor(this.simTime / 60) * 2,
        passing_differential: car.startPos - (idx + 1),
        position_differential_last_10_percent: 0,
        pit_stops: car.pitStops,
        qualifying_status: 0,
        running_position: idx + 1,
        status: car.running ? 1 : 3,
        delta,
        sponsor_name: car.roster.sponsor,
        starting_position: car.startPos,
        times_passed: Math.floor(this.simTime / 90),
        quality_passes: Math.floor(this.simTime / 120),
        is_on_track: car.running && car.inPitUntil < this.simTime,
        is_on_dvp: false,
      };
    });

    return {
      lap_number: lapNumber,
      elapsed_time: Math.floor(this.simTime),
      flag_state: this.currentFlag,
      race_id: 9999,
      laps_in_race: RACE_LAPS,
      laps_to_go: Math.max(0, RACE_LAPS - lapNumber),
      run_id: 1,
      run_name: 'Demo 400 (Simulated)',
      series_id: 1,
      time_of_day: Math.floor((this.started / 1000 + this.simTime) % 86400),
      time_of_day_os: new Date(this.started + this.simTime * 1000).toISOString(),
      track_id: TRACK_ID,
      track_length: TRACK_LENGTH,
      track_name: TRACK_NAME,
      run_type: 3,
      number_of_caution_segments: this.cautionsServed.size,
      number_of_caution_laps: Math.floor(this.cautionLaps),
      number_of_lead_changes: this.leadChanges,
      number_of_leaders: this.leadersSeen.size,
      avg_diff_1to3: vehicles[2] && typeof vehicles[2].delta === 'number' && vehicles[2].delta > 0
        ? +(vehicles[2].delta / 2).toFixed(3)
        : 0.5,
      stage: {
        stage_num: stageNum,
        finish_at_lap: stageEnd,
        laps_in_stage: stageEnd - stageStart,
      },
      vehicles,
    };
  }

  getFlagEvents(): FlagEvent[] {
    this.advance();
    return [...this.flagEvents];
  }

  getPoints(): PointsEntry[] {
    const feed = this.getFeed();
    return feed.vehicles.map((v, idx) => ({
      vehicle_number: v.vehicle_number,
      first_name: v.driver.first_name,
      last_name: v.driver.last_name,
      full_name: v.driver.full_name,
      driver_id: v.driver.driver_id,
      points: Math.max(1, 600 - idx * 14 - v.starting_position),
      points_position: idx + 1,
      delta_leader: idx === 0 ? 0 : idx * 14,
      delta_next: idx === 0 ? 0 : 14,
      points_earned_this_race: Math.max(1, 40 - idx),
      stage_1_points: 0,
      stage_2_points: 0,
      stage_3_points: 0,
      is_in_chase: v.driver.is_in_chase,
      is_rookie: ['77', '62', '35'].includes(v.vehicle_number),
      wins: v.driver.is_in_chase ? 1 : 0,
      top_5: Math.max(0, 8 - idx),
      top_10: Math.max(0, 12 - idx),
    }));
  }

  getStagePoints(): StagePointsFeed[] {
    this.advance();
    return [...this.stagePoints];
  }

  getPitData(): unknown {
    const feed = this.getFeed();
    return feed.vehicles
      .filter((v) => v.pit_stops.length > 0)
      .map((v) => ({ vehicle_number: v.vehicle_number, pit_stops: v.pit_stops }));
  }

  reset() {
    demoRace = new DemoRace();
  }
}

export let demoRace = new DemoRace();

export function resetDemoRace() {
  demoRace = new DemoRace();
}
