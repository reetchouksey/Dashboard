import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiCheck, FiX, FiTrash2 } from 'react-icons/fi';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import {
  fetchLeaves, applyLeave, updateLeaveStatus, deleteLeave, setLeaveFilter,
} from '../redux/slices/leaveSlice.js';
import { fetchEmployees } from '../redux/slices/employeeSlice.js';
import Modal from '../components/common/Modal.jsx';
import { Loading, EmptyState } from '../components/common/States.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { LEAVE_TYPES, LEAVE_STATUSES, CHART_COLORS } from '../utils/constants.js';
import { daysBetween, formatDate, todayISO } from '../utils/helpers.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../hooks/useAuth.js';

const Leaves = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { isAdmin, user } = useAuth();
  const { list: leaves, loading, filterStatus, filterType } = useSelector((s) => s.leaves);
  const employees = useSelector((s) => s.employees.list);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const blank = {
    employeeId: user?.id || employees[0]?.id || 1,
    leaveType: LEAVE_TYPES[0],
    fromDate: todayISO(),
    toDate: todayISO(),
    reason: '',
  };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    dispatch(fetchLeaves());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const filtered = useMemo(() => {
    return leaves.filter((l) => {
      if (filterStatus !== 'All' && l.status !== filterStatus) return false;
      if (filterType !== 'All' && l.leaveType !== filterType) return false;
      // Non-admins only see their own.
      if (!isAdmin && l.employeeId !== user?.id) return false;
      return true;
    });
  }, [leaves, filterStatus, filterType, isAdmin, user?.id]);

  const stats = useMemo(() => ({
    pending: leaves.filter((l) => l.status === 'Pending').length,
    approved: leaves.filter((l) => l.status === 'Approved').length,
    rejected: leaves.filter((l) => l.status === 'Rejected').length,
    total: leaves.length,
  }), [leaves]);

  const byType = useMemo(() => {
    const map = {};
    LEAVE_TYPES.forEach((t) => { map[t] = 0; });
    leaves.forEach((l) => { map[l.leaveType] = (map[l.leaveType] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [leaves]);

  const onApply = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) { toast.error('Please provide a reason'); return; }
    if (form.toDate < form.fromDate) { toast.error('"To" date must be after "From"'); return; }

    setSubmitting(true);
    try {
      const emp = employees.find((x) => x.id === Number(form.employeeId));
      const payload = {
        ...form,
        employeeId: Number(form.employeeId),
        employeeName: emp?.name || user?.name || 'Unknown',
        days: daysBetween(form.fromDate, form.toDate),
        status: 'Pending',
        appliedOn: todayISO(),
      };
      await dispatch(applyLeave(payload)).unwrap();
      toast.success('Leave application submitted');
      setOpen(false);
      setForm(blank);
    } catch (err) {
      toast.error(err.message || 'Failed to apply for leave');
    } finally {
      setSubmitting(false);
    }
  };

  const onDecide = async (id, status) => {
    try {
      await dispatch(updateLeaveStatus({ id, status })).unwrap();
      toast.success(`Leave ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const onDelete = async () => {
    try {
      await dispatch(deleteLeave(confirm.id)).unwrap();
      toast.success('Leave request deleted');
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <div className="page-subtitle">
            {isAdmin ? 'Approve, reject and review all leave requests.' : 'Submit and track your own leave requests.'}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <FiPlus /> Apply Leave
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{stats.total}</div>
          <div><div className="label">Total Requests</div><div className="value">{stats.total}</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>{stats.pending}</div>
          <div><div className="label">Pending</div><div className="value">{stats.pending}</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>{stats.approved}</div>
          <div><div className="label">Approved</div><div className="value">{stats.approved}</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap" style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)' }}>{stats.rejected}</div>
          <div><div className="label">Rejected</div><div className="value">{stats.rejected}</div></div>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="chart-card">
          <div className="font-bold mb-3">Leaves by Type</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Quick Tips</div></div>
          <div className="card-body text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p>• Casual Leave for short personal absences (max 1–2 days).</p>
            <p>• Sick Leave for illness — attach a note for 3+ days.</p>
            <p>• Earned Leave is accrued and used for vacations.</p>
            <p>• Apply at least 7 days in advance for non-emergency leaves.</p>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="table-filters">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => dispatch(setLeaveFilter({ filterStatus: e.target.value }))}
            >
              <option value="All">All Statuses</option>
              {LEAVE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              className="form-select"
              value={filterType}
              onChange={(e) => dispatch(setLeaveFilter({ filterType: e.target.value }))}
            >
              <option value="All">All Types</option>
              {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <span className="text-xs text-muted">{filtered.length} request{filtered.length !== 1 && 's'}</span>
        </div>

        {loading && leaves.length === 0 ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState title="No leave requests" message="Click 'Apply Leave' to submit one." />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td>{l.employeeName}</td>
                    <td>{l.leaveType}</td>
                    <td>{formatDate(l.fromDate)}</td>
                    <td>{formatDate(l.toDate)}</td>
                    <td>{l.days}</td>
                    <td style={{ maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.reason}>
                      {l.reason}
                    </td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        {isAdmin && l.status === 'Pending' && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => onDecide(l.id, 'Approved')}>
                              <FiCheck /> Approve
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => onDecide(l.id, 'Rejected')}>
                              <FiX /> Reject
                            </button>
                          </>
                        )}
                        {(isAdmin || l.employeeId === user?.id) && l.status !== 'Approved' && (
                          <button className="btn btn-ghost btn-icon" onClick={() => setConfirm(l)} title="Delete">
                            <FiTrash2 style={{ color: 'var(--danger)' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        title="Apply for Leave"
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onApply}>
          {isAdmin && (
            <div className="form-group">
              <label className="form-label">Employee</label>
              <select
                className="form-select"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              >
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Leave Type</label>
            <select
              className="form-select"
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
            >
              {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-control"
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-control"
                value={form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Briefly explain the reason for your leave"
            />
          </div>
          <div className="text-sm text-muted">
            Total days: <strong>{daysBetween(form.fromDate, form.toDate)}</strong>
          </div>
          <div className="modal-footer" style={{ padding: 0, borderTop: 'none', marginTop: 16 }}>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirm}
        title="Delete Leave Request"
        onClose={() => setConfirm(null)}
        footer={
          <>
            <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={onDelete}>Delete</button>
          </>
        }
      >
        Are you sure you want to delete this leave request?
      </Modal>
    </div>
  );
};

export default Leaves;
