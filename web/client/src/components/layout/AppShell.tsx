import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { CameraPanel } from '../cameras/CameraPanel';
import { ReplayControls } from '../replay/ReplayControls';
import { useLiveFeed } from '../../api/queries';
import { useFlagTheme } from '../../hooks/useFlagTheme';
import './layout.css';

export function AppShell() {
  const { data: feed } = useLiveFeed();
  useFlagTheme(feed?.flag_state);
  const [camerasOpen, setCamerasOpen] = useState(false);

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
