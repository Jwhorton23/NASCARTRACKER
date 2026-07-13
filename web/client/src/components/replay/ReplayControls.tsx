import { useEffect, useState } from 'react';
import { replayControl } from '../../api/dataSource';
import { useSettings } from '../../state/settingsStore';
import './replay.css';

interface ReplayStatus {
  playing?: boolean;
  current_frame?: number;
  total_frames?: number;
  playback_speed?: number;
  [key: string]: unknown;
}

/** Floating transport strip shown when the data source is the Python replay server. */
export function ReplayControls() {
  const dataSource = useSettings((s) => s.dataSource);
  const [status, setStatus] = useState<ReplayStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (dataSource !== 'replay') return;
    let stop = false;
    const poll = async () => {
      try {
        const s = (await replayControl('status')) as ReplayStatus;
        if (!stop) {
          setStatus(s);
          setError(false);
        }
      } catch {
        if (!stop) setError(true);
      }
    };
    void poll();
    const id = setInterval(poll, 1000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [dataSource]);

  if (dataSource !== 'replay') return null;

  const cmd = (path: string) => () => void replayControl(path).catch(() => setError(true));
  const pct =
    status?.total_frames && status.current_frame != null
      ? Math.round((status.current_frame / status.total_frames) * 100)
      : null;

  return (
    <div className="replay-controls">
      <span className="replay-label">REPLAY</span>
      {error ? (
        <span className="replay-error">replay server not reachable on the configured port</span>
      ) : (
        <>
          <button onClick={cmd(status?.playing ? 'pause' : 'play')}>
            {status?.playing ? '⏸' : '▶'}
          </button>
          <button onClick={cmd('seek?percent=0')} title="Restart">⏮</button>
          {[1, 2, 5, 10].map((s) => (
            <button
              key={s}
              className={status?.playback_speed === s ? 'active' : ''}
              onClick={cmd(`speed?value=${s}`)}
            >
              {s}x
            </button>
          ))}
          {pct != null && (
            <>
              <input
                type="range"
                min={0}
                max={100}
                value={pct}
                onChange={(e) => void replayControl(`seek?percent=${e.target.value}`).catch(() => setError(true))}
              />
              <span className="replay-pct mono-num">{pct}%</span>
            </>
          )}
        </>
      )}
    </div>
  );
}
