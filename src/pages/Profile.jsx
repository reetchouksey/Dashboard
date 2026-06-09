import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { updateProfile } from '../redux/slices/authSlice.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import api from '../services/api.js';

const Profile = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });

  const onSave = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!form.name.trim()) { toast.error('Name cannot be empty'); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { toast.error('Enter a valid email'); return; }

    setSaving(true);
    try {
      // Persist the change to SQLite so it survives logouts and other browsers.
      const { data } = await api.patch(`/users/${user.id}`, form);
      dispatch(updateProfile(data));
      setEditing(false);
      toast.success('Profile saved to database');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <div className="page-subtitle">Manage your personal information.</div>
        </div>
        {!editing ? (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            <FiEdit2 /> Edit Profile
          </button>
        ) : (
          <button className="btn" onClick={() => { setEditing(false); setForm({
            name: user?.name || '', email: user?.email || '', avatar: user?.avatar || '',
          }); }}>
            <FiX /> Cancel
          </button>
        )}
      </div>

      <div className="profile-grid">
        <div className="card profile-summary">
          <img src={form.avatar || user?.avatar} alt={user?.name} />
          <div className="name">{form.name || user?.name}</div>
          <div className="role">{user?.role}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Account Information</div>
          </div>
          <div className="card-body">
            <form onSubmit={onSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={!editing}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Avatar URL</label>
                <input
                  className="form-control"
                  value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input className="form-control" value={user?.role} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Member ID</label>
                  <input className="form-control" value={user?.id} disabled />
                </div>
              </div>
              {editing && (
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <FiSave /> {saving ? 'Saving…' : 'Save Changes'}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
