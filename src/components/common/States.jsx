import { FiInbox, FiAlertTriangle } from 'react-icons/fi';

export const Loading = ({ label = 'Loading…' }) => (
  <div className="loading-state">
    <div className="spinner" />
    <div>{label}</div>
  </div>
);

export const EmptyState = ({ title = 'No data available', message, action }) => (
  <div className="empty-state">
    <div className="icon"><FiInbox /></div>
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {action && <div style={{ marginTop: 14 }}>{action}</div>}
  </div>
);

export const ErrorState = ({ message = 'Something went wrong', onRetry }) => (
  <div className="error-state">
    <div className="icon" style={{ color: 'var(--danger)' }}><FiAlertTriangle /></div>
    <h3 style={{ color: 'var(--text-primary)' }}>Error</h3>
    <p>{message}</p>
    {onRetry && (
      <button className="btn btn-primary mt-3" onClick={onRetry}>
        Try Again
      </button>
    )}
  </div>
);
