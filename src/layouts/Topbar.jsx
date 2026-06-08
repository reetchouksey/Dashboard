import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiMenu, FiSun, FiMoon, FiBell, FiSearch, FiLogOut, FiUser, FiSettings,
} from 'react-icons/fi';
import {
  toggleSidebar, toggleMobileSidebar, toggleTheme,
} from '../redux/slices/uiSlice.js';
import { logout } from '../redux/slices/authSlice.js';
import { notificationService } from '../services/miscService.js';
import { useAuth } from '../hooks/useAuth.js';
import { timeAgo } from '../utils/helpers.js';
import { useToast } from '../hooks/useToast.js';

const Topbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const theme = useSelector((s) => s.ui.theme);

  const [showNotif, setShowNotif] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  // Load notifications + close dropdowns when clicking outside.
  useEffect(() => {
    notificationService.list().then(setNotifications).catch(() => {});
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const onMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const onLogout = () => {
    dispatch(logout());
    toast.info('You have been logged out');
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-btn"
          onClick={() => {
            if (window.innerWidth <= 768) dispatch(toggleMobileSidebar());
            else dispatch(toggleSidebar());
          }}
          aria-label="Toggle sidebar"
        >
          <FiMenu />
        </button>
        <div className="search-box">
          <FiSearch />
          <input placeholder="Search employees, departments…" />
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="icon-btn"
          onClick={() => dispatch(toggleTheme())}
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
        >
          {theme === 'light' ? <FiMoon /> : <FiSun />}
        </button>

        <div className="dropdown" ref={notifRef}>
          <button
            className="icon-btn"
            onClick={() => setShowNotif((v) => !v)}
            aria-label="Notifications"
          >
            <FiBell />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          {showNotif && (
            <div className="dropdown-menu notif-panel">
              <div className="notif-header flex items-center" style={{ justifyContent: 'space-between' }}>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={onMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: 24 }}>
                    <div>No notifications yet</div>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${n.read ? '' : 'unread'}`}
                    >
                      <div className="title">{n.title}</div>
                      <div className="msg">{n.message}</div>
                      <div className="time">{timeAgo(n.time)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="dropdown" ref={menuRef}>
          <div className="user-chip" onClick={() => setShowMenu((v) => !v)}>
            <img src={user?.avatar} alt={user?.name} />
            <div className="user-chip-info">
              <div className="name">{user?.name}</div>
              <div className="role">{user?.role}</div>
            </div>
          </div>
          {showMenu && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => { navigate('/profile'); setShowMenu(false); }}>
                <FiUser /> My Profile
              </button>
              <button className="dropdown-item" onClick={() => { navigate('/settings'); setShowMenu(false); }}>
                <FiSettings /> Settings
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={onLogout}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
