import type { UseQueryResult } from '@tanstack/react-query';
import { useSettings } from '../state/settingsStore';
import './pages.css';

export function LoadingOrError({ query }: { query: UseQueryResult<unknown> }) {
  const dataSource = useSettings((s) => s.dataSource);
  if (query.isError) {
    return (
      <div className="page-error">
        <div>
          <h2>No data from the {dataSource === 'proxy' ? 'live proxy' : dataSource} source</h2>
          <p>
            {dataSource === 'proxy' && (
              <>
                Make sure the proxy server is running (<code>npm run dev -w server</code>).
                Outside race weekends the NASCAR feed may also be empty.
              </>
            )}
            {dataSource === 'replay' && (
              <>
                Start the replay server first:{' '}
                <code>python led_sports_ticker/replay.py &lt;recording&gt;.json.gz</code>
              </>
            )}
            {dataSource === 'demo' && 'The demo simulator failed — check the console.'}
          </p>
          <p>You can switch the data source in the top-right selector.</p>
        </div>
      </div>
    );
  }
  return <div className="page-loading">Loading race data…</div>;
}
