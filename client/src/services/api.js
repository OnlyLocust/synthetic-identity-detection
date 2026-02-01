import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const status = error.response.status;

            if (status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Auth removed, no redirect to login
                // if (window.location.pathname !== '/login') {
                //     window.location.href = '/login';
                // }
            }

            const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
            error.message = message;
        } else if (error.request) {
            error.message = 'Network error. Please check your connection.';
        } else {
            error.message = error.message || 'An unexpected error occurred';
        }

        return Promise.reject(error);
    }
);

export default api;
