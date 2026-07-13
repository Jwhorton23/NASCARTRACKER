import type { PointsEntry, StagePointsFeed } from '@nascar/shared';
import { usePoints, useStagePoints } from '../api/queries';
import { LoadingOrError } from './LoadingOrError';
import './pages.css';

const PLAYOFF_CUT = 16;

function entryName(e: PointsEntry): string {
  return (
    e.full_name ??
    [e.first_name, e.last_name].filter(Boolean).join(' ') ??
    `#${e.vehicle_number ?? e.car_number ?? '?'}`
  );
}

function entryPos(e: PointsEntry, idx: number): number {
  return e.points_position ?? e.position ?? idx + 1;
}

export function PointsPage() {
  const pointsQuery = usePoints();
  const stageQuery = useStagePoints();
  if (!pointsQuery.data) return <LoadingOrError query={pointsQuery} />;

  const entries = [...pointsQuery.data].sort((a, b) => entryPos(a, 0) - entryPos(b, 0));
  const stageFeeds: StagePointsFeed[] = Array.isArray(stageQuery.data)
    ? stageQuery.data
    : stageQuery.data
      ? [stageQuery.data]
      : [];

  return (
    <div>
      <h1 className="page-title">Points &amp; Stages</h1>
      <div className="two-col">
        <div className="panel scroll-x">
          <div className="panel-title">Championship points (live)</div>
          <table className="data-table">
            <thead>
              <tr>
                <th className="num">Rank</th>
                <th>Driver</th>
                <th className="num">Points</th>
                <th className="num">To leader</th>
                <th className="num">To next</th>
                <th className="num">This race</th>
                <th className="num">Wins</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => {
                const pos = entryPos(e, idx);
                const rows = [];
                rows.push(
                  <tr key={`row-${e.driver_id ?? idx}`} style={{ cursor: 'default' }}>
                    <td className="num mono-num">{pos}</td>
                    <td>
                      {entryName(e)}
                      {e.is_in_chase && <span className="chase-badge">PLAYOFF</span>}
                      {e.is_rookie && <span className="rookie-badge">ROOKIE</span>}
                    </td>
                    <td className="num mono-num">{e.points ?? '—'}</td>
                    <td className="num mono-num">{pos === 1 ? '—' : `-${e.delta_leader ?? '?'}`}</td>
                    <td className="num mono-num">{pos === 1 ? '—' : `-${e.delta_next ?? '?'}`}</td>
                    <td className="num mono-num">{e.points_earned_this_race ?? '—'}</td>
                    <td className="num mono-num">{e.wins ?? 0}</td>
                  </tr>,
                );
                if (pos === PLAYOFF_CUT) {
                  rows.push(
                    <tr key="cutline" style={{ cursor: 'default' }}>
                      <td
                        colSpan={7}
                        style={{
                          padding: '3px 10px',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'var(--bad)',
                          borderBottom: '2px dashed var(--bad)',
                          background: 'rgba(255,59,48,0.06)',
                        }}
                      >
                        Playoff cut line
                      </td>
                    </tr>,
                  );
                }
                return rows;
              })}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-title">Stage results</div>
          {stageFeeds.length === 0 && (
            <div style={{ color: 'var(--text-2)', fontSize: 13 }}>
              No stage results yet — stage points appear after each stage ends.
            </div>
          )}
          {stageFeeds.map((sf, i) => (
            <div key={sf.stage_number ?? i} style={{ marginBottom: 16 }}>
              <div className="panel-title">Stage {sf.stage_number ?? i + 1}</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="num">P</th>
                    <th>Driver</th>
                    <th className="num">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {(sf.results ?? []).map((r, j) => (
                    <tr key={j} style={{ cursor: 'default' }}>
                      <td className="num mono-num">{r.position ?? j + 1}</td>
                      <td>{r.full_name ?? `#${r.vehicle_number}`}</td>
                      <td className="num mono-num">{r.stage_points ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
