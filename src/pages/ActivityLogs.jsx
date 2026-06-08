import { useEffect, useState } from 'react';
import { activityService } from '../services/miscService.js';
import { Loading, EmptyState } from '../components/common/States.jsx';
import { formatDateTime, timeAgo } from '../utils/helpers.js';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    activityService
      .list()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      l.user?.toLowerCase().includes(term) ||
      l.action?.toLowerCase().includes(term) ||
      l.target?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Logs</h1>
          <div className="page-subtitle">Audit trail of every key action across the dashboard.</div>
        </div>
        <input
          className="form-control"
          placeholder="Search activities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState title="No activity logs" message="Logs will appear here as users interact with the system." />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr><th>User</th><th>Action</th><th>Target</th><th>Time</th><th>Date</th></tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div className="name-cell">
                        <div className="activity-dot">{l.user?.[0]?.toUpperCase() || '?'}</div>
                        <div className="text">
                          <div className="name">{l.user}</div>
                        </div>
                      </div>
                    </td>
                    <td>{l.action}</td>
                    <td><span className="badge badge-info">{l.target}</span></td>
                    <td className="text-muted text-sm">{timeAgo(l.time)}</td>
                    <td className="text-sm">{formatDateTime(l.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
