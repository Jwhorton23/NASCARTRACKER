import { FLAG_STATES, RUN_TYPES, SERIES_SHORT } from '@nascar/shared';
import { useLiveFeed } from '../../api/queries';
import { useSettings, type DataSourceMode } from '../../state/settingsStore';
import { sourceLabel } from '../../api/dataSource';
import { resetDemoRace } from '../../api/demo/demoFeed';

interface TopBarProps {
  onToggleCameras: () => void;
}

export function TopBar({ onToggleCameras }: TopBarProps) {
  const { data: feed, isError, dataUpdatedAt } = useLiveFeed();
  const dataSource = useSettings((s) => s.dataSource);
  const setDataSource = useSettings((s) => s.setDataSource);

  const ageMs = dataUpdatedAt ? Date.now() - dataUpdatedAt : Infinity;
  const stale = !isError && ageMs > 5000;

  return (
    <header className="topbar flag-themed">
      <div>
        <div className="race-title">{feed ? feed.run_name : 'NASCAR Race Tracker'}</div>
        <div className="race-sub">
          {feed
            ? `${feed.track_name} · ${SERIES_SHORT[feed.series_id] ?? `Series ${feed.series_id}`} · ${RUN_TYPES[feed.run_type] ?? 'Session'}`
            : 'Waiting for data…'}
        </div>
      </div>

      <div className="spacer" />

      {feed && (
        <span className="flag-chip flag-themed">
          <FlagIcon />
          {FLAG_STATES[feed.flag_state] ?? 'Unknown'}
        </span>
      )}

      <span className={`conn-badge${isError ? ' error' : stale ? ' stale' : ''}`}>
        <span className="dot" />
        {sourceLabel(dataSource)}
        {isError ? ' · NO DATA' : stale ? ' · STALE' : ''}
      </span>

      <select
        className="source-select"
        value={dataSource}
        onChange={(e) => {
          const mode = e.target.value as DataSourceMode;
          if (mode === 'demo') resetDemoRace();
          setDataSource(mode);
        }}
        title="Data source"
      >
        <option value="demo">Demo race</option>
        <option value="proxy">Live (proxy)</option>
        <option value="replay">Replay server</option>
      </select>

      <button className="cameras-btn" onClick={onToggleCameras}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
        Watch
      </button>
    </header>
  );
}

function FlagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 22V3h9l1 2h6v11h-8l-1-2H6v8H4z" />
    </svg>
  );
}
