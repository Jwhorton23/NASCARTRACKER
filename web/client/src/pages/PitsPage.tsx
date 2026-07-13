import type { PitStop, Vehicle } from '@nascar/shared';
import { MFR_COLORS } from '@nascar/shared';
import { useLiveFeed, usePitData } from '../api/queries';
import { LoadingOrError } from './LoadingOrError';
import { sortedVehicles } from '../utils/format';
import './pages.css';

function lastStop(v: Vehicle): PitStop | undefined {
  return v.pit_stops?.[v.pit_stops.length - 1];
}

function stopLap(stop: PitStop | undefined): number | undefined {
  const lap = stop?.pit_in_lap_count ?? stop?.pit_in_leader_lap;
  return typeof lap === 'number' ? lap : undefined;
}

function stopDuration(stop: PitStop | undefined): number | undefined {
  if (
    stop &&
    typeof stop.pit_in_elapsed_time === 'number' &&
    typeof stop.pit_out_elapsed_time === 'number' &&
    stop.pit_out_elapsed_time > stop.pit_in_elapsed_time
  ) {
    return stop.pit_out_elapsed_time - stop.pit_in_elapsed_time;
  }
  return undefined;
}

export function PitsPage() {
  const query = useLiveFeed();
  usePitData(); // keeps the raw pit feed polling for sources that provide it
  if (!query.data) return <LoadingOrError query={query} />;
  const feed = query.data;
  const vehicles = sortedVehicles(feed);

  const withStops = vehicles.filter((v) => (v.pit_stops?.length ?? 0) > 0);
  const mostStops = withStops.reduce<Vehicle | null>(
    (a, b) => (!a || (b.pit_stops?.length ?? 0) > (a.pit_stops?.length ?? 0) ? b : a),
    null,
  );
  const longestOnTrack = vehicles
    .filter((v) => v.is_on_track && v.status === 1)
    .reduce<Vehicle | null>((a, b) => {
      const lapA = a ? stopLap(lastStop(a)) ?? 0 : -1;
      const lapB = stopLap(lastStop(b)) ?? 0;
      return !a || lapB < lapA ? b : a;
    }, null);

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 className="page-title">Pit Stops</h1>

      <div className="pit-summary-row">
        <div className="stat-tile">
          <div className="stat-label">Cars that have pitted</div>
          <div className="stat-value">
            {withStops.length}
            <span className="unit"> / {vehicles.length}</span>
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Most stops</div>
          <div className="stat-value">
            {mostStops ? `#${mostStops.vehicle_number}` : '—'}
            {mostStops && <span className="unit"> · {mostStops.pit_stops.length} stops</span>}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Longest since pit</div>
          <div className="stat-value">
            {longestOnTrack ? `#${longestOnTrack.vehicle_number}` : '—'}
            {longestOnTrack && (
              <span className="unit">
                {' '}
                {stopLap(lastStop(longestOnTrack)) != null
                  ? `· pitted L${stopLap(lastStop(longestOnTrack))}`
                  : '· no stops'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="panel scroll-x">
        <table className="data-table">
          <thead>
            <tr>
              <th className="num">Pos</th>
              <th>Car</th>
              <th>Driver</th>
              <th className="num">Stops</th>
              <th className="num">Last stop lap</th>
              <th className="num">Last stop time</th>
              <th className="num">Pos gain/loss</th>
              <th>On track</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => {
              const stop = lastStop(v);
              const dur = stopDuration(stop);
              const gainLoss =
                typeof stop?.positions_gained_lost === 'number' ? stop.positions_gained_lost : undefined;
              const color = MFR_COLORS[v.vehicle_manufacturer] ?? '#8a93a5';
              const ink = v.vehicle_manufacturer === 'Chv' ? '#181200' : '#fff';
              return (
                <tr key={v.vehicle_number} className={!v.is_on_track ? 'off-track' : ''}>
                  <td className="num mono-num">{v.running_position}</td>
                  <td>
                    <span className="car-chip" style={{ background: color, color: ink }}>
                      {v.vehicle_number}
                    </span>
                  </td>
                  <td>{v.driver.full_name}</td>
                  <td className="num mono-num">{v.pit_stops?.length ?? 0}</td>
                  <td className="num mono-num">{stopLap(stop) ?? '—'}</td>
                  <td className="num mono-num">{dur != null ? `${dur.toFixed(1)}s` : '—'}</td>
                  <td className="num mono-num">
                    {gainLoss != null ? (
                      <span className={gainLoss > 0 ? 'pos-change up' : gainLoss < 0 ? 'pos-change down' : ''}>
                        {gainLoss > 0 ? `+${gainLoss}` : gainLoss}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{v.is_on_track ? 'Yes' : 'No'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
