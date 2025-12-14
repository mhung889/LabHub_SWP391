import axiosInstance from './axiosInstance';

const leaveRequestApi = {
  // POST /leave-requests
  // data: { lab, leaveType, startDate, endDate, reason }
  create: (data) => axiosInstance.post('/leave-requests', data),

  // GET /leave-requests  (mentor only)
  getAll: (params) => axiosInstance.get('/leave-requests', { params }),

  // get all request my student
  getMine: (params) => axiosInstance.get('/leave-requests/mine', { params }),

  // GET /leave-requests/:id  (mentor, student)
  getById: (id) => axiosInstance.get(`/leave-requests/${id}`),

  // PATCH /leave-requests/:id/cancel  (student)
  cancel: (id) => axiosInstance.patch(`/leave-requests/${id}/cancel`),

  // PATCH /leave-requests/:id/approve  (mentor)
  approve: (id) => axiosInstance.patch(`/leave-requests/${id}/approve`),

  // PATCH /leave-requests/:id/reject  (mentor)
  // data: { note }
  reject: (id, data) =>
    axiosInstance.patch(`/leave-requests/${id}/reject`, data),
};

export default leaveRequestApi;
