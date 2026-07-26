import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PitsPage } from './pages/PitsPage';
import { PointsPage } from './pages/PointsPage';
import { FlagsPage } from './pages/FlagsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

const queryClient = new QueryClient();

const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <OverviewPage /> },
      { path: '/leaderboard', element: <LeaderboardPage /> },
      { path: '/pits', element: <PitsPage /> },
      { path: '/points', element: <PointsPage /> },
      { path: '/flags', element: <FlagsPage /> },
      { path: '/analytics', element: <AnalyticsPage /> },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
