import api from './api.js';

export const departmentService = {
  list: () => api.get('/departments').then((r) => r.data),
  create: (payload) => api.post('/departments', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/departments/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/departments/${id}`).then((r) => r.data),
};
