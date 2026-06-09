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
    const status = err?.response?.status;
    let message = err?.response?.data?.message;
    let code = 'UNKNOWN';

    if (!err.response) {
      // No response at all — backend is offline / unreachable / CORS-blocked
      // or the request was a 404 from a static host that has no API.
      code = 'BACKEND_UNREACHABLE';
      message = `Cannot reach the API at ${baseURL}.`;
    } else if (status === 404) {
      // 404 specifically on auth / users routes from a deployed frontend
      // means we hit the static host instead of a real backend.
      code = 'BACKEND_NOT_DEPLOYED';
      message = 'No backend service responded at this URL.';
    } else if (status === 401) {
      code = 'UNAUTHORIZED';
      message = message || 'Invalid email or password';
    } else if (status === 403) {
      code = 'FORBIDDEN';
      message = message || 'You do not have permission to do that';
    } else if (status >= 500) {
      code = 'SERVER_ERROR';
      message = message || 'Server error – please try again';
    }

    if (!message) message = err?.message || 'Unexpected error';

    const errorObj = new Error(message);
    errorObj.code = code;
    errorObj.status = status;
    errorObj.baseURL = baseURL;
    return Promise.reject(errorObj);
  }
);

export { baseURL };

export default api;
