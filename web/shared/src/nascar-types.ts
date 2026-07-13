// Types mirror the raw JSON served by cf.nascar.com (snake_case preserved).
// Field reference: ../../LiveFeed.MD, ../../NewEndpointsDiscovered.MD, ../../LiveFlagData.MD

export interface StageInfo {
  stage_num: number;
  finish_at_lap: number;
  laps_in_stage: number;
}

export interface DriverInfo {
  driver_id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  is_in_chase: boolean;
}

// Pit-stop shape is under-documented upstream; every field optional/defensive.
export interface PitStop {
  pit_in_elapsed_time?: number;
  pit_out_elapsed_time?: number;
  pit_in_lap_count?: number;
  pit_out_lap_count?: number;
  pit_in_leader_lap?: number;
  positions_gained_lost?: number;
  [key: string]: unknown;
}

export interface LapLedRange {
  start_lap: number;
  end_lap: number;
}

export interface Vehicle {
  average_restart_speed: number;
  average_running_position: number;
  average_speed: number;
  best_lap: number;
  best_lap_speed: number;
  best_lap_time: number;
  vehicle_manufacturer: string; // 'Tyt' | 'Chv' | 'Frd'
  vehicle_number: string;
  driver: DriverInfo;
  vehicle_elapsed_time: number;
  fastest_laps_run: number;
  laps_position_improved: number;
  laps_completed: number;
  laps_led: LapLedRange[];
  last_lap_speed: number;
  last_lap_time: number;
  passes_made: number;
  passing_differential: number;
  position_differential_last_10_percent: number;
  pit_stops: PitStop[];
  qualifying_status: number;
  running_position: number;
  status: number; // 1 = Running
  delta: number; // seconds behind leader; negative whole numbers = laps down
  sponsor_name: string;
  starting_position: number;
  times_passed: number;
  quality_passes: number;
  is_on_track: boolean;
  is_on_dvp: boolean;
}

export interface LiveFeed {
  lap_number: number;
  elapsed_time: number;
  flag_state: number;
  race_id: number;
  laps_in_race: number; // 999 = practice
  laps_to_go: number;
  run_id: number;
  run_name: string;
  series_id: number; // 1=Cup 2=Xfinity 3=Trucks
  time_of_day: number;
  time_of_day_os: string;
  track_id: number;
  track_length: number; // miles
  track_name: string;
  run_type: number; // 1=Practice 2=Qualifying 3=Race
  number_of_caution_segments: number;
  number_of_caution_laps: number;
  number_of_lead_changes: number;
  number_of_leaders: number;
  avg_diff_1to3: number;
  stage: StageInfo;
  vehicles: Vehicle[];
}

export interface FlagEvent {
  lap_number: number;
  flag_state: number;
  elapsed_time: number;
  beneficiary?: string; // lucky-dog car
  comment?: string; // stage-end notes etc.
  time_of_day: number;
  time_of_day_os: string;
}

export interface PointsEntry {
  car_number?: string;
  vehicle_number?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  driver_id?: number;
  points?: number;
  points_position?: number;
  position?: number;
  delta_leader?: number;
  delta_next?: number;
  points_earned_this_race?: number;
  stage_1_points?: number;
  stage_2_points?: number;
  stage_3_points?: number;
  is_in_chase?: boolean;
  is_rookie?: boolean;
  wins?: number;
  top_5?: number;
  top_10?: number;
  [key: string]: unknown;
}

export interface StagePointsResult {
  position?: number;
  vehicle_number?: string;
  driver_id?: number;
  full_name?: string;
  stage_points?: number;
  [key: string]: unknown;
}

export interface StagePointsFeed {
  race_id?: number;
  run_id?: number;
  stage_number?: number;
  results?: StagePointsResult[];
  [key: string]: unknown;
}

export interface TrackDbEntry {
  track_id: number;
  track_name?: string;
  track_type?: string;
  track_length?: number;
  [key: string]: unknown;
}
