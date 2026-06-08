import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchDepartments = createAsyncThunk(
  'departments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/departments');
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addDepartment = createAsyncThunk(
  'departments/add',
  async (dept, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/departments', dept);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/update',
  async ({ id, ...changes }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/departments/${id}`, changes);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/departments/${id}`);
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
};

const departmentSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDepartments.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchDepartments.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(addDepartment.fulfilled, (s, a) => { s.list.push(a.payload); })
      .addCase(updateDepartment.fulfilled, (s, a) => {
        const idx = s.list.findIndex((d) => d.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      })
      .addCase(deleteDepartment.fulfilled, (s, a) => {
        s.list = s.list.filter((d) => d.id !== a.payload);
      });
  },
});

export default departmentSlice.reducer;
