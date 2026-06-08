import api from './api.js';

export const attendanceService = {
  list: (params = '') => api.get(`/attendance${params}`).then((r) => r.data),
  byEmployee: (id) => api.get(`/attendance?employeeId=${id}`).then((r) => r.data),
  byDate: (date) => api.get(`/attendance?date=${date}`).then((r) => r.data),
  create: (payload) => api.post('/attendance', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/attendance/${id}`, payload).then((r) => r.data),
};
