import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchAttendance = createAsyncThunk(
  'attendance/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/attendance?_sort=date&_order=desc');
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markAttendance = createAsyncThunk(
  'attendance/mark',
  async (record, { rejectWithValue }) => {
    try {
      // If a record already exists for this employee+date, patch it. Otherwise create.
      const existing = await api.get(
        `/attendance?employeeId=${record.employeeId}&date=${record.date}`
      );
      if (existing.data.length > 0) {
        const { data } = await api.patch(`/attendance/${existing.data[0].id}`, record);
        return { updated: true, data };
      }
      const { data } = await api.post('/attendance', record);
      return { updated: false, data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const todayISO = () => new Date().toISOString().slice(0, 10);

const initialState = {
  list: [],
  loading: false,
  error: null,
  filterDate: todayISO(),
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setFilterDate: (state, action) => { state.filterDate = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAttendance.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchAttendance.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(markAttendance.fulfilled, (s, a) => {
        if (a.payload.updated) {
          const idx = s.list.findIndex((r) => r.id === a.payload.data.id);
          if (idx !== -1) s.list[idx] = a.payload.data;
        } else {
          s.list.unshift(a.payload.data);
        }
      });
  },
});

export const { setFilterDate } = attendanceSlice.actions;
export default attendanceSlice.reducer;
