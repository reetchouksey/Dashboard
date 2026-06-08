import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiGrid, FiUsers, FiCalendar, FiFileText, FiBriefcase,
  FiTrendingUp, FiUser, FiSettings, FiActivity,
} from 'react-icons/fi';
import { closeMobileSidebar } from '../redux/slices/uiSlice.js';
import { useAuth } from '../hooks/useAuth.js';

const mainLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: <FiGrid /> },
  { to: '/employees', label: 'Employees', icon: <FiUsers /> },
  { to: '/attendance', label: 'Attendance', icon: <FiCalendar /> },
  { to: '/leaves', label: 'Leaves', icon: <FiFileText /> },
  { to: '/departments', label: 'Departments', icon: <FiBriefcase />, adminOnly: true },
  { to: '/performance', label: 'Performance', icon: <FiTrendingUp /> },
];

const accountLinks = [
  { to: '/profile', label: 'Profile', icon: <FiUser /> },
  { to: '/activity-logs', label: 'Activity Logs', icon: <FiActivity /> },
  { to: '/settings', label: 'Settings', icon: <FiSettings /> },
];

const Sidebar = () => {
  const { sidebarCollapsed, mobileSidebarOpen } = useSelector((s) => s.ui);
  const dispatch = useDispatch();
  const { isAdmin } = useAuth();

  const handleNav = () => dispatch(closeMobileSidebar());

  return (
    <>
      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${
          mobileSidebarOpen ? 'mobile-open' : ''
        }`}
      >
        <div className="sidebar-brand">
          <div className="logo">E</div>
          <span>EMS Dashboard</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {mainLinks
            .filter((l) => !l.adminOnly || isAdmin)
            .map((l) => (
              <NavLink key={l.to} to={l.to} className="nav-link" onClick={handleNav}>
                {l.icon}
                <span>{l.label}</span>
              </NavLink>
            ))}

          <div className="nav-section-label">Account</div>
          {accountLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className="nav-link" onClick={handleNav}>
              {l.icon}
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div
        className={`sidebar-overlay ${mobileSidebarOpen ? 'show' : ''}`}
        onClick={handleNav}
      />
    </>
  );
};

export default Sidebar;
