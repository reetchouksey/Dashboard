// Maps a domain status string to an appropriately-styled badge.
const map = {
  Active: 'success',
  Inactive: 'muted',
  'On Leave': 'warning',
  Present: 'success',
  Absent: 'danger',
  Leave: 'warning',
  Approved: 'success',
  Pending: 'warning',
  Rejected: 'danger',
};

const StatusBadge = ({ status }) => {
  const variant = map[status] || 'info';
  return <span className={`badge badge-${variant}`}>{status}</span>;
};

export default StatusBadge;
