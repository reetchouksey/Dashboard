// One-shot helper: dumps every table from database.db into a readable
// JSON file at the project root so you can open it in Cursor/Notepad.
//
// Usage:  npm run db:view

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'database.db');
const OUT_PATH = path.join(__dirname, '..', 'database-data.json');

if (!fs.existsSync(DB_PATH)) {
  console.error('No database.db found. Start the server once with `npm run server` first.');
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  .all()
  .map((r) => r.name);

const dump = {};
tables.forEach((t) => {
  dump[t] = db.prepare(`SELECT * FROM ${t}`).all();
});

fs.writeFileSync(OUT_PATH, JSON.stringify(dump, null, 2), 'utf-8');

console.log('\n  All tables exported to:');
console.log('  ' + OUT_PATH + '\n');

Object.entries(dump).forEach(([name, rows]) => {
  console.log(`  • ${name.padEnd(15)} → ${rows.length} row(s)`);
});
console.log('\n  Open `database-data.json` in Cursor to see every saved record.\n');
