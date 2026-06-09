import { useSelector } from 'react-redux';

// Convenience hook for any component to read the current authenticated user.
export const useAuth = () => {
  const auth = useSelector((s) => s.auth);
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.user?.role === 'admin',
    loading: auth.loading,
    error: auth.error,
    errorCode: auth.errorCode,
  };
};
