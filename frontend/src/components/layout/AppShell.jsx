import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';

export default function AppShell() {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <TopBar />
      <main className="flex-1 min-h-screen overflow-x-hidden" style={{ marginLeft: '220px', paddingTop: '52px' }}>
        <Outlet />
      </main>
    </div>
  );
}
