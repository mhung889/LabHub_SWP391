import axiosInstance from "./axiosInstance";

const majorApi = {
  getAll: () => axiosInstance.get("/majors"),
};

export default majorApi;
