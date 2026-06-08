import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../../redux/slices/uiSlice.js';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';

const iconFor = (type) => {
  switch (type) {
    case 'success': return <FiCheckCircle />;
    case 'error': return <FiAlertCircle />;
    case 'warning': return <FiAlertTriangle />;
    default: return <FiInfo />;
  }
};

const ToastHost = () => {
  const toasts = useSelector((s) => s.ui.toasts);
  const dispatch = useDispatch();
  if (!toasts.length) return null;
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span style={{ fontSize: 18 }}>{iconFor(t.type)}</span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => dispatch(removeToast(t.id))}
            aria-label="Dismiss"
          >
            <FiX />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastHost;
