import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { EMPLOYEE_STATUSES } from '../../utils/constants.js';
import { generateEmployeeId, todayISO } from '../../utils/helpers.js';

// Reusable Add / Edit form. `initial` populates fields when editing.
const EmployeeForm = ({ initial, onSubmit, onCancel, submitting }) => {
  const departments = useSelector((s) => s.departments.list);
  const employees = useSelector((s) => s.employees.list);

  const blank = {
    employeeId: generateEmployeeId(employees),
    name: '',
    email: '',
    phone: '',
    department: departments[0]?.name || '',
    designation: '',
    joiningDate: todayISO(),
    status: 'Active',
    salary: '',
    avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
    address: '',
  };

  const [form, setForm] = useState({ ...blank, ...(initial || {}) });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) setForm({ ...blank, ...initial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.department) errs.department = 'Choose a department';
    if (!form.designation.trim()) errs.designation = 'Designation is required';
    if (!form.joiningDate) errs.joiningDate = 'Joining date is required';
    return errs;
  };

  const handle = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSubmit({ ...form, salary: Number(form.salary) || 0 });
    }
  };

  return (
    <form onSubmit={handle}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Employee ID</label>
          <input className="form-control" value={form.employeeId} onChange={set('employeeId')} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={set('status')}>
            {EMPLOYEE_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-control" value={form.name} onChange={set('name')} />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input type="email" className="form-control" value={form.email} onChange={set('email')} />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-control" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="form-group">
          <label className="form-label">Department *</label>
          <select className="form-select" value={form.department} onChange={set('department')}>
            {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          {errors.department && <div className="form-error">{errors.department}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Designation *</label>
          <input className="form-control" value={form.designation} onChange={set('designation')} />
          {errors.designation && <div className="form-error">{errors.designation}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Joining Date *</label>
          <input type="date" className="form-control" value={form.joiningDate} onChange={set('joiningDate')} />
          {errors.joiningDate && <div className="form-error">{errors.joiningDate}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Salary</label>
          <input type="number" className="form-control" value={form.salary} onChange={set('salary')} />
        </div>
        <div className="form-group">
          <label className="form-label">Avatar URL</label>
          <input className="form-control" value={form.avatar} onChange={set('avatar')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Address</label>
        <textarea className="form-textarea" value={form.address} onChange={set('address')} />
      </div>

      <div className="modal-footer" style={{ padding: 0, borderTop: 'none' }}>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Update Employee' : 'Add Employee'}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
