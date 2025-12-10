import axiosInstance from "./axiosInstance";
import { clearStorage } from "@/utils/storage";

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

  // Get current user profile (requires authentication)
  getProfile() {
    return axiosInstance.get("/auth/profile").then(res => res.data);
  },

  // Update current user profile
  updateProfile(data) {
    return axiosInstance.put("/auth/profile", data).then(res => res.data);
  },

  // Upload avatar
  uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return axiosInstance.post("/auth/profile/avatar", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
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

  logout() {
    clearStorage();
  },
};

export default authApi;
