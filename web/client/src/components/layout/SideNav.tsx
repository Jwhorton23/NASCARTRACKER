import { NavLink } from 'react-router-dom';

const icon = (path: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={path} />
  </svg>
);

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: icon('M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10') },
  { to: '/leaderboard', label: 'Leaderboard', icon: icon('M8 21h8M12 21v-4M17 5h4v3a4 4 0 01-4 4M7 5H3v3a4 4 0 004 4M7 3h10v6a5 5 0 01-10 0V3z') },
  { to: '/pits', label: 'Pit Stops', icon: icon('M14 6l-8.5 8.5a2.1 2.1 0 103 3L17 9M15 4l5 5M9 12l6 6') },
  { to: '/points', label: 'Points & Stages', icon: icon('M12 2l2.9 6.26L21 9.27l-5 4.87L17.18 21 12 17.77 6.82 21 8 14.14l-5-4.87 6.1-1.01L12 2z') },
  { to: '/flags', label: 'Flag History', icon: icon('M4 22V4a1 1 0 011-1h9l1 2h5v11h-8l-1-2H6') },
  { to: '/analytics', label: 'Analytics', icon: icon('M3 3v18h18M7 16l4-6 3 4 5-8') },
];

export function SideNav() {
  return (
    <nav className="sidenav">
      <div className="brand">
        <span className="brand-mark flag-themed">🏁</span>
        <span>RACE TRACKER</span>
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'}>
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
      <div className="nav-foot">
        Data: cf.nascar.com public feeds.
        <br />
        Unofficial fan project.
      </div>
    </nav>
  );
}
