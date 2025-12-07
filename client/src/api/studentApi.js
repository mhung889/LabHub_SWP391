import axiosInstance from "./axiosInstance";

const studentApi = {
  getAll: () => axiosInstance.get("/students"),
  getById: (id) => axiosInstance.get(`/students/${id}`),
  create: (data) => axiosInstance.post("/students", data),
  update: (id, data) => axiosInstance.put(`/students/${id}`, data),
  delete: (id) => axiosInstance.delete(`/students/${id}`),
};

export default studentApi;
