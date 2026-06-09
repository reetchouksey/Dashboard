import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi';
import { loginUser, registerUser, clearError } from '../redux/slices/authSlice.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { baseURL } from '../services/api.js';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, loading, error, errorCode } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'employee',
  });
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => () => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => { dispatch(clearError()); setTouched(false); }, [mode, dispatch]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    if (mode === 'signup' && !form.name.trim()) return 'Please enter your full name';
    if (!form.email.includes('@')) return 'Enter a valid email address';
    if (form.password.length < 4) return 'Password must be at least 4 characters';
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (validate()) return;

    const action = mode === 'login' ? loginUser(form) : registerUser(form);
    const result = await dispatch(action);

    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(
        mode === 'login'
          ? `Welcome back, ${result.payload.name}!`
          : `Account created — welcome, ${result.payload.name}!`
      );
      navigate('/dashboard');
    }
  };

  const fillDemo = (role) => {
    setMode('login');
    if (role === 'admin') {
      setForm({ ...form, email: 'admin@company.com', password: 'admin123' });
    } else {
      setForm({ ...form, email: 'john@company.com', password: 'john123' });
    }
  };

  const validationError = touched ? validate() : null;
  const isSignup = mode === 'signup';

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="logo">E</div>
          <div>
            <div style={{ fontWeight: 800 }}>EMS Dashboard</div>
            <div className="text-xs text-muted">Employee Management System</div>
          </div>
        </div>

        <div className="login-title">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </div>
        <div className="login-subtitle">
          {isSignup
            ? 'Sign up to start managing your team.'
            : 'Sign in to access your dashboard'}
        </div>

        {/* Mode switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isSignup ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${isSignup ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate>
          {isSignup && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <FiUser className="input-icon" />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: 36 }}
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <FiMail className="input-icon" />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: 36 }}
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock className="input-icon" />
              <input
                type={showPw ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: 36, paddingRight: 40 }}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                style={{ position: 'absolute', right: 4, top: 4 }}
                onClick={() => setShowPw((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showPw ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {isSignup && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {(errorCode === 'BACKEND_UNREACHABLE' || errorCode === 'BACKEND_NOT_DEPLOYED') ? (
            <div className="backend-down">
              <div className="backend-down-icon"><FiAlertTriangle /></div>
              <div className="backend-down-title">Backend service is offline</div>
              <div className="backend-down-msg">
                The login server isn't reachable right now. If you're the admin,
                make sure the backend is deployed and running, then refresh.
              </div>
              <div className="backend-down-url">
                Tried: <code>{baseURL}</code>
              </div>
            </div>
          ) : (validationError || error) ? (
            <div className="form-error mb-3">{validationError || error}</div>
          ) : null}

          <button
            type="submit"
            className="btn btn-auth w-full"
            disabled={loading}
            style={{ justifyContent: 'center' }}
          >
            {loading
              ? (isSignup ? 'Creating account…' : 'Signing in…')
              : (isSignup ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="auth-switch">
          {isSignup ? (
            <>Already have an account? <button type="button" onClick={() => setMode('login')}>Sign In</button></>
          ) : (
            <>New here? <button type="button" onClick={() => setMode('signup')}>Create an account</button></>
          )}
        </div>

        {!isSignup && (
          <div className="demo-creds">
            <strong>Demo accounts</strong>
            <div>
              <button className="btn btn-ghost btn-sm" onClick={() => fillDemo('admin')}>
                Admin: admin@company.com / admin123
              </button>
            </div>
            <div>
              <button className="btn btn-ghost btn-sm" onClick={() => fillDemo('employee')}>
                Employee: john@company.com / john123
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
