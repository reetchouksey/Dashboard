import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchLeaves = createAsyncThunk(
  'leaves/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/leaves?_sort=appliedOn&_order=desc');
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const applyLeave = createAsyncThunk(
  'leaves/apply',
  async (leave, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/leaves', leave);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateLeaveStatus = createAsyncThunk(
  'leaves/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/leaves/${id}`, { status });
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteLeave = createAsyncThunk(
  'leaves/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/leaves/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  list: [],
  loading: false,
  error: null,
  filterStatus: 'All',
  filterType: 'All',
};

const leaveSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {
    setLeaveFilter: (state, action) => {
      Object.assign(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaves.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchLeaves.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchLeaves.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(applyLeave.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(updateLeaveStatus.fulfilled, (s, a) => {
        const idx = s.list.findIndex((l) => l.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      })
      .addCase(deleteLeave.fulfilled, (s, a) => {
        s.list = s.list.filter((l) => l.id !== a.payload);
      });
  },
});

export const { setLeaveFilter } = leaveSlice.actions;
export default leaveSlice.reducer;
