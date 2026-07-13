import { useEffect, useRef, useState } from 'react';
import type { LiveFeed } from '@nascar/shared';
import { FLAG_STATES, MFR_COLORS } from '@nascar/shared';
import {
  formatDelta,
  formatElapsed,
  formatLapTime,
  isPractice,
  raceProgress,
  sortedVehicles,
  stageProgress,
} from '../../utils/format';
import './overview.css';

export function FlagBanner({ feed }: { feed: LiveFeed }) {
  const [pulse, setPulse] = useState(false);
  const prevFlag = useRef(feed.flag_state);

  useEffect(() => {
    if (prevFlag.current !== feed.flag_state) {
      prevFlag.current = feed.flag_state;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 3200);
      return () => clearTimeout(t);
    }
  }, [feed.flag_state]);

  return (
    <div className={`flag-banner flag-themed${pulse ? ' pulse' : ''}`} role="status">
      {FLAG_STATES[feed.flag_state] ?? 'Unknown'}
      {feed.flag_state === 2 && ' — Field under caution'}
      {feed.flag_state === 4 && ' — One lap to go'}
      {feed.flag_state === 5 && ' — Race complete'}
    </div>
  );
}

export function StatTiles({ feed }: { feed: LiveFeed }) {
  const practice = isPractice(feed);
  return (
    <div className="lap-counter-row">
      <div className="stat-tile hero">
        <div className="stat-label">Lap</div>
        <div className="stat-value">
          {feed.lap_number}
          {!practice && <span className="unit"> / {feed.laps_in_race}</span>}
        </div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">To go</div>
        <div className="stat-value">{practice ? '—' : feed.laps_to_go}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">Elapsed</div>
        <div className="stat-value">{formatElapsed(feed.elapsed_time)}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">Cautions</div>
        <div className="stat-value">
          {feed.number_of_caution_segments}
          <span className="unit"> for {feed.number_of_caution_laps}</span>
        </div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">Lead changes</div>
        <div className="stat-value">
          {feed.number_of_lead_changes}
          <span className="unit"> · {feed.number_of_leaders} ldrs</span>
        </div>
      </div>
    </div>
  );
}

export function RaceProgressBar({ feed }: { feed: LiveFeed }) {
  if (isPractice(feed)) return null;
  const pct = raceProgress(feed) * 100;
  // stage boundary ticks (stage lengths are only known for the current stage,
  // so derive earlier boundaries from finish_at_lap / laps_in_stage)
  const ticks: number[] = [];
  const s = feed.stage;
  if (s && s.finish_at_lap < feed.laps_in_race) {
    ticks.push((s.finish_at_lap / feed.laps_in_race) * 100);
    const prevBoundary = s.finish_at_lap - s.laps_in_stage;
    if (prevBoundary > 0) ticks.push((prevBoundary / feed.laps_in_race) * 100);
  }
  return (
    <div className="race-progress" title={`Lap ${feed.lap_number} of ${feed.laps_in_race}`}>
      <div className="fill" style={{ width: `${pct}%` }} />
      {ticks.map((t) => (
        <div key={t} className="stage-tick" style={{ left: `${t}%` }} />
      ))}
    </div>
  );
}

export function StagePills({ feed }: { feed: LiveFeed }) {
  const info = stageProgress(feed);
  if (!info) return null;
  const stages = [1, 2, 3];
  return (
    <div className="stage-pills">
      {stages.map((n) => {
        const done = n < info.stageNum || feed.flag_state === 5;
        const current = n === info.stageNum && feed.flag_state !== 5;
        const fill = done ? 100 : current ? info.fraction * 100 : 0;
        return (
          <div key={n} className={`stage-pill${done ? ' done' : ''}${current ? ' current' : ''}`}>
            <div className="pill-fill" style={{ width: `${fill}%` }} />
            <span>
              {n === 3 ? 'FINAL' : `STAGE ${n}`}
              {current && ` · ${info.lapsIntoStage}/${info.lapsInStage}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function LeadersStrip({
  feed,
  onFocusCar,
}: {
  feed: LiveFeed;
  onFocusCar?: (car: string) => void;
}) {
  const top5 = sortedVehicles(feed).slice(0, 5);
  return (
    <div className="leaders-strip">
      {top5.map((v) => {
        const color = MFR_COLORS[v.vehicle_manufacturer] ?? '#8a93a5';
        const ink = v.vehicle_manufacturer === 'Chv' ? '#181200' : '#fff';
        return (
          <button
            key={v.vehicle_number}
            className="leader-chip"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={() => onFocusCar?.(v.vehicle_number)}
          >
            <span className="pos">{v.running_position}</span>
            <span className="car-badge" style={{ background: color, color: ink }}>
              {v.vehicle_number}
            </span>
            <span className="drv">
              <div className="name">{v.driver.full_name}</div>
              <div className="lap mono-num">
                {v.running_position === 1
                  ? `Last ${formatLapTime(v.last_lap_time)}`
                  : formatDelta(v)}
              </div>
            </span>
          </button>
        );
      })}
    </div>
  );
}
