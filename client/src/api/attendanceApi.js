// src/api/attendanceApi.js
import axiosInstance from "./axiosInstance";

const attendanceApi = {
  // =========================
  // CHECK FACE STATUS
  // =========================
  checkFaceStatus: () =>
    axiosInstance.get("/attendance/check-face"),

  // =========================
  // REGISTER FACE
  // =========================
  registerFace: (imageBase64) =>
    axiosInstance.post("/attendance/register-face", {
      imageBase64,
    }),

  // =========================
  // CHECK-IN / CHECK-OUT
  // =========================
  checkin: ({ imageBase64, method = "face" }) =>
    axiosInstance.post("/attendance/checkin", {
      imageBase64,
      method,
    }),

  checkout: ({ imageBase64, method = "face" }) =>
    axiosInstance.post("/attendance/checkout", {
      imageBase64,
      method,
    }),
};

export default attendanceApi;
