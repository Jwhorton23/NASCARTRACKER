import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { FlagEvent } from '@nascar/shared';
import { MFR_COLORS, MFR_NAMES } from '@nascar/shared';
import { useFlagData, useLiveFeed } from '../api/queries';
import { useSettings } from '../state/settingsStore';
import { useRaceHistory } from '../state/raceHistoryStore';
import { colorForIndex } from '../theme/dataviz';
import { LineChart, type ChartSeries } from '../components/analytics/LineChart';
import { LapTimeHeatmap } from '../components/analytics/LapTimeHeatmap';
import { LoadingOrError } from './LoadingOrError';
import { formatLapTime, lapsLedTotal } from '../utils/format';
import './pages.css';

function cautionBands(events: FlagEvent[], currentLap: number): Array<{ x0: number; x1: number }> {
  const sorted = [...events].sort((a, b) => a.lap_number - b.lap_number);
  const bands: Array<{ x0: number; x1: number }> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].flag_state !== 2) continue;
    const next = sorted[i + 1]?.lap_number ?? currentLap;
    bands.push({ x0: sorted[i].lap_number, x1: Math.max(next, sorted[i].lap_number) });
  }
  return bands;
}

export function AnalyticsPage() {
  const feedQuery = useLiveFeed();
  const flagQuery = useFlagData();
  const selectedCars = useSettings((s) => s.selectedCars);
  const toggleSelectedCar = useSettings((s) => s.toggleSelectedCar);
  const clearSelectedCars = useSettings((s) => s.clearSelectedCars);
  const history = useRaceHistory((s) => s.history);

  if (!feedQuery.data) return <LoadingOrError query={feedQuery} />;
  const feed = feedQuery.data;

  const drivers = useMemo(
    () =>
      selectedCars.map((car, idx) => {
        const vehicle = feed.vehicles.find((v) => v.vehicle_number === car);
        return {
          car,
          idx,
          color: colorForIndex(idx),
          vehicle,
          label: vehicle ? `#${car} ${vehicle.driver.full_name}` : `#${car}`,
          history: history[car] ?? [],
        };
      }),
    [selectedCars, feed.vehicles, history],
  );

  const bands = useMemo(
    () => cautionBands(flagQuery.data ?? [], feed.lap_number),
    [flagQuery.data, feed.lap_number],
  );

  if (drivers.length === 0) {
    return (
      <div className="analytics-empty">
        <h1 className="page-title">Driver Analytics</h1>
        <p>
          Select drivers from the <Link to="/leaderboard">Leaderboard</Link> to compare their race data —
          position, lap times, gaps, and a lap-time heatmap.
        </p>
      </div>
    );
  }

  const positionSeries: ChartSeries[] = drivers.map((d) => ({
    key: d.car,
    label: d.label,
    color: d.color,
    points: d.history.map((s) => ({ x: s.lap, y: s.position })),
  }));

  const lapTimeSeries: ChartSeries[] = drivers.map((d) => ({
    key: d.car,
    label: d.label,
    color: d.color,
    points: d.history.map((s) => ({ x: s.lap, y: s.flagState === 1 && s.lastLapTime > 0 ? s.lastLapTime : null })),
  }));

  const gapSeries: ChartSeries[] = drivers.map((d) => ({
    key: d.car,
    label: d.label,
    color: d.color,
    points: d.history.map((s) => ({ x: s.lap, y: s.gapSeconds })),
  }));

  return (
    <div style={{ maxWidth: 1200 }}>
      <h1 className="page-title">Driver Analytics</h1>

      <div className="driver-chip-row">
        {drivers.map((d) => (
          <span key={d.car} className="driver-chip" style={{ borderColor: d.color }}>
            <span className="swatch" style={{ background: d.color }} />
            {d.label}
            <button onClick={() => toggleSelectedCar(d.car)} title="Remove" aria-label={`Remove ${d.label}`}>
              ✕
            </button>
          </span>
        ))}
        <button className="cameras-btn" onClick={clearSelectedCars}>
          Clear all
        </button>
        <Link to="/leaderboard" className="cameras-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          + Add drivers
        </Link>
      </div>

      <div className="summary-table-wrap panel scroll-x">
        <div className="panel-title">Summary</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Car</th>
              <th>Driver</th>
              <th>Mfr</th>
              <th className="num">Pos</th>
              <th className="num">Start</th>
              <th className="num">Best lap</th>
              <th className="num">Last lap</th>
              <th className="num">Laps led</th>
              <th className="num">Pit stops</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const v = d.vehicle;
              if (!v) {
                return (
                  <tr key={d.car} style={{ cursor: 'default' }}>
                    <td colSpan={9} style={{ color: 'var(--text-2)' }}>
                      #{d.car} — not in this session's field
                    </td>
                  </tr>
                );
              }
              const mfrColor = MFR_COLORS[v.vehicle_manufacturer] ?? '#8a93a5';
              const ink = v.vehicle_manufacturer === 'Chv' ? '#181200' : '#fff';
              return (
                <tr key={d.car} style={{ cursor: 'default' }}>
                  <td>
                    <span className="car-chip" style={{ background: mfrColor, color: ink }}>
                      {v.vehicle_number}
                    </span>
                  </td>
                  <td>{v.driver.full_name}</td>
                  <td style={{ color: 'var(--text-2)' }}>{MFR_NAMES[v.vehicle_manufacturer] ?? v.vehicle_manufacturer}</td>
                  <td className="num mono-num">{v.running_position}</td>
                  <td className="num mono-num">{v.starting_position}</td>
                  <td className="num mono-num">{formatLapTime(v.best_lap_time)}</td>
                  <td className="num mono-num">{formatLapTime(v.last_lap_time)}</td>
                  <td className="num mono-num">{lapsLedTotal(v) || '—'}</td>
                  <td className="num mono-num">{v.pit_stops?.length ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="analytics-section panel">
        <div className="panel-title">Position by lap</div>
        <LineChart series={positionSeries} positionMode yFormat={(v) => `P${Math.round(v)}`} bands={bands} />
      </div>

      <div className="analytics-section panel">
        <div className="panel-title">Lap time (green flag only)</div>
        <LineChart series={lapTimeSeries} yFormat={(v) => v.toFixed(1)} yLabel="Seconds" bands={bands} />
      </div>

      <div className="analytics-section panel">
        <div className="panel-title">Gap to leader</div>
        <LineChart series={gapSeries} yFormat={(v) => `${v.toFixed(1)}s`} yLabel="Seconds behind" bands={bands} />
      </div>

      <div className="analytics-section panel scroll-x">
        <div className="panel-title">Lap-time heatmap — pace relative to each driver's own best</div>
        <LapTimeHeatmap drivers={drivers.map((d) => ({ car: d.car, label: d.label, color: d.color, history: d.history }))} />
      </div>
    </div>
  );
}
