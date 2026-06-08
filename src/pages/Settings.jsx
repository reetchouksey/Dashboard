import { useDispatch, useSelector } from 'react-redux';
import { FiSun, FiMoon, FiLogOut, FiTrash2 } from 'react-icons/fi';
import { setTheme, toggleSidebar } from '../redux/slices/uiSlice.js';
import { logout } from '../redux/slices/authSlice.js';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast.js';

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { theme, sidebarCollapsed } = useSelector((s) => s.ui);

  const onClearLocal = () => {
    localStorage.removeItem('ems_theme');
    localStorage.removeItem('ems_sidebar_collapsed');
    toast.success('Local preferences cleared. Refresh to apply defaults.');
  };

  const onLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-subtitle">Customise your dashboard experience.</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header"><div className="card-title">Appearance</div></div>
        <div className="card-body">
          <div className="info-row">
            <span>Theme</span>
            <span className="flex gap-2">
              <button
                className={`btn ${theme === 'light' ? 'btn-primary' : ''}`}
                onClick={() => dispatch(setTheme('light'))}
              >
                <FiSun /> Light
              </button>
              <button
                className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`}
                onClick={() => dispatch(setTheme('dark'))}
              >
                <FiMoon /> Dark
              </button>
            </span>
          </div>
          <div className="info-row">
            <span>Sidebar</span>
            <span>
              <button className="btn" onClick={() => dispatch(toggleSidebar())}>
                {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </button>
            </span>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header"><div className="card-title">Notifications</div></div>
        <div className="card-body">
          <div className="info-row">
            <span>Email Notifications</span>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> Enabled
            </label>
          </div>
          <div className="info-row">
            <span>Push Notifications</span>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> Enabled
            </label>
          </div>
          <div className="info-row">
            <span>Daily Summary Email</span>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Enabled
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Danger Zone</div></div>
        <div className="card-body">
          <div className="info-row">
            <span>Reset local preferences</span>
            <button className="btn" onClick={onClearLocal}>
              <FiTrash2 /> Clear cache
            </button>
          </div>
          <div className="info-row">
            <span>End your session</span>
            <button className="btn btn-danger" onClick={onLogout}>
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
