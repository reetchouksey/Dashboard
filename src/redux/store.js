import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import employeeReducer from './slices/employeeSlice.js';
import attendanceReducer from './slices/attendanceSlice.js';
import leaveReducer from './slices/leaveSlice.js';
import departmentReducer from './slices/departmentSlice.js';
import uiReducer from './slices/uiSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeeReducer,
    attendance: attendanceReducer,
    leaves: leaveReducer,
    departments: departmentReducer,
    ui: uiReducer,
  },
});
