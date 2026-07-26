import { useMemo, useRef, useState } from 'react';
import './analytics.css';

export interface ChartPoint {
  x: number;
  y: number | null;
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  points: ChartPoint[];
}

interface LineChartProps {
  series: ChartSeries[];
  height?: number;
  /** Position charts plot the domain minimum (P1) at the top, not the bottom. */
  positionMode?: boolean;
  yFormat?: (v: number) => string;
  yLabel?: string;
  xLabel?: string;
  /** Shaded lap ranges behind the lines, e.g. caution periods. */
  bands?: Array<{ x0: number; x1: number }>;
}

const WIDTH = 1000;
const MARGIN = { top: 14, right: 20, bottom: 30, left: 50 };
const NEAREST_THRESHOLD = 2; // laps

export function LineChart({
  series,
  height = 260,
  positionMode = false,
  yFormat = (v) => v.toFixed(0),
  yLabel,
  xLabel = 'Lap',
  bands = [],
}: LineChartProps) {
  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;

  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    let xMn = Infinity;
    let xMx = -Infinity;
    let yMn = Infinity;
    let yMx = -Infinity;
    for (const s of series) {
      for (const p of s.points) {
        if (p.x < xMn) xMn = p.x;
        if (p.x > xMx) xMx = p.x;
        if (p.y != null) {
          if (p.y < yMn) yMn = p.y;
          if (p.y > yMx) yMx = p.y;
        }
      }
    }
    if (!Number.isFinite(xMn)) {
      xMn = 0;
      xMx = 1;
    }
    if (!Number.isFinite(yMn)) {
      yMn = 0;
      yMx = 1;
    }
    if (xMn === xMx) xMx = xMn + 1;
    if (yMn === yMx) {
      yMn -= 1;
      yMx += 1;
    }
    if (positionMode) {
      return { xMin: xMn, xMax: xMx, yMin: 1, yMax: Math.max(yMx, 2) };
    }
    const pad = (yMx - yMn) * 0.1;
    return { xMin: xMn, xMax: xMx, yMin: yMn - pad, yMax: yMx + pad };
  }, [series, positionMode]);

  const scaleX = (x: number) => MARGIN.left + ((x - xMin) / (xMax - xMin || 1)) * plotW;
  const scaleY = (y: number) => {
    const t = (y - yMin) / (yMax - yMin || 1);
    return positionMode ? MARGIN.top + t * plotH : MARGIN.top + (1 - t) * plotH;
  };

  const pathFor = (s: ChartSeries) => {
    let d = '';
    let drawing = false;
    for (const p of s.points) {
      if (p.y == null) {
        drawing = false;
        continue;
      }
      d += `${drawing ? 'L' : 'M'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)} `;
      drawing = true;
    }
    return d.trim();
  };

  const yTicks = useMemo(() => {
    const n = 4;
    const ticks: number[] = [];
    for (let i = 0; i <= n; i++) ticks.push(yMin + ((yMax - yMin) * i) / n);
    return positionMode ? [...new Set(ticks.map((t) => Math.round(t)))] : ticks;
  }, [yMin, yMax, positionMode]);

  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverLap, setHoverLap] = useState<number | null>(null);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
    if (px < MARGIN.left || px > WIDTH - MARGIN.right) {
      setHoverLap(null);
      return;
    }
    const lap = xMin + ((px - MARGIN.left) / plotW) * (xMax - xMin);
    setHoverLap(Math.round(lap));
  };

  const hoverValues = useMemo(() => {
    if (hoverLap == null) return null;
    return series.map((s) => {
      let best: ChartPoint | null = null;
      let bestDist = Infinity;
      for (const p of s.points) {
        if (p.y == null) continue;
        const dist = Math.abs(p.x - hoverLap);
        if (dist < bestDist) {
          bestDist = dist;
          best = p;
        }
      }
      return { series: s, point: bestDist <= NEAREST_THRESHOLD ? best : null };
    });
  }, [hoverLap, series]);

  const directLabel = series.length <= 4;

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        className="line-chart"
        viewBox={`0 0 ${WIDTH} ${height}`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverLap(null)}
      >
        {yLabel && (
          <text className="chart-axis-title" x={14} y={MARGIN.top - 2}>
            {yLabel}
          </text>
        )}

        {bands.map((b, i) => (
          <rect
            key={i}
            className="chart-band"
            x={scaleX(b.x0)}
            y={MARGIN.top}
            width={Math.max(0, scaleX(b.x1) - scaleX(b.x0))}
            height={plotH}
          />
        ))}

        {yTicks.map((t) => (
          <g key={t}>
            <line
              className="chart-grid"
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={scaleY(t)}
              y2={scaleY(t)}
            />
            <text className="chart-tick" x={MARGIN.left - 8} y={scaleY(t) + 4} textAnchor="end">
              {yFormat(t)}
            </text>
          </g>
        ))}

        <line
          className="chart-axis"
          x1={MARGIN.left}
          x2={MARGIN.left}
          y1={MARGIN.top}
          y2={height - MARGIN.bottom}
        />
        <line
          className="chart-axis"
          x1={MARGIN.left}
          x2={WIDTH - MARGIN.right}
          y1={height - MARGIN.bottom}
          y2={height - MARGIN.bottom}
        />
        <text className="chart-tick" x={MARGIN.left} y={height - 6}>
          Lap {Math.round(xMin)}
        </text>
        <text className="chart-tick" x={WIDTH - MARGIN.right} y={height - 6} textAnchor="end">
          Lap {Math.round(xMax)}
        </text>

        {series.map((s) => (
          <path key={s.key} d={pathFor(s)} stroke={s.color} className="chart-line" />
        ))}

        {directLabel &&
          series.map((s) => {
            const last = [...s.points].reverse().find((p) => p.y != null);
            if (!last || last.y == null) return null;
            return (
              <text
                key={`${s.key}-label`}
                className="chart-direct-label"
                x={scaleX(last.x) + 6}
                y={scaleY(last.y) + 4}
                fill={s.color}
              >
                {s.label}
              </text>
            );
          })}

        {hoverLap != null && (
          <line
            className="chart-crosshair"
            x1={scaleX(hoverLap)}
            x2={scaleX(hoverLap)}
            y1={MARGIN.top}
            y2={height - MARGIN.bottom}
          />
        )}
      </svg>

      {hoverValues && (
        <div className="chart-tooltip">
          <div className="chart-tooltip-lap">{xLabel} {hoverLap}</div>
          {hoverValues.map(({ series: s, point }) => (
            <div key={s.key} className="chart-tooltip-row">
              <span className="swatch" style={{ background: s.color }} />
              <span className="chart-tooltip-label">{s.label}</span>
              <span className="chart-tooltip-value mono-num">
                {point?.y != null ? yFormat(point.y) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.key} className="chart-legend-item">
            <span className="swatch" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
