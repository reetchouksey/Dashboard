import { useDispatch } from 'react-redux';
import { addToast, removeToast } from '../redux/slices/uiSlice.js';

// Quick API to push a toast notification with auto-dismiss.
export const useToast = () => {
  const dispatch = useDispatch();
  const push = (message, type = 'info', timeout = 3000) => {
    const action = dispatch(addToast({ message, type }));
    const id = action.payload.id;
    setTimeout(() => dispatch(removeToast(id)), timeout);
  };
  return {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error', 4000),
    info: (m) => push(m, 'info'),
    warning: (m) => push(m, 'warning'),
  };
};
