import { Link } from 'react-router-dom';
import { useLiveFeed } from '../api/queries';
import { MAX_SELECTED_CARS, useSettings } from '../state/settingsStore';
import { LoadingOrError } from './LoadingOrError';
import {
  formatDelta,
  formatLapTime,
  lapsLedTotal,
  sessionBestLap,
  sortedVehicles,
} from '../utils/format';
import { MFR_COLORS, MFR_NAMES } from '@nascar/shared';
import './pages.css';

export function LeaderboardPage() {
  const query = useLiveFeed();
  const focusedCar = useSettings((s) => s.focusedCar);
  const setFocusedCar = useSettings((s) => s.setFocusedCar);
  const selectedCars = useSettings((s) => s.selectedCars);
  const toggleSelectedCar = useSettings((s) => s.toggleSelectedCar);
  if (!query.data) return <LoadingOrError query={query} />;
  const feed = query.data;
  const vehicles = sortedVehicles(feed);
  const best = sessionBestLap(feed);

  return (
    <div>
      <h1 className="page-title">Leaderboard</h1>

      {selectedCars.length > 0 && (
        <div className="compare-bar">
          <span>
            {selectedCars.length} driver{selectedCars.length > 1 ? 's' : ''} selected
            {selectedCars.length >= MAX_SELECTED_CARS && ` (max ${MAX_SELECTED_CARS})`}
          </span>
          <Link to="/analytics" className="cameras-btn" style={{ textDecoration: 'none' }}>
            Compare on Analytics →
          </Link>
        </div>
      )}

      <div>
        <div className="panel scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th />
                <th className="num">Pos</th>
                <th>Car</th>
                <th>Driver</th>
                <th>Mfr</th>
                <th className="num">Gap</th>
                <th className="num">Last lap</th>
                <th className="num">Best lap</th>
                <th className="num">Laps led</th>
                <th className="num">Pits</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const color = MFR_COLORS[v.vehicle_manufacturer] ?? '#8a93a5';
                const ink = v.vehicle_manufacturer === 'Chv' ? '#181200' : '#fff';
                const gained = v.starting_position - v.running_position;
                const lastIsSessionBest = v.last_lap_time > 0 && Math.abs(v.last_lap_time - best) < 1e-9;
                const lastIsPersonalBest =
                  !lastIsSessionBest && v.last_lap_time > 0 && v.best_lap_time > 0 &&
                  Math.abs(v.last_lap_time - v.best_lap_time) < 1e-9;
                const isSelected = selectedCars.includes(v.vehicle_number);
                return (
                  <tr
                    key={v.vehicle_number}
                    className={`${focusedCar === v.vehicle_number ? 'focused' : ''}${!v.is_on_track ? ' off-track' : ''}`}
                    onClick={() =>
                      setFocusedCar(focusedCar === v.vehicle_number ? null : v.vehicle_number)
                    }
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isSelected && selectedCars.length >= MAX_SELECTED_CARS}
                        onChange={() => toggleSelectedCar(v.vehicle_number)}
                        title="Select for Analytics comparison"
                      />
                    </td>
                    <td className="num mono-num">
                      {v.running_position}
                      {gained !== 0 && (
                        <span className={`pos-change ${gained > 0 ? 'up' : 'down'}`}>
                          {gained > 0 ? '▲' : '▼'}
                          {Math.abs(gained)}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="car-chip" style={{ background: color, color: ink }}>
                        {v.vehicle_number}
                      </span>
                    </td>
                    <td>{v.driver.full_name}</td>
                    <td style={{ color: 'var(--text-2)' }}>{MFR_NAMES[v.vehicle_manufacturer] ?? v.vehicle_manufacturer}</td>
                    <td className="num mono-num">{formatDelta(v)}</td>
                    <td
                      className={`num mono-num${lastIsSessionBest ? ' lap-best-session' : ''}${lastIsPersonalBest ? ' lap-best-personal' : ''}`}
                      title={lastIsSessionBest ? 'Session best' : lastIsPersonalBest ? 'Personal best' : undefined}
                    >
                      {formatLapTime(v.last_lap_time)}
                    </td>
                    <td className="num mono-num">{formatLapTime(v.best_lap_time)}</td>
                    <td className="num mono-num">{lapsLedTotal(v) || '—'}</td>
                    <td className="num mono-num">{v.pit_stops?.length ?? 0}</td>
                    <td style={{ color: 'var(--text-2)' }}>
                      {v.status !== 1 ? 'OUT' : v.is_on_dvp ? 'DVP' : v.is_on_track ? 'Running' : 'Pit/Off'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
