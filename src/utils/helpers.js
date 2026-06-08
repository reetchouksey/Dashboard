// Format an ISO date (yyyy-mm-dd) into a human-friendly label.
export const formatDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
  });
};

export const formatDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
};

// Relative time helper for activity feeds and notifications.
export const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(iso);
};

// Number of inclusive days between two ISO date strings.
export const daysBetween = (from, to) => {
  if (!from || !to) return 0;
  const diff = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(1, Math.round(diff / 86400000) + 1);
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

// Convert an array of plain objects into a CSV string and trigger a download.
export const exportToCSV = (rows, filename = 'export.csv') => {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Generate a sequential employee ID like EMP013 from existing employees.
export const generateEmployeeId = (employees = []) => {
  let max = 0;
  employees.forEach((e) => {
    const num = parseInt((e.employeeId || '').replace(/\D/g, ''), 10);
    if (!Number.isNaN(num) && num > max) max = num;
  });
  return `EMP${String(max + 1).padStart(3, '0')}`;
};

export const initials = (name = '') =>
  name.trim().split(/\s+/).map((s) => s[0]?.toUpperCase()).slice(0, 2).join('');
