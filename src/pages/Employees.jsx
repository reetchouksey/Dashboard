import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiDownload, FiRefreshCw,
} from 'react-icons/fi';
import {
  fetchEmployees, addEmployee, updateEmployee, deleteEmployee,
  setFilter, setPage, setPageSize,
} from '../redux/slices/employeeSlice.js';
import { fetchDepartments } from '../redux/slices/departmentSlice.js';
import Modal from '../components/common/Modal.jsx';
import { Loading, EmptyState, ErrorState } from '../components/common/States.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import Pagination from '../components/common/Pagination.jsx';
import EmployeeForm from '../components/employees/EmployeeForm.jsx';
import { exportToCSV, formatDate } from '../utils/helpers.js';
import { EMPLOYEE_STATUSES } from '../utils/constants.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../hooks/useAuth.js';

const Employees = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { isAdmin } = useAuth();
  const { list, loading, error, filters, page, pageSize } = useSelector((s) => s.employees);
  const departments = useSelector((s) => s.departments.list);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
  }, [dispatch]);

  // Client-side search/filter pipeline.
  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return list.filter((e) => {
      if (filters.department !== 'All' && e.department !== filters.department) return false;
      if (filters.status !== 'All' && e.status !== filters.status) return false;
      if (!term) return true;
      return (
        e.name.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        e.employeeId.toLowerCase().includes(term) ||
        e.designation.toLowerCase().includes(term)
      );
    });
  }, [list, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onAdd = () => { setEditing(null); setOpenForm(true); };
  const onEdit = (emp) => { setEditing(emp); setOpenForm(true); };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await dispatch(updateEmployee({ ...data, id: editing.id })).unwrap();
        toast.success('Employee updated');
      } else {
        await dispatch(addEmployee(data)).unwrap();
        toast.success('Employee added');
      }
      setOpenForm(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    try {
      await dispatch(deleteEmployee(confirm.id)).unwrap();
      toast.success('Employee deleted');
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const onExport = () => {
    if (filtered.length === 0) { toast.warning('Nothing to export'); return; }
    const rows = filtered.map((e) => ({
      'Employee ID': e.employeeId,
      Name: e.name,
      Email: e.email,
      Phone: e.phone,
      Department: e.department,
      Designation: e.designation,
      'Joining Date': e.joiningDate,
      Status: e.status,
      Salary: e.salary,
    }));
    exportToCSV(rows, `employees-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Exported to CSV');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <div className="page-subtitle">Manage your workforce, roles and statuses.</div>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => dispatch(fetchEmployees())}>
            <FiRefreshCw /> Refresh
          </button>
          <button className="btn" onClick={onExport}>
            <FiDownload /> Export CSV
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={onAdd}>
              <FiPlus /> Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="table-filters">
            <div className="search-box" style={{ width: 280 }}>
              <FiSearch />
              <input
                placeholder="Search by name, email, ID…"
                value={filters.search}
                onChange={(e) => dispatch(setFilter({ search: e.target.value }))}
              />
            </div>
            <select
              className="form-select"
              value={filters.department}
              onChange={(e) => dispatch(setFilter({ department: e.target.value }))}
            >
              <option value="All">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => dispatch(setFilter({ status: e.target.value }))}
            >
              <option value="All">All Statuses</option>
              {EMPLOYEE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="text-xs text-muted">
            {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading && list.length === 0 ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={() => dispatch(fetchEmployees())} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No employees match your filters"
            message="Try adjusting your search or filter criteria."
          />
        ) : (
          <>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Joining Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((e) => (
                    <tr key={e.id}>
                      <td><span className="badge badge-info">{e.employeeId}</span></td>
                      <td>
                        <div className="name-cell">
                          <img src={e.avatar} alt={e.name} />
                          <div className="text">
                            <div className="name">{e.name}</div>
                            <div className="sub">{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{e.department}</td>
                      <td>{e.designation}</td>
                      <td>{formatDate(e.joiningDate)}</td>
                      <td><StatusBadge status={e.status} /></td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-ghost btn-icon"
                            title="View"
                            onClick={() => setViewing(e)}
                          >
                            <FiEye />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                className="btn btn-ghost btn-icon"
                                title="Edit"
                                onClick={() => onEdit(e)}
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                className="btn btn-ghost btn-icon"
                                title="Delete"
                                onClick={() => setConfirm(e)}
                              >
                                <FiTrash2 style={{ color: 'var(--danger)' }} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={pageSize}
              onPageChange={(p) => dispatch(setPage(p))}
              onPageSizeChange={(s) => dispatch(setPageSize(s))}
            />
          </>
        )}
      </div>

      <Modal
        open={openForm}
        title={editing ? 'Edit Employee' : 'Add Employee'}
        onClose={() => setOpenForm(false)}
        size="lg"
      >
        <EmployeeForm
          initial={editing}
          submitting={submitting}
          onSubmit={onSubmit}
          onCancel={() => setOpenForm(false)}
        />
      </Modal>

      <Modal
        open={!!confirm}
        title="Delete Employee"
        onClose={() => setConfirm(null)}
        footer={
          <>
            <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={onDelete}>Delete</button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>{confirm?.name}</strong>?
          This action cannot be undone.
        </p>
      </Modal>

      <Modal
        open={!!viewing}
        title="Employee Details"
        onClose={() => setViewing(null)}
        size="lg"
        footer={
          <>
            <Link
              to={`/employees/${viewing?.id}`}
              className="btn btn-primary"
              onClick={() => setViewing(null)}
            >
              Open Full Profile
            </Link>
          </>
        }
      >
        {viewing && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={viewing.avatar}
                alt={viewing.name}
                style={{ width: 80, height: 80, borderRadius: '50%' }}
              />
              <div>
                <div className="font-bold" style={{ fontSize: 18 }}>{viewing.name}</div>
                <div className="text-muted text-sm">{viewing.designation} • {viewing.department}</div>
                <StatusBadge status={viewing.status} />
              </div>
            </div>
            <div className="grid-2">
              <div className="info-row"><span>Employee ID</span><span>{viewing.employeeId}</span></div>
              <div className="info-row"><span>Email</span><span>{viewing.email}</span></div>
              <div className="info-row"><span>Phone</span><span>{viewing.phone}</span></div>
              <div className="info-row"><span>Joining Date</span><span>{formatDate(viewing.joiningDate)}</span></div>
              <div className="info-row"><span>Salary</span><span>${viewing.salary?.toLocaleString?.() || viewing.salary}</span></div>
              <div className="info-row"><span>Address</span><span>{viewing.address || '-'}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Employees;
