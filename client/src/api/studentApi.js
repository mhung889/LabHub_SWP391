import axiosInstance from './axiosInstance';

const studentApi = {
  getAll: () => axiosInstance.get('/students'),
  getById: (id) => axiosInstance.get(`/students/${id}`),
  create: (data) => axiosInstance.post('/students', data),
  update: (id, data) => axiosInstance.put(`/students/${id}`, data),
  delete: (id) => axiosInstance.delete(`/students/${id}`),
  getMyStudents: () => axiosInstance.get('/students/my'), // list student of mentor manage
  // Thêm tính năng lấy lịch sử điểm danh của chính sinh viên đang đăng nhập
  getAttendanceHistory: () => axiosInstance.get('/students/history'),
};

export default studentApi;
