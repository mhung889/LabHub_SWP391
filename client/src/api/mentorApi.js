import axiosInstance from "./axiosInstance";

const mentorApi = {
  getMentors(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    return axiosInstance.get(`/mentors${queryString ? `?${queryString}` : ''}`);
  },

  getMentorById(id) {
    return axiosInstance.get(`/mentors/${id}`);
  },

  createMentor(data) {
    if (data instanceof FormData) {
      return axiosInstance.post("/mentors", data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return axiosInstance.post("/mentors", data);
  },

  updateMentor(id, data) {
    if (data instanceof FormData) {
      return axiosInstance.patch(`/mentors/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return axiosInstance.patch(`/mentors/${id}`, data);
  },

  searchMentors(keyword) {
    return axiosInstance.get(`/mentors/search?keyword=${encodeURIComponent(keyword)}`);
  },

  // Mentor (logged-in) attendance
  getAttendance(params = {}) {
    return axiosInstance.get("/mentors/attendance", {
      params,
    });
  },
  updateCheckInTime(attendanceId, data) {
    return axiosInstance.patch(
      `/mentors/attendance/${attendanceId}/checkin-time`,
      data
    );
  },
  
  updateCheckOutTime(attendanceId, data) {
    return axiosInstance.patch(
      `/mentors/attendance/${attendanceId}/checkout-time`,
      data
    );
  },  
};

export default mentorApi;

