import axiosInstance from "./axiosInstance";

const evaluationApi = {
  // UC-50: Configure Evaluation Criteria (OJT)
  getEvaluationCriterias(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.includeInactive) queryParams.append('includeInactive', params.includeInactive);
    
    const queryString = queryParams.toString();
    return axiosInstance.get(`/evaluations/criterias${queryString ? `?${queryString}` : ''}`);
  },

  createEvaluationCriteria(data) {
    return axiosInstance.post("/evaluations/criterias", data);
  },

  updateEvaluationCriteria(id, data) {
    return axiosInstance.patch(`/evaluations/criterias/${id}`, data);
  },

  deleteEvaluationCriteria(id) {
    return axiosInstance.delete(`/evaluations/criterias/${id}`);
  },

  // UC-51: Student Evaluation (Mentor)
  getActiveCriterias() {
    return axiosInstance.get("/evaluations/criterias/active");
  },

  getAssignedStudents() {
    return axiosInstance.get("/evaluations/students");
  },

  createOrUpdateEvaluation(data) {
    return axiosInstance.post("/evaluations", data);
  },

  getEvaluationByStudent(studentId) {
    return axiosInstance.get(`/evaluations/student/${studentId}`);
  },

  getMentorEvaluations(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    return axiosInstance.get(`/evaluations/mentor/list${queryString ? `?${queryString}` : ''}`);
  },

  // UC-52: Submit Evaluation Report (Mentor)
  submitEvaluation(evaluationId) {
    return axiosInstance.post(`/evaluations/${evaluationId}/submit`);
  },

  // UC-53: View Evaluation Result (Student)
  getStudentEvaluation() {
    return axiosInstance.get("/evaluations/student/result");
  },

  // UC-54: Evaluation Report List (OJT)
  getEvaluationReports(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.departmentId) queryParams.append('departmentId', params.departmentId);
    
    const queryString = queryParams.toString();
    return axiosInstance.get(`/evaluations/reports${queryString ? `?${queryString}` : ''}`);
  },

  getEvaluationReportDetail(id) {
    return axiosInstance.get(`/evaluations/reports/${id}`);
  },
};

export default evaluationApi;

