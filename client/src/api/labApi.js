import axiosInstance from "./axiosInstance"

const labApi = {
  getLabs() {
    return axiosInstance.get("/labs")
  },
  getLabDetail(id) {
    return axiosInstance.get(`/labs/${id}`)
  },
  createLab(data) {
    return axiosInstance.post("/labs", data)
  },
  updateLab(id, data) {
    return axiosInstance.put(`/labs/${id}`, data)
  },
  deleteLab(id) {
    return axiosInstance.delete(`/labs/${id}`)
  }
}

export default labApi
