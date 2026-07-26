import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { CameraPanel } from '../cameras/CameraPanel';
import { ReplayControls } from '../replay/ReplayControls';
import { useLiveFeed } from '../../api/queries';
import { useFlagTheme } from '../../hooks/useFlagTheme';
import { useRaceHistory } from '../../state/raceHistoryStore';
import './layout.css';

export function AppShell() {
  const { data: feed } = useLiveFeed();
  useFlagTheme(feed?.flag_state);
  const [camerasOpen, setCamerasOpen] = useState(false);

  // Runs regardless of which page is open, so lap-by-lap history keeps
  // accumulating for the analytics page even while viewing e.g. the pit board.
  const recordFeed = useRaceHistory((s) => s.recordFeed);
  useEffect(() => {
    if (feed) recordFeed(feed);
  }, [feed, recordFeed]);

  return (
    <div className="app-shell">
      <SideNav />
      <TopBar onToggleCameras={() => setCamerasOpen((v) => !v)} />
      <main className="app-main">
        <Outlet />
      </main>
      <CameraPanel open={camerasOpen} onClose={() => setCamerasOpen(false)} />
      <ReplayControls />
    </div>
  );
}
