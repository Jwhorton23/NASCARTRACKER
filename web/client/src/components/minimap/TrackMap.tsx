import { useCallback, useMemo, useRef } from 'react';
import type { LiveFeed, Vehicle } from '@nascar/shared';
import { MFR_COLORS, MFR_NAMES } from '@nascar/shared';
import { layoutForTrack } from '../../tracks/layouts';
import { buildArcTable, catmullRomPathD, pointAtProgress } from '../../tracks/geometry';
import { useAnimatedCarPositions } from '../../hooks/useAnimatedCarPositions';
import type { CarTarget } from '../../tracks/positionSynthesis';
import { formatLapTime } from '../../utils/format';
import './minimap.css';

const VIEW_W = 1000;

interface TrackMapProps {
  feed: LiveFeed;
  focusedCar?: string | null;
  onFocusCar?: (car: string | null) => void;
  carsShown?: number;
  showLegend?: boolean;
}

export function TrackMap({ feed, focusedCar, onFocusCar, carsShown = 40, showLegend = true }: TrackMapProps) {
  const layout = useMemo(
    () => layoutForTrack(feed.track_id, feed.track_length),
    [feed.track_id, feed.track_length],
  );
  const viewH = Math.round(VIEW_W / layout.aspect);
  const table = useMemo(() => buildArcTable(layout, VIEW_W, viewH), [layout, viewH]);
  const pathD = useMemo(() => catmullRomPathD(layout.points, VIEW_W, viewH), [layout, viewH]);

  const registry = useRef<Map<string, SVGGElement>>(new Map());

  const center = useMemo(() => {
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < table.samples; i++) {
      cx += table.xs[i];
      cy += table.ys[i];
    }
    return { x: cx / table.samples, y: cy / table.samples };
  }, [table]);

  const pitSlotFor = useCallback(
    (_target: CarTarget, pitIndex: number) => ({
      x: center.x - 150 + (pitIndex % 9) * 38,
      y: center.y + 26 + Math.floor(pitIndex / 9) * 30,
    }),
    [center],
  );

  useAnimatedCarPositions(feed, table, registry, pitSlotFor);

  const vehicles = useMemo(
    () =>
      [...feed.vehicles]
        .sort((a, b) => a.running_position - b.running_position)
        .slice(0, carsShown),
    [feed.vehicles, carsShown],
  );

  const sf = pointAtProgress(table, 0);
  const trackStroke = Math.max(22, viewH * 0.085);

  const registerCar = (num: string) => (el: SVGGElement | null) => {
    if (el) registry.current.set(num, el);
    else registry.current.delete(num);
  };

  return (
    <div className="trackmap-wrap">
      <svg
        className="trackmap-svg"
        viewBox={`0 0 ${VIEW_W} ${viewH}`}
        role="img"
        aria-label={`Track map of ${feed.track_name} with live car positions`}
      >
        <defs>
          <pattern id="sf-checker" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#f2f2f2" />
            <rect width="4" height="4" fill="#111" />
            <rect x="4" y="4" width="4" height="4" fill="#111" />
          </pattern>
        </defs>

        {/* soft flag-colored glow under the asphalt */}
        <path className="track-glow" d={pathD} strokeWidth={trackStroke + 14} strokeLinejoin="round" />
        <path className="track-asphalt" d={pathD} strokeWidth={trackStroke} strokeLinejoin="round" />
        <path className="track-centerline" d={pathD} strokeWidth={2.5} strokeLinejoin="round" />

        {/* start/finish line */}
        <g transform={`translate(${sf.x} ${sf.y}) rotate(${(sf.angle * 180) / Math.PI + 90})`}>
          <rect
            x={-trackStroke / 2 - 4}
            y={-4}
            width={trackStroke + 8}
            height={8}
            fill="url(#sf-checker)"
            rx={2}
          />
        </g>

        <text className="track-name-label" x={center.x} y={center.y - 8}>
          {layout.name}
        </text>

        {vehicles.map((v) => (
          <CarDot
            key={v.vehicle_number}
            vehicle={v}
            focused={focusedCar === v.vehicle_number}
            registerRef={registerCar(v.vehicle_number)}
            onClick={() =>
              onFocusCar?.(focusedCar === v.vehicle_number ? null : v.vehicle_number)
            }
          />
        ))}
      </svg>

      {showLegend && (
        <div className="map-legend">
          {Object.entries(MFR_COLORS).map(([code, color]) => (
            <span key={code}>
              <span className="swatch" style={{ background: color }} />
              {MFR_NAMES[code] ?? code}
            </span>
          ))}
          <span>
            <span className="swatch" style={{ background: 'var(--text-3)' }} />
            In pit / off track (dimmed)
          </span>
        </div>
      )}
    </div>
  );
}

interface CarDotProps {
  vehicle: Vehicle;
  focused: boolean;
  registerRef: (el: SVGGElement | null) => void;
  onClick: () => void;
}

function CarDot({ vehicle, focused, registerRef, onClick }: CarDotProps) {
  const color = MFR_COLORS[vehicle.vehicle_manufacturer] ?? '#8a93a5';
  const ink = vehicle.vehicle_manufacturer === 'Chv' ? '#181200' : '#ffffff';
  const leader = vehicle.running_position === 1;
  const r = focused ? 17 : leader ? 15 : 13;

  return (
    // transform/opacity are owned by the animation loop (never set from JSX,
    // or React would clobber them on every poll re-render)
    <g
      ref={registerRef}
      className={`car-dot${leader ? ' leader' : ''}${focused ? ' focused' : ''}`}
      onClick={onClick}
    >
      <title>
        {`P${vehicle.running_position} · #${vehicle.vehicle_number} ${vehicle.driver.full_name}\nLast lap: ${formatLapTime(vehicle.last_lap_time)}`}
      </title>
      <circle r={r} fill={color} />
      <text fill={ink}>{vehicle.vehicle_number}</text>
      {focused && (
        <text className="focus-name" y={-r - 8}>
          {vehicle.driver.last_name}
        </text>
      )}
    </g>
  );
}
