import { Link } from 'react-router-dom';

const NotFound = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 40,
      textAlign: 'center',
    }}
  >
    <div>
      <div style={{ fontSize: 96, fontWeight: 800, color: 'var(--brand-500)', lineHeight: 1 }}>404</div>
      <h2 style={{ marginTop: 12 }}>Page not found</h2>
      <p className="text-muted">The page you’re looking for doesn’t exist or was moved.</p>
      <Link to="/dashboard" className="btn btn-primary mt-3">Back to Dashboard</Link>
    </div>
  </div>
);

export default NotFound;
