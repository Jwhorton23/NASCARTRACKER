import { useMemo } from 'react';
import type { HistorySample } from '../../state/raceHistoryStore';
import { sequentialStep } from '../../theme/dataviz';
import { formatLapTime } from '../../utils/format';
import './analytics.css';

export interface HeatmapDriver {
  car: string;
  label: string;
  color: string;
  history: HistorySample[];
}

interface LapTimeHeatmapProps {
  drivers: HeatmapDriver[];
}

// Laps this far off each driver's own best are treated as "worst" on the ramp.
const OFF_PACE_CAP = 0.06;

export function LapTimeHeatmap({ drivers }: LapTimeHeatmapProps) {
  const { laps, rows } = useMemo(() => {
    const lapSet = new Set<number>();
    for (const d of drivers) for (const s of d.history) if (s.lastLapTime > 0) lapSet.add(s.lap);
    const laps = [...lapSet].sort((a, b) => a - b);

    const rows = drivers.map((d) => {
      const byLap = new Map(d.history.map((s) => [s.lap, s] as const));
      const green = d.history.filter((s) => s.lastLapTime > 0 && s.flagState === 1);
      const best = green.length
        ? Math.min(...green.map((s) => s.lastLapTime))
        : Math.min(...d.history.filter((s) => s.lastLapTime > 0).map((s) => s.lastLapTime), Infinity);
      return { driver: d, byLap, best };
    });

    return { laps, rows };
  }, [drivers]);

  if (laps.length === 0) {
    return <div className="chart-empty">No completed laps recorded yet for the selected drivers.</div>;
  }

  return (
    <div className="heatmap-wrap scroll-x">
      <div className="heatmap-grid" style={{ gridTemplateColumns: `140px repeat(${laps.length}, 14px)` }}>
        <div className="heatmap-corner" />
        {laps.map((lap) => (
          <div key={lap} className="heatmap-col-label">
            {lap % 10 === 0 ? lap : ''}
          </div>
        ))}

        {rows.map(({ driver, byLap, best }) => (
          <RowCells key={driver.car} driver={driver} laps={laps} byLap={byLap} best={best} />
        ))}
      </div>

      <div className="heatmap-legend">
        <span>At driver&apos;s best pace</span>
        <span className="heatmap-ramp">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} style={{ background: sequentialStep(i / 6) }} />
          ))}
        </span>
        <span>{(OFF_PACE_CAP * 100).toFixed(0)}%+ off pace</span>
        <span className="heatmap-caution-swatch" /> Caution / non-green lap
      </div>
    </div>
  );
}

function RowCells({
  driver,
  laps,
  byLap,
  best,
}: {
  driver: HeatmapDriver;
  laps: number[];
  byLap: Map<number, HistorySample>;
  best: number;
}) {
  return (
    <>
      <div className="heatmap-row-label">
        <span className="swatch" style={{ background: driver.color }} />
        {driver.label}
      </div>
      {laps.map((lap) => {
        const sample = byLap.get(lap);
        if (!sample || sample.lastLapTime <= 0) {
          return <div key={lap} className="heatmap-cell heatmap-cell-empty" />;
        }
        const isGreen = sample.flagState === 1;
        const fraction = Number.isFinite(best) && best > 0 ? (sample.lastLapTime - best) / best / OFF_PACE_CAP : 0;
        const bg = isGreen ? sequentialStep(fraction) : 'var(--surface-3)';
        return (
          <div
            key={lap}
            className={`heatmap-cell${isGreen ? '' : ' heatmap-cell-caution'}`}
            style={{ background: bg }}
            title={`${driver.label} — Lap ${lap}: ${formatLapTime(sample.lastLapTime)}${
              isGreen ? ` (${(((sample.lastLapTime - best) / best) * 100).toFixed(1)}% off best)` : ' (non-green flag)'
            }`}
          />
        );
      })}
    </>
  );
}
