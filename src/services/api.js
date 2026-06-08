import axios from 'axios';

// Resolve the API base URL with a smart fallback chain:
//   1. VITE_API_URL    – explicit override (recommended for prod)
//   2. Production host – on a deployed build, assume the API is served
//                        from the same origin (single-service deploys
//                        like Render where Express also serves /dist).
//   3. LAN hostname    – when accessing the dev server from another device
//                        on the same Wi-Fi (phone -> http://192.168.x.x:3000),
//                        call the API on the same host with port 5000.
//   4. localhost:5000  – default when running `npm start` on your PC.
const resolveBaseURL = () => {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname, origin } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal) {
      // Same-origin in production builds (single-service deployments).
      if (import.meta.env.PROD) return origin;
      // Dev mode being viewed from another device on the LAN.
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
