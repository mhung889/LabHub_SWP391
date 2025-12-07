import axiosInstance from "./axiosInstance";

const authApi = {
  login(data) {
    return axiosInstance.post("/auth/login", data);
  },

  refresh(data) {
    return axiosInstance.post("/auth/refresh-token", data);
  },

  getUserProfile(userId) {
    return axiosInstance.get(`/auth/${userId}`);
  },

  updateUserProfile(userId, data) {
    // Check if data is FormData (for file upload)
    if (data instanceof FormData) {
      return axiosInstance.patch(`/auth/${userId}`, data);
    }
    return axiosInstance.patch(`/auth/${userId}`, data);
  },

  changePassword(userId, data) {
    return axiosInstance.patch(`/auth/${userId}/change-password`, data);
  },
};

export default authApi;
