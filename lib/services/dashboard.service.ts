export const dashboardService = {
    async fetchDashboardStats() {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch dashboard data');
        }

        return data;
    },
};
