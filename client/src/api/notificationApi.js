import axios from './axiosInstance';

export const getStudentNotifications = (params) =>
  axios.get('/notifications/student', { params });

export const markNotificationRead = (id) =>
  axios.put(`/notifications/${id}/read`);

export const getNotifications = (params) =>
  axios.get('/notifications', { params });

export const createNotification = (data) =>
  axios.post('/notifications', data);

export const updateNotification = (id, data) =>
  axios.put(`/notifications/${id}`, data);

export const deleteNotification = (id) =>
  axios.delete(`/notifications/${id}`);

export default {
  getStudentNotifications,
  markNotificationRead,
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
};
