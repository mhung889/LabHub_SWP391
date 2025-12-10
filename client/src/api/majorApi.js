import axiosInstance from "./axiosInstance";

const majorApi = {
  // GET /majors - Get all majors (public)
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    return axiosInstance.get(`/majors${queryString ? `?${queryString}` : ''}`);
  },

  // GET /majors/search?keyword= - Search majors
  search: (keyword) => {
    return axiosInstance.get(`/majors/search?keyword=${encodeURIComponent(keyword)}`);
  },

  // GET /majors/:id - Get major by ID (admin)
  getById: (id) => {
    return axiosInstance.get(`/majors/${id}`);
  },

  // POST /majors - Create major (admin)
  create: (data) => {
    return axiosInstance.post("/majors", data);
  },

  // PATCH /majors/:id - Update major (admin)
  update: (id, data) => {
    return axiosInstance.patch(`/majors/${id}`, data);
  },

  // DELETE /majors/:id - Delete major (admin)
  delete: (id) => {
    return axiosInstance.delete(`/majors/${id}`);
  },
};

export default majorApi;
