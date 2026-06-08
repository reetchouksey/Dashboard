import api from './api.js';

export const leaveService = {
  list: () => api.get('/leaves').then((r) => r.data),
  create: (payload) => api.post('/leaves', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/leaves/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/leaves/${id}`).then((r) => r.data),
};
