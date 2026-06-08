// Express + SQLite backend for the Employee Management Dashboard.
// All routes mirror the json-server shape so the frontend works unchanged,
// plus dedicated /auth/login and /auth/register endpoints.

const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ems-dev-secret-change-in-prod';

app.use(cors());
app.use(express.json());

// ---- Helpers ----
const sign = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const stripPw = (u) => {
  if (!u) return u;
  const { password, ...rest } = u;
  return rest;
};

const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(); // allow public reads; pages enforce auth client-side
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (_) { /* ignore invalid token */ }
  next();
};
app.use(auth);

// Generic CRUD generator: creates GET (list + single), POST, PATCH, DELETE
// for a given table. Mirrors json-server behaviour the frontend expects.
const crudRouter = (table, options = {}) => {
  const router = express.Router();
  const { sortBy } = options;

  router.get('/', (req, res) => {
    const params = req.query;
    const where = [];
    const values = [];

    Object.entries(params).forEach(([k, v]) => {
      if (k.startsWith('_')) return;
      where.push(`${k} = ?`);
      values.push(v);
    });

    let sql = `SELECT * FROM ${table}`;
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;

    const sortCol = params._sort || sortBy;
    const sortOrder = (params._order || 'asc').toUpperCase();
    if (sortCol) sql += ` ORDER BY ${sortCol} ${sortOrder === 'DESC' ? 'DESC' : 'ASC'}`;

    try {
      const rows = db.prepare(sql).all(...values);
      // Coerce SQLite `read` integer back to boolean for notifications.
      if (table === 'notifications') {
        rows.forEach((r) => { r.read = !!r.read; });
      }
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  router.get('/:id', (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    if (table === 'notifications') row.read = !!row.read;
    res.json(row);
  });

  router.post('/', (req, res) => {
    const body = { ...req.body };
    delete body.id;
    if (table === 'notifications' && typeof body.read === 'boolean') body.read = body.read ? 1 : 0;
    const cols = Object.keys(body);
    if (cols.length === 0) return res.status(400).json({ message: 'Empty body' });
    const placeholders = cols.map(() => '?').join(',');
    const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`;
    try {
      const info = db.prepare(sql).run(...cols.map((c) => body[c]));
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
      if (table === 'notifications') row.read = !!row.read;
      res.status(201).json(row);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  const updateHandler = (req, res) => {
    const body = { ...req.body };
    delete body.id;
    if (table === 'notifications' && typeof body.read === 'boolean') body.read = body.read ? 1 : 0;
    const cols = Object.keys(body);
    if (cols.length === 0) return res.status(400).json({ message: 'Empty body' });
    const set = cols.map((c) => `${c} = ?`).join(', ');
    const sql = `UPDATE ${table} SET ${set} WHERE id = ?`;
    try {
      const info = db.prepare(sql).run(...cols.map((c) => body[c]), req.params.id);
      if (info.changes === 0) return res.status(404).json({ message: 'Not found' });
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
      if (table === 'notifications') row.read = !!row.read;
      res.json(row);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };
  router.patch('/:id', updateHandler);
  router.put('/:id', updateHandler);

  router.delete('/:id', (req, res) => {
    const info = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ message: 'Not found' });
    res.json({});
  });

  return router;
};

// ---- Auth routes ----
app.post('/auth/register', (req, res) => {
  const { name, email, password, role = 'employee' } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (password.length < 4) {
    return res.status(400).json({ message: 'Password must be at least 4 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;
  const info = db
    .prepare('INSERT INTO users (name, email, password, role, avatar) VALUES (?,?,?,?,?)')
    .run(name, email, hash, role, avatar);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);

  // Audit trail
  db.prepare('INSERT INTO activities (user, action, target, time) VALUES (?,?,?,?)')
    .run('System', 'New user registered', name, new Date().toISOString());

  const token = sign(user);
  res.status(201).json({ user: stripPw(user), token });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

  // Audit login
  db.prepare('INSERT INTO activities (user, action, target, time) VALUES (?,?,?,?)')
    .run(user.name, 'logged in', 'Self', new Date().toISOString());

  const token = sign(user);
  res.json({ user: stripPw(user), token });
});

app.get('/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json(stripPw(user));
});

// ---- /users (admin convenience) ----
app.get('/users', (req, res) => {
  const rows = db.prepare('SELECT id, name, email, role, avatar, createdAt FROM users').all();
  res.json(rows);
});

// ---- Mounted CRUD routes ----
app.use('/employees',     crudRouter('employees'));
app.use('/departments',   crudRouter('departments'));
app.use('/attendance',    crudRouter('attendance', { sortBy: 'date' }));
app.use('/leaves',        crudRouter('leaves',     { sortBy: 'appliedOn' }));
app.use('/performance',   crudRouter('performance'));
app.use('/activities',    crudRouter('activities', { sortBy: 'time' }));
app.use('/notifications', crudRouter('notifications', { sortBy: 'time' }));

// ---- API health endpoint ----
app.get('/api/health', (req, res) => {
  res.json({
    name: 'EMS Dashboard API',
    status: 'running',
    db: 'sqlite (better-sqlite3)',
    endpoints: [
      'POST /auth/register', 'POST /auth/login', 'GET /auth/me',
      '/users', '/employees', '/departments', '/attendance',
      '/leaves', '/performance', '/activities', '/notifications',
    ],
  });
});

// ---- Production: also serve the built React SPA from /dist ----
// In dev, this directory doesn't exist so we fall through to the API-only 404.
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  console.log('[server] Serving frontend from', DIST_DIR);
  app.use(express.static(DIST_DIR));

  // SPA fallback — any unknown route returns index.html so React Router takes over.
  // We exclude /api, /auth, and the data resource paths so unknown API calls still 404.
  app.get(/^(?!\/(api|auth|users|employees|departments|attendance|leaves|performance|activities|notifications)).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ message: `Not found: ${req.method} ${req.path}` }));

// Show every reachable URL so the developer can pick the right one
// when accessing the API from a phone or tablet on the same network.
const printNetworkAddresses = () => {
  const lines = [`http://localhost:${PORT}`];
  const ifaces = os.networkInterfaces();
  Object.values(ifaces).forEach((entries) => {
    entries.forEach((entry) => {
      if (entry.family === 'IPv4' && !entry.internal) {
        lines.push(`http://${entry.address}:${PORT}`);
      }
    });
  });
  console.log('\n  EMS API server is running on:');
  lines.forEach((l) => console.log('    →', l));
  console.log('\n  SQLite database: server/database.db');
  console.log('  For phones: use the LAN URL above and set VITE_API_URL accordingly.\n');
};

// Bind to 0.0.0.0 so it's reachable from other devices on the same Wi-Fi.
app.listen(PORT, '0.0.0.0', printNetworkAddresses);
