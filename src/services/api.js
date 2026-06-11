import axios from 'axios';

// Hosted backend (Render). Used as the production fallback when the frontend
// is served from a static host like Vercel that doesn't run Express itself.
// Override at build time with VITE_API_URL when deploying the backend elsewhere.
const PRODUCTION_API_URL = 'https://ems-dashboard-khat.onrender.com';

// Resolve the API base URL with a smart fallback chain:
//   1. VITE_API_URL       – explicit override (recommended for custom deploys)
//   2. Same-origin API    – when the deployed host also runs Express
//                           (e.g. the Render single-service deploy serving /dist).
//   3. PRODUCTION_API_URL – frontend-only hosts like Vercel fall back here.
//   4. LAN hostname       – dev server viewed from another device on Wi-Fi
//                           (phone -> http://192.168.x.x:3000) calls :5000.
//   5. localhost:5000     – default when running `npm start` on your PC.
const resolveBaseURL = () => {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname, origin } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal) {
      if (import.meta.env.PROD) {
        // If the page is served from the Render backend itself, talk to it
        // same-origin. Otherwise (Vercel, custom domains, etc.) fall back
        // to the hosted Render API.
        try {
          const prodHost = new URL(PRODUCTION_API_URL).hostname;
          if (hostname === prodHost) return origin;
        } catch (_) { /* malformed PRODUCTION_API_URL – ignore */ }
        return PRODUCTION_API_URL;
      }
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
  // Render free-tier services sleep after ~15 min of inactivity and can take
  // 30–60s to wake up on the first request. Allow plenty of headroom.
  timeout: 60000,
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
