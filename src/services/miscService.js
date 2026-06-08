import api from './api.js';

export const performanceService = {
  list: () => api.get('/performance').then((r) => r.data),
};

export const activityService = {
  list: () => api.get('/activities?_sort=time&_order=desc').then((r) => r.data),
  create: (payload) => api.post('/activities', payload).then((r) => r.data),
};

export const notificationService = {
  list: () => api.get('/notifications?_sort=time&_order=desc').then((r) => r.data),
  markAllRead: async () => {
    const all = await api.get('/notifications').then((r) => r.data);
    await Promise.all(
      all.filter((n) => !n.read).map((n) => api.patch(`/notifications/${n.id}`, { read: true }))
    );
    return true;
  },
};
