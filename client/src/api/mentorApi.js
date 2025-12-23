// Import axios instance đã được cấu hình sẵn (có baseURL, interceptors, etc.)
import axiosInstance from "./axiosInstance";

// Object chứa các hàm API liên quan đến mentor
const mentorApi = {
  /**
   * Hàm lấy danh sách mentor với phân trang, tìm kiếm và lọc
   * @param {Object} params - Object chứa các tham số: search, page, limit, status
   * @returns {Promise} - Promise trả về response từ API
   */
  getMentors(params = {}) {
    // Tạo URLSearchParams để xây dựng query string
    const queryParams = new URLSearchParams();
    // Thêm từ khóa tìm kiếm vào query nếu có
    if (params.search) queryParams.append('search', params.search);
    // Thêm số trang vào query nếu có
    if (params.page) queryParams.append('page', params.page);
    // Thêm số lượng mỗi trang vào query nếu có
    if (params.limit) queryParams.append('limit', params.limit);
    // Thêm trạng thái vào query nếu có
    if (params.status) queryParams.append('status', params.status);
    
    // Chuyển đổi queryParams sang string
    const queryString = queryParams.toString();
    // Gọi API GET với query string (nếu có)
    return axiosInstance.get(`/mentors${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Hàm lấy thông tin mentor theo ID
   * @param {string} id - ID của mentor
   * @returns {Promise} - Promise trả về response từ API
   */
  getMentorById(id) {
    // Gọi API GET để lấy thông tin mentor theo ID
    return axiosInstance.get(`/mentors/${id}`);
  },

  /**
   * Hàm tạo mentor mới
   * @param {Object|FormData} data - Dữ liệu mentor (có thể là object hoặc FormData nếu có file)
   * @returns {Promise} - Promise trả về response từ API
   */
  createMentor(data) {
    // Nếu data là FormData (có file ảnh), set Content-Type là multipart/form-data
    if (data instanceof FormData) {
      return axiosInstance.post("/mentors", data, {
        headers: {
          'Content-Type': 'multipart/form-data',  // Header cho upload file
        },
      });
    }
    // Nếu không có file, gọi API POST bình thường
    return axiosInstance.post("/mentors", data);
  },

  /**
   * Hàm cập nhật thông tin mentor
   * @param {string} id - ID của mentor
   * @param {Object|FormData} data - Dữ liệu cập nhật (có thể là object hoặc FormData nếu có file)
   * @returns {Promise} - Promise trả về response từ API
   */
  updateMentor(id, data) {
    // Nếu data là FormData (có file ảnh), set Content-Type là multipart/form-data
    if (data instanceof FormData) {
      return axiosInstance.patch(`/mentors/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',  // Header cho upload file
        },
      });
    }
    // Nếu không có file, gọi API PATCH bình thường
    return axiosInstance.patch(`/mentors/${id}`, data);
  },

  /**
   * Hàm tìm kiếm mentor theo từ khóa
   * @param {string} keyword - Từ khóa tìm kiếm
   * @returns {Promise} - Promise trả về response từ API
   */
  searchMentors(keyword) {
    // Gọi API GET với từ khóa đã được encode
    return axiosInstance.get(`/mentors/search?keyword=${encodeURIComponent(keyword)}`);
  },

  /**
   * Hàm lấy dữ liệu điểm danh của mentor (mentor đã đăng nhập)
   * @param {Object} params - Object chứa các tham số: date, from, to, status
   * @returns {Promise} - Promise trả về response từ API
   */
  getAttendance(params = {}) {
    // Gọi API GET với params
    return axiosInstance.get("/mentors/attendance", {
      params,  // Axios tự động chuyển params thành query string
    });
  },
  
  /**
   * Hàm cập nhật thời gian check-in cho sinh viên
   * @param {string} attendanceId - ID của bản ghi điểm danh
   * @param {Object} data - Object chứa checkInTime
   * @returns {Promise} - Promise trả về response từ API
   */
  updateCheckInTime(attendanceId, data) {
    // Gọi API PATCH để cập nhật thời gian check-in
    return axiosInstance.patch(
      `/mentors/attendance/${attendanceId}/checkin-time`,
      data
    );
  },
  
  /**
   * Hàm cập nhật thời gian check-out cho sinh viên
   * @param {string} attendanceId - ID của bản ghi điểm danh
   * @param {Object} data - Object chứa checkOutTime
   * @returns {Promise} - Promise trả về response từ API
   */
  updateCheckOutTime(attendanceId, data) {
    // Gọi API PATCH để cập nhật thời gian check-out
    return axiosInstance.patch(
      `/mentors/attendance/${attendanceId}/checkout-time`,
      data
    );
  },  
};

// Export default để các component khác có thể import
export default mentorApi;

