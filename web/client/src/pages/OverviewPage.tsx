import { useLiveFeed } from '../api/queries';
import { useSettings } from '../state/settingsStore';
import {
  FlagBanner,
  LeadersStrip,
  RaceProgressBar,
  StagePills,
  StatTiles,
} from '../components/overview/OverviewWidgets';
import { LoadingOrError } from './LoadingOrError';
import { formatDelta, formatLapTime, sortedVehicles } from '../utils/format';
import { MFR_COLORS } from '@nascar/shared';
import './pages.css';

export function OverviewPage() {
  const query = useLiveFeed();
  const setFocusedCar = useSettings((s) => s.setFocusedCar);
  if (!query.data) return <LoadingOrError query={query} />;
  const feed = query.data;

  return (
    <div className="overview-main" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <FlagBanner feed={feed} />
      <StatTiles feed={feed} />
      <RaceProgressBar feed={feed} />
      <StagePills feed={feed} />

      <div className="overview-grid">
        <div className="overview-main">
          <LeadersStrip feed={feed} onFocusCar={setFocusedCar} />
        </div>

        <div className="overview-side">
          <div className="panel">
            <div className="panel-title">Running order</div>
            <MiniOrder feedCarLimit={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniOrder({ feedCarLimit }: { feedCarLimit: number }) {
  const { data: feed } = useLiveFeed();
  const focusedCar = useSettings((s) => s.focusedCar);
  const setFocusedCar = useSettings((s) => s.setFocusedCar);
  if (!feed) return null;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th className="num">P</th>
          <th>Car</th>
          <th>Driver</th>
          <th className="num">Gap</th>
        </tr>
      </thead>
      <tbody>
        {sortedVehicles(feed)
          .slice(0, feedCarLimit)
          .map((v) => {
            const color = MFR_COLORS[v.vehicle_manufacturer] ?? '#8a93a5';
            const ink = v.vehicle_manufacturer === 'Chv' ? '#181200' : '#fff';
            return (
              <tr
                key={v.vehicle_number}
                className={focusedCar === v.vehicle_number ? 'focused' : ''}
                onClick={() =>
                  setFocusedCar(focusedCar === v.vehicle_number ? null : v.vehicle_number)
                }
              >
                <td className="num mono-num">{v.running_position}</td>
                <td>
                  <span className="car-chip" style={{ background: color, color: ink }}>
                    {v.vehicle_number}
                  </span>
                </td>
                <td>{v.driver.last_name}</td>
                <td className="num mono-num">
                  {v.running_position === 1 ? formatLapTime(v.last_lap_time) : formatDelta(v)}
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}
