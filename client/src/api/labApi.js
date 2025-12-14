import axiosInstance from "./axiosInstance";

const labApi = {

   // GET /labs?page=&limit=&search=&major=
  getAll: (params) => axiosInstance.get("/labs", { params }),

  // GET /labs/simple?status= (for dropdown selection)
  getLabs: (params) => axiosInstance.get("/labs/simple", { params }),

  // GET /labs/:id
  getById: (id) => axiosInstance.get(`/labs/${id}`),

  // POST /labs
  create: (data) => axiosInstance.post("/labs", data),

  // PUT /labs/:id
  update: (id, data) => axiosInstance.put(`/labs/${id}`, data),

  // DELETE /labs/:id
  delete: (id) => axiosInstance.delete(`/labs/${id}`),

  // GET /labs/:id/students
  getStudentsByLabId: (id) => axiosInstance.get(`/labs/${id}/students`),

  // POST /labs/:id/student
  addStudentToLab: (id, data) =>
    axiosInstance.post(`/labs/${id}/student`, data),

  // DELETE /labs/:id/remove-student
  removeStudentFromLab: (id, data) =>
    axiosInstance.delete(`/labs/${id}/remove-student`, { data }),

  updateAttendanceRule: (labId, payload) =>
    axiosInstance.put(`/labs/${labId}/attendance-rule`, payload),

};

export default labApi;
