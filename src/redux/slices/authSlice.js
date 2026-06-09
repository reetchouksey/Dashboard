import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

const STORAGE_KEY = 'ems_user';

const loadUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persist = (user, token) => {
  const session = { ...user, token };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
};

// Authenticate against the SQL backend (/auth/login).
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      return persist(data.user, data.token);
    } catch (err) {
      return rejectWithValue({
        message: err.message || 'Login failed',
        code: err.code || 'UNKNOWN',
      });
    }
  }
);

// Create a new user account against /auth/register.
export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, email, password, role }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      return persist(data.user, data.token);
    } catch (err) {
      return rejectWithValue({
        message: err.message || 'Registration failed',
        code: err.code || 'UNKNOWN',
      });
    }
  }
);

const initialState = {
  user: loadUser(),
  isAuthenticated: !!loadUser(),
  loading: false,
  error: null,
  errorCode: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem(STORAGE_KEY);
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
    },
    clearError: (state) => { state.error = null; state.errorCode = null; },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.loading = true; state.error = null;
    };
    const handleFulfilled = (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    };
    const handleRejected = (state, action) => {
      state.loading = false;
      const payload = action.payload || {};
      state.error = typeof payload === 'string' ? payload : (payload.message || 'Authentication failed');
      state.errorCode = typeof payload === 'object' ? payload.code : undefined;
    };

    builder
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, handleFulfilled)
      .addCase(loginUser.rejected, handleRejected)
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, handleFulfilled)
      .addCase(registerUser.rejected, handleRejected);
  },
});

export const { logout, updateProfile, clearError } = authSlice.actions;
export default authSlice.reducer;
