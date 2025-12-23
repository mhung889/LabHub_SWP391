// Import axios instance đã được cấu hình sẵn (có baseURL, interceptors, etc.)
import axiosInstance from "./axiosInstance";

// Object chứa các hàm API liên quan đến task
const taskApi = {
  // =====================================
  // MENTOR APIs - Quản lý task của mentor
  // =====================================

  /**
   * Hàm lấy danh sách task của mentor với phân trang
   * @param {Object} params - Object chứa các tham số: page, limit
   * @returns {Promise} - Promise trả về response từ API
   */
  getTasks(params = {}) {
    // Tạo URLSearchParams để xây dựng query string
    const queryParams = new URLSearchParams();
    // Thêm số trang vào query nếu có
    if (params.page) queryParams.append('page', params.page);
    // Thêm số lượng mỗi trang vào query nếu có
    if (params.limit) queryParams.append('limit', params.limit);
    
    // Chuyển đổi queryParams sang string
    const queryString = queryParams.toString();
    // Gọi API GET với query string (nếu có)
    return axiosInstance.get(`/tasks${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Hàm lấy thông tin task theo ID (mentor)
   * @param {string} id - ID của task
   * @returns {Promise} - Promise trả về response từ API
   */
  getTaskById(id) {
    // Gọi API GET để lấy thông tin task theo ID
    return axiosInstance.get(`/tasks/${id}`);
  },

  /**
   * Hàm tạo task mới (mentor)
   * @param {Object} data - Dữ liệu task (taskTitle, description, startDate, dueDate, priority, complexity, status, studentId)
   * @returns {Promise} - Promise trả về response từ API
   */
  createTask(data) {
    // Gọi API POST để tạo task mới
    return axiosInstance.post("/tasks", data);
  },

  /**
   * Hàm cập nhật task (mentor)
   * @param {string} id - ID của task
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise} - Promise trả về response từ API
   */
  updateTask(id, data) {
    // Gọi API PATCH để cập nhật task
    return axiosInstance.patch(`/tasks/${id}`, data);
  },

  /**
   * Hàm gán task cho student (mentor)
   * @param {string} id - ID của task
   * @param {Object} data - Object chứa studentId
   * @returns {Promise} - Promise trả về response từ API
   */
  assignTask(id, data) {
    // Gọi API POST để gán task cho student
    return axiosInstance.post(`/tasks/${id}/assign`, data);
  },

  /**
   * Hàm lấy danh sách student có thể gán cho task (mentor)
   * @param {string} id - ID của task
   * @returns {Promise} - Promise trả về response từ API
   */
  getAssignedStudents(id) {
    // Gọi API GET để lấy danh sách student
    return axiosInstance.get(`/tasks/${id}/students`);
  },

  /**
   * Hàm xóa task (mentor)
   * @param {string} id - ID của task
   * @returns {Promise} - Promise trả về response từ API
   */
  deleteTask(id) {
    // Gọi API DELETE để xóa task
    return axiosInstance.delete(`/tasks/${id}`);
  },

  // =====================================
  // STUDENT APIs - Quản lý task của student
  // =====================================

  /**
   * Hàm lấy danh sách task của student với phân trang
   * @param {Object} params - Object chứa các tham số: page, limit
   * @returns {Promise} - Promise trả về response từ API
   */
  getMyTasks(params = {}) {
    // Tạo URLSearchParams để xây dựng query string
    const queryParams = new URLSearchParams();
    // Thêm số trang vào query nếu có
    if (params.page) queryParams.append('page', params.page);
    // Thêm số lượng mỗi trang vào query nếu có
    if (params.limit) queryParams.append('limit', params.limit);
    
    // Chuyển đổi queryParams sang string
    const queryString = queryParams.toString();
    // Gọi API GET với query string (nếu có)
    return axiosInstance.get(`/tasks/student/my-tasks${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Hàm lấy thông tin task theo ID (student)
   * @param {string} id - ID của task
   * @returns {Promise} - Promise trả về response từ API
   */
  getMyTaskById(id) {
    // Gọi API GET để lấy thông tin task theo ID
    return axiosInstance.get(`/tasks/student/my-tasks/${id}`);
  },

  /**
   * Hàm cập nhật tiến độ task của student (status và note)
   * @param {string} id - ID của task
   * @param {Object} data - Object chứa status và note
   * @returns {Promise} - Promise trả về response từ API
   */
  updateMyTaskProgress(id, data) {
    // Gọi API PATCH để cập nhật tiến độ task
    return axiosInstance.patch(`/tasks/student/my-tasks/${id}/progress`, data);
  },

  /**
   * Hàm tạo task mới của student
   * @param {Object} data - Dữ liệu task (taskTitle, description, startDate, dueDate, priority, complexity, status)
   * @returns {Promise} - Promise trả về response từ API
   */
  createMyTask(data) {
    // Gọi API POST để tạo task mới
    return axiosInstance.post("/tasks/student/my-tasks", data);
  },
};

// Export default để các component khác có thể import
export default taskApi;

