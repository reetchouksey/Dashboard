import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiUsers, FiUserCheck, FiUserX, FiBriefcase,
} from 'react-icons/fi';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { fetchEmployees } from '../redux/slices/employeeSlice.js';
import { fetchAttendance } from '../redux/slices/attendanceSlice.js';
import { fetchLeaves } from '../redux/slices/leaveSlice.js';
import { fetchDepartments } from '../redux/slices/departmentSlice.js';
import { activityService, performanceService } from '../services/miscService.js';
import { Loading } from '../components/common/States.jsx';
import { CHART_COLORS } from '../utils/constants.js';
import { todayISO, timeAgo } from '../utils/helpers.js';

const StatCard = ({ icon, label, value, gradient, delta }) => (
  <div className="stat-card">
    <div className="icon-wrap" style={{ background: gradient }}>{icon}</div>
    <div>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {delta !== undefined && (
        <div className={`delta ${delta < 0 ? 'down' : ''}`}>
          {delta >= 0 ? '+' : ''}{delta}% vs last month
        </div>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { list: employees, loading: empLoading } = useSelector((s) => s.employees);
  const { list: attendance } = useSelector((s) => s.attendance);
  const { list: leaves } = useSelector((s) => s.leaves);
  const { list: departments } = useSelector((s) => s.departments);

  const [activities, setActivities] = useState([]);
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchAttendance());
    dispatch(fetchLeaves());
    dispatch(fetchDepartments());
    activityService.list().then(setActivities).catch(() => {});
    performanceService.list().then(setPerformance).catch(() => {});
  }, [dispatch]);

  const today = todayISO();
  const todaysAttendance = attendance.filter((a) => a.date === today);
  const presentToday = todaysAttendance.filter((a) => a.status === 'Present').length;
  const onLeaveToday = todaysAttendance.filter((a) => a.status === 'Leave').length
    || leaves.filter((l) => l.status === 'Approved' && l.fromDate <= today && l.toDate >= today).length;

  // Aggregate department headcount for the pie chart.
  const deptCount = useMemo(() => {
    const map = {};
    employees.forEach((e) => { map[e.department] = (map[e.department] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [employees]);

  // Average performance score per month for the bar chart.
  const perfByMonth = useMemo(() => {
    const map = {};
    performance.forEach((p) => {
      if (!map[p.month]) map[p.month] = { month: p.month, sum: 0, count: 0 };
      map[p.month].sum += p.score;
      map[p.month].count += 1;
    });
    return Object.values(map)
      .map((m) => ({ month: m.month, score: Math.round(m.sum / m.count) }))
      .reverse();
  }, [performance]);

  if (empLoading && employees.length === 0) {
    return <Loading label="Loading dashboard…" />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <div className="page-subtitle">Welcome back! Here is a snapshot of today's activity.</div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          icon={<FiUsers />}
          label="Total Employees"
          value={employees.length}
          gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
          delta={3.4}
        />
        <StatCard
          icon={<FiUserCheck />}
          label="Present Today"
          value={presentToday}
          gradient="linear-gradient(135deg, #10b981, #059669)"
          delta={1.2}
        />
        <StatCard
          icon={<FiUserX />}
          label="On Leave"
          value={onLeaveToday}
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          delta={-0.5}
        />
        <StatCard
          icon={<FiBriefcase />}
          label="Departments"
          value={departments.length}
          gradient="linear-gradient(135deg, #3b82f6, #1d4ed8)"
        />
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="flex items-center" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="font-bold" style={{ fontSize: 16 }}>Performance Overview</div>
              <div className="text-xs text-muted">Average company-wide performance score</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={perfByMonth}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="score" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="font-bold mb-3" style={{ fontSize: 16 }}>Department Headcount</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={deptCount}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {deptCount.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2 mt-4">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activities</div>
          </div>
          <div className="card-body">
            {activities.length === 0 ? (
              <div className="text-muted text-sm">No recent activities.</div>
            ) : (
              <div className="activity-list">
                {activities.slice(0, 6).map((a) => (
                  <div key={a.id} className="activity-item">
                    <div className="activity-dot">{a.user?.[0]?.toUpperCase() || 'A'}</div>
                    <div className="activity-text">
                      <div className="main">
                        <strong>{a.user}</strong> {a.action} <strong>{a.target}</strong>
                      </div>
                      <div className="time">{timeAgo(a.time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Performers (May 2026)</div>
          </div>
          <div className="card-body">
            {performance
              .filter((p) => p.month === 'May 2026')
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center"
                  style={{
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i === 4 ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="activity-dot"
                      style={{
                        background: i === 0 ? 'rgba(245,158,11,0.15)' : 'var(--brand-50)',
                        color: i === 0 ? '#d97706' : 'var(--brand-600)',
                      }}
                    >
                      #{i + 1}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ fontSize: 14 }}>{p.employeeName}</div>
                      <div className="text-xs text-muted">Rating {p.rating} / 5.0</div>
                    </div>
                  </div>
                  <span className="badge badge-success">{p.score}%</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
