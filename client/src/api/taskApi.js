import axiosInstance from "./axiosInstance";

const taskApi = {
  getTasks(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    return axiosInstance.get(`/tasks${queryString ? `?${queryString}` : ''}`);
  },

  getTaskById(id) {
    return axiosInstance.get(`/tasks/${id}`);
  },

  createTask(data) {
    return axiosInstance.post("/tasks", data);
  },

  updateTask(id, data) {
    return axiosInstance.patch(`/tasks/${id}`, data);
  },

  assignTask(id, data) {
    return axiosInstance.post(`/tasks/${id}/assign`, data);
  },

  getAssignedStudents(id) {
    return axiosInstance.get(`/tasks/${id}/students`);
  },

  deleteTask(id) {
    return axiosInstance.delete(`/tasks/${id}`);
  },

  // Student APIs
  getMyTasks(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    return axiosInstance.get(`/tasks/student/my-tasks${queryString ? `?${queryString}` : ''}`);
  },

  getMyTaskById(id) {
    return axiosInstance.get(`/tasks/student/my-tasks/${id}`);
  },

  updateMyTaskProgress(id, data) {
    return axiosInstance.patch(`/tasks/student/my-tasks/${id}/progress`, data);
  },

  createMyTask(data) {
    return axiosInstance.post("/tasks/student/my-tasks", data);
  },
};

export default taskApi;

