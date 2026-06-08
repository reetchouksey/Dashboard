import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiCalendar, FiCheck, FiX, FiCoffee } from 'react-icons/fi';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { fetchAttendance, markAttendance, setFilterDate } from '../redux/slices/attendanceSlice.js';
import { fetchEmployees } from '../redux/slices/employeeSlice.js';
import { Loading, EmptyState } from '../components/common/States.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { ATTENDANCE_STATUSES } from '../utils/constants.js';
import { formatDate, todayISO } from '../utils/helpers.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../hooks/useAuth.js';

const Attendance = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { isAdmin, user } = useAuth();
  const { list: attendance, loading, filterDate } = useSelector((s) => s.attendance);
  const employees = useSelector((s) => s.employees.list);

  const [tab, setTab] = useState('today');

  useEffect(() => {
    dispatch(fetchAttendance());
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Combine the employee list with today's attendance to drive the marking grid.
  const todayRows = useMemo(() => {
    return employees.map((emp) => {
      const record = attendance.find((a) => a.employeeId === emp.id && a.date === filterDate);
      return {
        employee: emp,
        status: record?.status || 'Pending',
        checkIn: record?.checkIn || '',
        checkOut: record?.checkOut || '',
      };
    });
  }, [employees, attendance, filterDate]);

  const onMark = async (emp, status) => {
    if (!isAdmin && emp.id !== user?.id) {
      toast.error('You can only mark your own attendance');
      return;
    }
    const now = new Date().toTimeString().slice(0, 5);
    try {
      await dispatch(
        markAttendance({
          employeeId: emp.id,
          employeeName: emp.name,
          date: filterDate,
          status,
          checkIn: status === 'Present' ? now : '',
          checkOut: '',
        })
      ).unwrap();
      toast.success(`Marked ${emp.name} as ${status}`);
    } catch (err) {
      toast.error(err.message || 'Failed to mark attendance');
    }
  };

  // Aggregate monthly attendance by date for trend chart.
  const monthlyTrend = useMemo(() => {
    const map = {};
    attendance.forEach((a) => {
      if (!map[a.date]) map[a.date] = { date: a.date, present: 0, absent: 0, leave: 0 };
      if (a.status === 'Present') map[a.date].present += 1;
      if (a.status === 'Absent') map[a.date].absent += 1;
      if (a.status === 'Leave') map[a.date].leave += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [attendance]);

  const summary = useMemo(() => {
    const today = attendance.filter((a) => a.date === filterDate);
    return {
      total: employees.length,
      present: today.filter((a) => a.status === 'Present').length,
      absent: today.filter((a) => a.status === 'Absent').length,
      leave: today.filter((a) => a.status === 'Leave').length,
    };
  }, [attendance, filterDate, employees.length]);

  // Per-employee attendance percentage across all-time records.
  const monthlyReport = useMemo(() => {
    const byEmp = {};
    attendance.forEach((a) => {
      if (!byEmp[a.employeeId]) byEmp[a.employeeId] = { present: 0, absent: 0, leave: 0, total: 0 };
      const e = byEmp[a.employeeId];
      e.total += 1;
      if (a.status === 'Present') e.present += 1;
      if (a.status === 'Absent') e.absent += 1;
      if (a.status === 'Leave') e.leave += 1;
    });
    return employees.map((emp) => {
      const e = byEmp[emp.id] || { present: 0, absent: 0, leave: 0, total: 0 };
      return {
        ...emp,
        present: e.present,
        absent: e.absent,
        leave: e.leave,
        total: e.total,
        percentage: e.total ? Math.round((e.present / e.total) * 100) : 0,
      };
    });
  }, [attendance, employees]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <div className="page-subtitle">Mark attendance and review monthly reports.</div>
        </div>
        <div className="flex gap-2 items-center">
          <FiCalendar style={{ color: 'var(--text-muted)' }} />
          <input
            type="date"
            className="form-control"
            value={filterDate}
            onChange={(e) => dispatch(setFilterDate(e.target.value))}
            max={todayISO()}
            style={{ width: 180 }}
          />
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{summary.total}</div>
          <div><div className="label">Total Employees</div><div className="value">{summary.total}</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><FiCheck /></div>
          <div><div className="label">Present</div><div className="value">{summary.present}</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)' }}><FiX /></div>
          <div><div className="label">Absent</div><div className="value">{summary.absent}</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><FiCoffee /></div>
          <div><div className="label">On Leave</div><div className="value">{summary.leave}</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex gap-2">
            <button
              className={`btn ${tab === 'today' ? 'btn-primary' : ''}`}
              onClick={() => setTab('today')}
            >
              Mark Attendance
            </button>
            <button
              className={`btn ${tab === 'history' ? 'btn-primary' : ''}`}
              onClick={() => setTab('history')}
            >
              History
            </button>
            <button
              className={`btn ${tab === 'report' ? 'btn-primary' : ''}`}
              onClick={() => setTab('report')}
            >
              Monthly Report
            </button>
          </div>
        </div>

        {loading && attendance.length === 0 ? (
          <Loading />
        ) : tab === 'today' ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Check-in</th>
                  <th style={{ textAlign: 'right' }}>Mark</th>
                </tr>
              </thead>
              <tbody>
                {todayRows.map((row) => (
                  <tr key={row.employee.id}>
                    <td>
                      <div className="name-cell">
                        <img src={row.employee.avatar} alt={row.employee.name} />
                        <div className="text">
                          <div className="name">{row.employee.name}</div>
                          <div className="sub">{row.employee.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td>{row.employee.department}</td>
                    <td>
                      {row.status === 'Pending' ? (
                        <span className="badge badge-muted">Not marked</span>
                      ) : (
                        <StatusBadge status={row.status} />
                      )}
                    </td>
                    <td>{row.checkIn || '-'}</td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => onMark(row.employee, 'Present')}
                        >
                          <FiCheck /> Present
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => onMark(row.employee, 'Absent')}
                        >
                          <FiX /> Absent
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => onMark(row.employee, 'Leave')}
                        >
                          <FiCoffee /> Leave
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'history' ? (
          <div>
            <div className="card-body">
              <div className="font-semibold mb-3">Daily Attendance Trend</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                  />
                  <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="leave" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th><th>Employee</th><th>Status</th><th>Check-in</th><th>Check-out</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr><td colSpan={5}><EmptyState title="No attendance records yet" /></td></tr>
                  ) : attendance.slice(0, 50).map((a) => (
                    <tr key={a.id}>
                      <td>{formatDate(a.date)}</td>
                      <td>{a.employeeName}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>{a.checkIn || '-'}</td>
                      <td>{a.checkOut || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th><th>Present</th><th>Absent</th><th>Leave</th><th>Total Days</th><th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReport.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="name-cell">
                        <img src={r.avatar} alt={r.name} />
                        <div className="text">
                          <div className="name">{r.name}</div>
                          <div className="sub">{r.department}</div>
                        </div>
                      </div>
                    </td>
                    <td>{r.present}</td>
                    <td>{r.absent}</td>
                    <td>{r.leave}</td>
                    <td>{r.total}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{
                          flex: 1, height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden',
                          maxWidth: 100,
                        }}>
                          <div style={{
                            width: `${r.percentage}%`, height: '100%',
                            background: r.percentage >= 80 ? 'var(--success)' : r.percentage >= 50 ? 'var(--warning)' : 'var(--danger)',
                          }} />
                        </div>
                        <span className="font-semibold">{r.percentage}%</span>
                      </div>
                    </td>
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

export default Attendance;
