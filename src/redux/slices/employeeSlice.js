import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchEmployees = createAsyncThunk(
  'employees/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/employees');
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addEmployee = createAsyncThunk(
  'employees/add',
  async (employee, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/employees', employee);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/update',
  async ({ id, ...changes }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/employees/${id}`, changes);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  'employees/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/employees/${id}`);
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
  filters: { search: '', department: 'All', status: 'All' },
  page: 1,
  pageSize: 8,
};

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
    },
    setPage: (state, action) => { state.page = action.payload; },
    setPageSize: (state, action) => { state.pageSize = action.payload; state.page = 1; },
    resetFilters: (state) => {
      state.filters = { search: '', department: 'All', status: 'All' };
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false; state.list = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      .addCase(addEmployee.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const idx = state.list.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.list = state.list.filter((e) => e.id !== action.payload);
      });
  },
});

export const { setFilter, setPage, setPageSize, resetFilters } = employeeSlice.actions;
export default employeeSlice.reducer;
