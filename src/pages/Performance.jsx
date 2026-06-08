import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { FiAward, FiTrendingUp, FiStar } from 'react-icons/fi';
import { performanceService } from '../services/miscService.js';
import { fetchEmployees } from '../redux/slices/employeeSlice.js';
import { Loading, EmptyState } from '../components/common/States.jsx';

const Performance = () => {
  const dispatch = useDispatch();
  const employees = useSelector((s) => s.employees.list);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('All');

  useEffect(() => {
    dispatch(fetchEmployees());
    performanceService
      .list()
      .then(setData)
      .finally(() => setLoading(false));
  }, [dispatch]);

  const months = useMemo(() => ['All', ...Array.from(new Set(data.map((d) => d.month)))], [data]);

  const filtered = month === 'All' ? data : data.filter((d) => d.month === month);

  // Average score per month for trend chart.
  const trend = useMemo(() => {
    const map = {};
    data.forEach((p) => {
      if (!map[p.month]) map[p.month] = { month: p.month, sum: 0, count: 0 };
      map[p.month].sum += p.score;
      map[p.month].count += 1;
    });
    return Object.values(map).map((m) => ({
      month: m.month,
      avg: Math.round((m.sum / m.count) * 10) / 10,
    })).reverse();
  }, [data]);

  // Latest score per employee for top performers list.
  const latestByEmp = useMemo(() => {
    const map = {};
    data.forEach((p) => {
      if (!map[p.employeeId] || new Date(`1 ${p.month}`) > new Date(`1 ${map[p.employeeId].month}`)) {
        map[p.employeeId] = p;
      }
    });
    return Object.values(map).sort((a, b) => b.score - a.score);
  }, [data]);

  const company = useMemo(() => {
    if (data.length === 0) return { avg: 0, top: 0, ratings: 0 };
    const avg = data.reduce((s, p) => s + p.score, 0) / data.length;
    const top = Math.max(...data.map((p) => p.score));
    return {
      avg: Math.round(avg * 10) / 10,
      top,
      ratings: data.length,
    };
  }, [data]);

  if (loading) return <Loading label="Loading performance data…" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance Reports</h1>
          <div className="page-subtitle">Monitor employee performance, ratings and growth trends.</div>
        </div>
        <select
          className="form-select"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ width: 180 }}
        >
          {months.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}><FiTrendingUp /></div>
          <div><div className="label">Average Score</div><div className="value">{company.avg}%</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><FiAward /></div>
          <div><div className="label">Top Score</div><div className="value">{company.top}%</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><FiStar /></div>
          <div><div className="label">Reviews Logged</div><div className="value">{company.ratings}</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>{employees.length}</div>
          <div><div className="label">Employees</div><div className="value">{employees.length}</div></div>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="chart-card">
          <div className="font-bold mb-3">Performance Trend</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} domain={[60, 100]} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={3} name="Average score" dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="font-bold mb-3">Top 5 Performers</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={latestByEmp.slice(0, 5)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
              <YAxis dataKey="employeeName" type="category" stroke="var(--text-muted)" fontSize={12} width={120} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="score" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="font-bold">Employee Ratings ({month})</div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No performance entries" message="Try selecting a different month." />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th><th>Month</th><th>Rating</th><th>Score</th><th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{p.employeeName}</td>
                    <td>{p.month}</td>
                    <td>
                      <span className="badge badge-warning">★ {p.rating} / 5.0</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{
                          flex: 1, maxWidth: 120, height: 6,
                          background: 'var(--border)', borderRadius: 999, overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${p.score}%`, height: '100%',
                            background: p.score >= 90 ? 'var(--success)' : p.score >= 75 ? 'var(--info)' : 'var(--warning)',
                          }} />
                        </div>
                        <span className="font-semibold">{p.score}</span>
                      </div>
                    </td>
                    <td>{p.feedback}</td>
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

export default Performance;
