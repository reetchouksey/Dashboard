import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiCalendar, FiBriefcase } from 'react-icons/fi';
import { fetchEmployees } from '../redux/slices/employeeSlice.js';
import { fetchAttendance } from '../redux/slices/attendanceSlice.js';
import { fetchLeaves } from '../redux/slices/leaveSlice.js';
import { Loading, EmptyState } from '../components/common/States.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { formatDate } from '../utils/helpers.js';

const EmployeeDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const employees = useSelector((s) => s.employees.list);
  const attendance = useSelector((s) => s.attendance.list);
  const leaves = useSelector((s) => s.leaves.list);

  useEffect(() => {
    if (employees.length === 0) dispatch(fetchEmployees());
    if (attendance.length === 0) dispatch(fetchAttendance());
    if (leaves.length === 0) dispatch(fetchLeaves());
  }, [dispatch, employees.length, attendance.length, leaves.length]);

  const employee = employees.find((e) => String(e.id) === String(id));

  const stats = useMemo(() => {
    if (!employee) return null;
    const att = attendance.filter((a) => a.employeeId === employee.id);
    const present = att.filter((a) => a.status === 'Present').length;
    const total = att.length;
    return {
      attendanceCount: total,
      presentCount: present,
      attendancePct: total ? Math.round((present / total) * 100) : 0,
      leavesTaken: leaves.filter((l) => l.employeeId === employee.id && l.status === 'Approved').length,
      pendingLeaves: leaves.filter((l) => l.employeeId === employee.id && l.status === 'Pending').length,
    };
  }, [employee, attendance, leaves]);

  if (employees.length === 0) return <Loading />;
  if (!employee) return <EmptyState title="Employee not found" action={<button className="btn" onClick={() => navigate('/employees')}>Back to list</button>} />;

  return (
    <div>
      <div className="page-header">
        <button className="btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>
      </div>

      <div className="profile-grid">
        <div className="card profile-summary">
          <img src={employee.avatar} alt={employee.name} />
          <div className="name">{employee.name}</div>
          <div className="role">{employee.designation}</div>
          <div className="mt-2"><StatusBadge status={employee.status} /></div>
          <div className="divider" />
          <div className="text-sm" style={{ textAlign: 'left' }}>
            <div className="info-row"><span><FiMail /> Email</span><span>{employee.email}</span></div>
            <div className="info-row"><span><FiPhone /> Phone</span><span>{employee.phone || '-'}</span></div>
            <div className="info-row"><span><FiBriefcase /> Department</span><span>{employee.department}</span></div>
            <div className="info-row"><span><FiCalendar /> Joined</span><span>{formatDate(employee.joiningDate)}</span></div>
            <div className="info-row"><span><FiMapPin /> Address</span><span style={{ textAlign: 'right' }}>{employee.address || '-'}</span></div>
          </div>
        </div>

        <div>
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>%</div>
              <div>
                <div className="label">Attendance</div>
                <div className="value">{stats.attendancePct}%</div>
                <div className="text-xs text-muted">{stats.presentCount}/{stats.attendanceCount} days</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>L</div>
              <div>
                <div className="label">Leaves Taken</div>
                <div className="value">{stats.leavesTaken}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>P</div>
              <div>
                <div className="label">Pending Leaves</div>
                <div className="value">{stats.pendingLeaves}</div>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header"><div className="card-title">Recent Attendance</div></div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Status</th><th>Check-in</th><th>Check-out</th></tr>
                </thead>
                <tbody>
                  {attendance.filter((a) => a.employeeId === employee.id).slice(0, 8).map((a) => (
                    <tr key={a.id}>
                      <td>{formatDate(a.date)}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>{a.checkIn || '-'}</td>
                      <td>{a.checkOut || '-'}</td>
                    </tr>
                  ))}
                  {attendance.filter((a) => a.employeeId === employee.id).length === 0 && (
                    <tr><td colSpan={4}><EmptyState title="No attendance records yet" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header"><div className="card-title">Leave Requests</div></div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {leaves.filter((l) => l.employeeId === employee.id).map((l) => (
                    <tr key={l.id}>
                      <td>{l.leaveType}</td>
                      <td>{formatDate(l.fromDate)}</td>
                      <td>{formatDate(l.toDate)}</td>
                      <td>{l.days}</td>
                      <td><StatusBadge status={l.status} /></td>
                    </tr>
                  ))}
                  {leaves.filter((l) => l.employeeId === employee.id).length === 0 && (
                    <tr><td colSpan={5}><EmptyState title="No leave requests yet" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4">
            <Link to="/employees" className="btn">Back to all employees</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
