import axiosInstance from "./axiosInstance";

const evaluationApi = {
  /**
   * MENTOR: Lấy danh sách sinh viên của Lab do Mentor quản lý
   * Backend tự tìm labId dựa trên Token.
   */
  getStudentsByLab: () => {
    return axiosInstance.get("/evaluation/lab/students");
  },

  /**
   * MENTOR: Lấy thống kê chuyên cần và điểm đề xuất cho Modal
   */
  getEvaluationPreview: (labId, studentId) => {
    return axiosInstance.get(`/evaluation/preview/${labId}/${studentId}`);
  },

  /**
   * MENTOR: Gửi form đánh giá sinh viên lên server
   */
  submitEvaluation: (data) => {
    return axiosInstance.post("/evaluation", data);
  },

  /**
   * ADMIN: Lấy danh sách toàn bộ báo cáo đánh giá (có hỗ trợ lọc theo labId)
   * Hàm này sẽ khớp với route router.get('/admin/list', ...) ở Backend
   */
  getAdminEvaluations: (labId = "") => {
    const query = labId && labId !== 'all' ? `?labId=${labId}` : "";
    return axiosInstance.get(`/evaluation/admin/list${query}`);
  },

  /**
   * ADMIN: Lấy tất cả đánh giá của một Lab cụ thể (Dùng URL Params)
   */
  getAllEvaluationsByLab: (labId) => {
    return axiosInstance.get(`/evaluation/admin/lab/${labId}`);
  },
};

export default evaluationApi;