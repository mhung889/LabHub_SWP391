// Import axios instance đã được cấu hình sẵn (có baseURL, interceptors, etc.)
import axiosInstance from "./axiosInstance";

// Object chứa các hàm API liên quan đến chuyên ngành (major)
const majorApi = {
  /**
   * Hàm lấy danh sách tất cả chuyên ngành với phân trang và tìm kiếm (public)
   * @param {Object} params - Object chứa các tham số: page, limit, search
   * @returns {Promise} - Promise trả về response từ API
   */
  getAll: (params = {}) => {
    // Tạo URLSearchParams để xây dựng query string
    const queryParams = new URLSearchParams();
    // Thêm số trang vào query nếu có
    if (params.page) queryParams.append('page', params.page);
    // Thêm số lượng mỗi trang vào query nếu có
    if (params.limit) queryParams.append('limit', params.limit);
    // Thêm từ khóa tìm kiếm vào query nếu có
    if (params.search) queryParams.append('search', params.search);
    
    // Chuyển đổi queryParams sang string
    const queryString = queryParams.toString();
    // Gọi API GET với query string (nếu có)
    return axiosInstance.get(`/majors${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Hàm tìm kiếm chuyên ngành theo từ khóa (public)
   * @param {string} keyword - Từ khóa tìm kiếm
   * @returns {Promise} - Promise trả về response từ API
   */
  search: (keyword) => {
    // Gọi API GET với từ khóa đã được encode
    return axiosInstance.get(`/majors/search?keyword=${encodeURIComponent(keyword)}`);
  },

  /**
   * Hàm lấy thông tin chuyên ngành theo ID (admin)
   * @param {string} id - ID của chuyên ngành
   * @returns {Promise} - Promise trả về response từ API
   */
  getById: (id) => {
    // Gọi API GET để lấy thông tin chuyên ngành theo ID
    return axiosInstance.get(`/majors/${id}`);
  },

  /**
   * Hàm tạo chuyên ngành mới (admin)
   * @param {Object} data - Dữ liệu chuyên ngành (name, code, description)
   * @returns {Promise} - Promise trả về response từ API
   */
  create: (data) => {
    // Gọi API POST để tạo chuyên ngành mới
    return axiosInstance.post("/majors", data);
  },

  /**
   * Hàm cập nhật thông tin chuyên ngành (admin)
   * @param {string} id - ID của chuyên ngành
   * @param {Object} data - Dữ liệu cập nhật (name, code, description)
   * @returns {Promise} - Promise trả về response từ API
   */
  update: (id, data) => {
    // Gọi API PATCH để cập nhật chuyên ngành
    return axiosInstance.patch(`/majors/${id}`, data);
  },

  /**
   * Hàm xóa chuyên ngành (admin)
   * @param {string} id - ID của chuyên ngành
   * @returns {Promise} - Promise trả về response từ API
   */
  delete: (id) => {
    // Gọi API DELETE để xóa chuyên ngành
    return axiosInstance.delete(`/majors/${id}`);
  },
};

// Export default để các component khác có thể import
export default majorApi;
