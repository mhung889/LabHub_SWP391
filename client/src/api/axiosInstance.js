import axios from 'axios';
import { toast } from 'sonner';
// import {
//   getAccessToken,
//   getRefreshToken,
//   setAccessToken,
//   clearStorage,
// } from '@/utils/storage';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:9999/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gắn token vào mọi request
// axiosInstance.interceptors.request.use((config) => {
//   const token = getAccessToken()
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`
//   }
//   return config
// })

// // Xử lý lỗi / refresh token
// axiosInstance.interceptors.response.use(
//   (res) => res,
//   async (error) => {
//     const original = error.config
//     const status = error.response?.status

//     // Nếu hết hạn => refresh token
//     if (status === 401 && !original._retry) {
//       original._retry = true
//       try {
//         const rt = getRefreshToken()
//         const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken: rt })
//         const newAccess = res.data.data.accessToken

//         setAccessToken(newAccess)
//         original.headers.Authorization = `Bearer ${newAccess}`
//         return axiosInstance(original)
//       } catch {
//         toast.error("Phiên đăng nhập hết hạn.");
//         clearStorage()
//         window.location.href = "/login"
//       }
//     }

//     // Các lỗi khác → toast
//     toast.error(error.response?.data?.message || "Có lỗi xảy ra")
//     return Promise.reject(error)
//   }
// )

export default axiosInstance;
