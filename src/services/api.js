import axios from 'axios';

// Resolve the API base URL with a smart fallback chain:
//   1. VITE_API_URL  – explicit override (used in production builds)
//   2. window host   – when visiting from another device on the LAN
//                      (e.g. phone hits http://192.168.1.10:3000, so we
//                       call http://192.168.1.10:5000 automatically)
//   3. localhost     – default during plain `npm start` on your PC
const resolveBaseURL = () => {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:5000`;
    }
  }
  return 'http://localhost:5000';
};

const baseURL = resolveBaseURL();

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('ems_user');
    if (raw) {
      const { token } = JSON.parse(raw);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) { /* ignore */ }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    let message = err?.response?.data?.message;
    if (!message) {
      if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
        message =
          `Cannot reach API at ${baseURL}. ` +
          `Make sure the backend is running and reachable from this device.`;
      } else {
        message = err?.message || 'Unexpected error';
      }
    }
    return Promise.reject(new Error(message));
  }
);

export { baseURL };

export default api;
