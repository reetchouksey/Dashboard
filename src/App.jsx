import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes.jsx';
import ToastHost from './components/common/ToastHost.jsx';

const App = () => {
  const theme = useSelector((s) => s.ui.theme);

  // Apply the active theme to <html> so CSS variables flip globally.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <AppRoutes />
      <ToastHost />
    </>
  );
};

export default App;
