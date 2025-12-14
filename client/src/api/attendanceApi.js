// src/api/attendanceApi.js
import axiosInstance from "./axiosInstance";

const attendanceApi = {
    checkFaceStatus: () => axiosInstance.get("/attendance/check-face"),

    registerFace: (imageBase64) =>
        axiosInstance.post("/attendance/register-face", { imageBase64 }),

    checkin: (imageBase64) =>
        axiosInstance.post("/attendance/checkin", { imageBase64 }),

    checkout: (imageBase64) =>
        axiosInstance.post("/attendance/checkout", { imageBase64 })
};

export default attendanceApi;
