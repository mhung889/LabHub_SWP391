import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor để thêm token vào header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token hết hạn hoặc không hợp lệ
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            // Chỉ redirect nếu không phải trang login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        // Format error message từ backend
        if (error.response?.data?.message) {
            error.message = error.response.data.message;
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: async (email, password) => {
        const response = await api.post('/api/users/login', { email, password });
        return response.data;
    },
    refreshToken: async (refreshToken) => {
        const response = await api.post('/api/users/refresh-token', { refreshToken });
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/api/users/profile');
        return response.data;
    },
    updateProfile: async (data) => {
        const response = await api.put('/api/users/profile', data);
        return response.data;
    },
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post('/api/users/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    logout: () => {
        // Xóa tất cả thông tin authentication khỏi localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },
};

export default api;

