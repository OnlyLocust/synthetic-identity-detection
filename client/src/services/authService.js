import api from './api';

export const authService = {
    async register(userData) {
        const response = await api.post('/api/auth/register', {
            email: userData.email,
            password: userData.password,
            name: userData.name,
        });

        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        return response.data;
    },

    async login(credentials) {
        const response = await api.post('/api/auth/login', {
            email: credentials.email,
            password: credentials.password,
        });

        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        return response.data;
    },

    async getCurrentUser() {
        const response = await api.get('/api/auth/me');
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getStoredUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    },
};

export default authService;
