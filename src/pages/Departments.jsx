import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import {
  fetchDepartments, addDepartment, updateDepartment, deleteDepartment,
} from '../redux/slices/departmentSlice.js';
import { fetchEmployees } from '../redux/slices/employeeSlice.js';
import Modal from '../components/common/Modal.jsx';
import { Loading, EmptyState } from '../components/common/States.jsx';
import { formatDate, todayISO } from '../utils/helpers.js';
import { useToast } from '../hooks/useToast.js';

const Departments = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { list: departments, loading } = useSelector((s) => s.departments);
  const employees = useSelector((s) => s.employees.list);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const blank = { name: '', head: '', description: '', createdAt: todayISO() };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const counts = useMemo(() => {
    const map = {};
    employees.forEach((e) => { map[e.department] = (map[e.department] || 0) + 1; });
    return map;
  }, [employees]);

  const onAdd = () => { setEditing(null); setForm(blank); setOpen(true); };
  const onEdit = (d) => { setEditing(d); setForm(d); setOpen(true); };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Department name is required'); return; }
    try {
      if (editing) {
        await dispatch(updateDepartment({ ...form, id: editing.id })).unwrap();
        toast.success('Department updated');
      } else {
        await dispatch(addDepartment(form)).unwrap();
        toast.success('Department added');
      }
      setOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const onDelete = async () => {
    if ((counts[confirm.name] || 0) > 0) {
      toast.error('Cannot delete a department that has employees');
      setConfirm(null);
      return;
    }
    try {
      await dispatch(deleteDepartment(confirm.id)).unwrap();
      toast.success('Department deleted');
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <div className="page-subtitle">Organise your teams and headcounts.</div>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          <FiPlus /> Add Department
        </button>
      </div>

      {loading && departments.length === 0 ? (
        <Loading />
      ) : departments.length === 0 ? (
        <EmptyState title="No departments yet" message="Create your first department to get started." />
      ) : (
        <div className="grid-2" style={{ gap: 16 }}>
          {departments.map((d, i) => {
            const colors = [
              'linear-gradient(135deg,#6366f1,#8b5cf6)',
              'linear-gradient(135deg,#10b981,#059669)',
              'linear-gradient(135deg,#f59e0b,#d97706)',
              'linear-gradient(135deg,#3b82f6,#1d4ed8)',
              'linear-gradient(135deg,#ef4444,#b91c1c)',
            ];
            return (
              <div key={d.id} className="card" style={{ padding: 20 }}>
                <div className="flex items-center" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                  <div className="flex items-center gap-3">
                    <div className="icon-wrap" style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: colors[i % colors.length],
                      color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800,
                    }}>{d.name[0]}</div>
                    <div>
                      <div className="font-bold" style={{ fontSize: 18 }}>{d.name}</div>
                      <div className="text-xs text-muted">Head: {d.head || '—'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-icon" onClick={() => onEdit(d)} title="Edit"><FiEdit2 /></button>
                    <button className="btn btn-ghost btn-icon" onClick={() => setConfirm(d)} title="Delete">
                      <FiTrash2 style={{ color: 'var(--danger)' }} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted" style={{ minHeight: 40 }}>{d.description || 'No description provided.'}</p>
                <div className="flex items-center" style={{ justifyContent: 'space-between', marginTop: 14 }}>
                  <span className="badge badge-info"><FiUsers /> {counts[d.name] || 0} employees</span>
                  <span className="text-xs text-muted">Created {formatDate(d.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? 'Edit Department' : 'Add Department'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Department Name *</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Engineering"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Department Head</label>
            <input
              className="form-control"
              value={form.head}
              onChange={(e) => setForm({ ...form, head: e.target.value })}
              placeholder="Manager / Lead name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="modal-footer" style={{ padding: 0, borderTop: 'none' }}>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirm}
        title="Delete Department"
        onClose={() => setConfirm(null)}
        footer={
          <>
            <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={onDelete}>Delete</button>
          </>
        }
      >
        Are you sure you want to delete <strong>{confirm?.name}</strong>?
      </Modal>
    </div>
  );
};

export default Departments;
