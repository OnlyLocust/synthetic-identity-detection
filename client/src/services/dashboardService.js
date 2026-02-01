import api from './api';

export const dashboardService = {
    async getStats() {
        const response = await api.get('/api/dashboard/stats');
        return response.data;
    },

    async getRecentApplications() {
        const response = await api.get('/api/dashboard/recent');
        return response.data;
    },

    async getRiskDistribution() {
        const response = await api.get('/api/dashboard/risk-distribution');
        return response.data;
    },
};

export default dashboardService;
