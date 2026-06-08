import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

// Top-level shell that hosts every authenticated page.
const DashboardLayout = () => {
  const sidebarCollapsed = useSelector((s) => s.ui.sidebarCollapsed);
  return (
    <div className="app-shell">
      <Sidebar />
      <div className={`app-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Topbar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
