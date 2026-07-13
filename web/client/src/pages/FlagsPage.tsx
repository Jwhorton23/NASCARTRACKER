import type { FlagEvent } from '@nascar/shared';
import { FLAG_STATES, flagName } from '@nascar/shared';
import { useFlagData, useLiveFeed } from '../api/queries';
import { LoadingOrError } from './LoadingOrError';
import { formatElapsed } from '../utils/format';
import './pages.css';

const FLAG_COLORS: Record<string, { bg: string; ink: string }> = {
  green: { bg: '#21c15a', ink: '#04150a' },
  yellow: { bg: '#ffd42a', ink: '#1c1500' },
  red: { bg: '#ff3b30', ink: '#1a0503' },
  white: { bg: '#f5f5f5', ink: '#101010' },
  checkered: { bg: 'repeating-conic-gradient(#111 0% 25%, #f2f2f2 0% 50%) 0 0 / 12px 12px', ink: '#0b0d10' },
  hot: { bg: '#ff8a3c', ink: '#1c0e02' },
  cold: { bg: '#5fb7ff', ink: '#06121c' },
  none: { bg: '#5f6368', ink: '#0b0d10' },
};

export function FlagsPage() {
  const flagsQuery = useFlagData();
  const { data: feed } = useLiveFeed();
  if (!flagsQuery.data) return <LoadingOrError query={flagsQuery} />;

  const events = [...flagsQuery.data].sort((a, b) => a.elapsed_time - b.elapsed_time);
  const totalLaps = feed && feed.laps_in_race < 999 ? feed.laps_in_race : undefined;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 className="page-title">Flag History</h1>

      {totalLaps && events.length > 0 && (
        <FlagStrip events={events} totalLaps={totalLaps} currentLap={feed?.lap_number ?? 0} />
      )}

      <div className="panel">
        <div className="flag-timeline">
          {events.length === 0 && <div className="page-loading">No flag events yet.</div>}
          {[...events].reverse().map((e, i) => {
            const name = flagName(e.flag_state);
            const c = FLAG_COLORS[name];
            return (
              <div className="flag-event" key={`${e.elapsed_time}-${i}`}>
                <span className="fe-flag" style={{ background: c.bg, color: c.ink }}>
                  {FLAG_STATES[e.flag_state] ?? `Flag ${e.flag_state}`}
                </span>
                <span className="fe-lap mono-num">
                  Lap {e.lap_number} · {formatElapsed(e.elapsed_time)}
                </span>
                <span>
                  <span className="fe-comment">{e.comment || '—'}</span>
                  {e.beneficiary && (
                    <span className="fe-beneficiary"> · Lucky dog: #{e.beneficiary}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FlagStrip({
  events,
  totalLaps,
  currentLap,
}: {
  events: FlagEvent[];
  totalLaps: number;
  currentLap: number;
}) {
  // build lap-axis bands: each event colors the strip from its lap to the next event's lap
  const bands: Array<{ from: number; to: number; name: string }> = [];
  for (let i = 0; i < events.length; i++) {
    const from = Math.max(0, events[i].lap_number);
    const to = i + 1 < events.length ? events[i + 1].lap_number : Math.min(currentLap, totalLaps);
    if (to > from) bands.push({ from, to, name: flagName(events[i].flag_state) });
  }
  return (
    <div className="flag-strip" title="Flag state across the race distance">
      {bands.map((b, i) => (
        <span
          key={i}
          className="seg"
          style={{
            width: `${((b.to - b.from) / totalLaps) * 100}%`,
            background: FLAG_COLORS[b.name].bg,
          }}
          title={`Laps ${b.from}–${b.to}: ${b.name}`}
        />
      ))}
      <span className="seg" style={{ flex: 1, background: 'var(--surface-3)' }} />
    </div>
  );
}
