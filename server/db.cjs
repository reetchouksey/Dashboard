// SQLite database setup with full schema + seed data.
// On first run we initialise tables and seed them from the original db.json
// so the app keeps the same default content even though it's now persisted in SQL.

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'database.db');
const isFresh = !fs.existsSync(DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---- Schema ----
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    email     TEXT NOT NULL UNIQUE,
    password  TEXT NOT NULL,
    role      TEXT NOT NULL DEFAULT 'employee',
    avatar    TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS employees (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId   TEXT,
    name         TEXT NOT NULL,
    email        TEXT,
    phone        TEXT,
    department   TEXT,
    designation  TEXT,
    joiningDate  TEXT,
    status       TEXT,
    salary       INTEGER,
    avatar       TEXT,
    address      TEXT
  );

  CREATE TABLE IF NOT EXISTS departments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    head        TEXT,
    description TEXT,
    createdAt   TEXT
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId   INTEGER NOT NULL,
    employeeName TEXT,
    date         TEXT NOT NULL,
    status       TEXT,
    checkIn      TEXT,
    checkOut     TEXT
  );

  CREATE TABLE IF NOT EXISTS leaves (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId   INTEGER NOT NULL,
    employeeName TEXT,
    leaveType    TEXT,
    fromDate     TEXT,
    toDate       TEXT,
    days         INTEGER,
    reason       TEXT,
    status       TEXT DEFAULT 'Pending',
    appliedOn    TEXT
  );

  CREATE TABLE IF NOT EXISTS performance (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId   INTEGER,
    employeeName TEXT,
    month        TEXT,
    rating       REAL,
    score        INTEGER,
    feedback     TEXT
  );

  CREATE TABLE IF NOT EXISTS activities (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    user   TEXT,
    action TEXT,
    target TEXT,
    time   TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    title   TEXT,
    message TEXT,
    type    TEXT,
    read    INTEGER DEFAULT 0,
    time    TEXT
  );
`);

// ---- Seed (only when DB file did not previously exist) ----
if (isFresh) {
  console.log('[db] First run – seeding initial data…');

  const seedPath = path.join(__dirname, '..', 'db.json');
  if (!fs.existsSync(seedPath)) {
    console.warn('[db] No db.json found, skipping seed.');
  } else {
    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

    // Hash passwords for the seeded user accounts.
    const insertUser = db.prepare(
      'INSERT INTO users (name, email, password, role, avatar) VALUES (?,?,?,?,?)'
    );
    seed.users?.forEach((u) => {
      const hash = bcrypt.hashSync(u.password, 10);
      insertUser.run(u.name, u.email, hash, u.role, u.avatar);
    });

    const insertEmp = db.prepare(`
      INSERT INTO employees (employeeId, name, email, phone, department, designation, joiningDate, status, salary, avatar, address)
      VALUES (@employeeId, @name, @email, @phone, @department, @designation, @joiningDate, @status, @salary, @avatar, @address)
    `);
    seed.employees?.forEach((e) => insertEmp.run(e));

    const insertDept = db.prepare(
      'INSERT INTO departments (name, head, description, createdAt) VALUES (@name,@head,@description,@createdAt)'
    );
    seed.departments?.forEach((d) => insertDept.run(d));

    const insertAtt = db.prepare(`
      INSERT INTO attendance (employeeId, employeeName, date, status, checkIn, checkOut)
      VALUES (@employeeId,@employeeName,@date,@status,@checkIn,@checkOut)
    `);
    seed.attendance?.forEach((a) => insertAtt.run(a));

    const insertLeave = db.prepare(`
      INSERT INTO leaves (employeeId, employeeName, leaveType, fromDate, toDate, days, reason, status, appliedOn)
      VALUES (@employeeId,@employeeName,@leaveType,@fromDate,@toDate,@days,@reason,@status,@appliedOn)
    `);
    seed.leaves?.forEach((l) => insertLeave.run(l));

    const insertPerf = db.prepare(`
      INSERT INTO performance (employeeId, employeeName, month, rating, score, feedback)
      VALUES (@employeeId,@employeeName,@month,@rating,@score,@feedback)
    `);
    seed.performance?.forEach((p) => insertPerf.run(p));

    const insertAct = db.prepare(
      'INSERT INTO activities (user, action, target, time) VALUES (@user,@action,@target,@time)'
    );
    seed.activities?.forEach((a) => insertAct.run(a));

    const insertNotif = db.prepare(
      'INSERT INTO notifications (title, message, type, read, time) VALUES (@title,@message,@type,@read,@time)'
    );
    seed.notifications?.forEach((n) =>
      insertNotif.run({ ...n, read: n.read ? 1 : 0 })
    );

    console.log('[db] Seed complete.');
  }
}

module.exports = db;
