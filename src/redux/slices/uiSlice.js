import { createSlice } from '@reduxjs/toolkit';

const THEME_KEY = 'ems_theme';
const SIDEBAR_KEY = 'ems_sidebar_collapsed';

const initialState = {
  theme: localStorage.getItem(THEME_KEY) || 'light',
  sidebarCollapsed: localStorage.getItem(SIDEBAR_KEY) === 'true',
  mobileSidebarOpen: false,
  toasts: [],
};

let toastId = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_KEY, state.theme);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem(THEME_KEY, state.theme);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem(SIDEBAR_KEY, String(state.sidebarCollapsed));
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    closeMobileSidebar: (state) => { state.mobileSidebarOpen = false; },
    addToast: {
      reducer: (state, action) => { state.toasts.push(action.payload); },
      prepare: ({ message, type = 'info' }) => ({
        payload: { id: ++toastId, message, type },
      }),
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  toggleTheme, setTheme,
  toggleSidebar, toggleMobileSidebar, closeMobileSidebar,
  addToast, removeToast,
} = uiSlice.actions;

export default uiSlice.reducer;
