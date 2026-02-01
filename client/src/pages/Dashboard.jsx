import { useState, useEffect } from 'react';
import { Loading } from '../components/Common';
import StatsCards from '../components/Dashboard/StatsCards';
import RiskDistributionChart from '../components/Dashboard/RiskDistributionChart';
import RecentApplications from '../components/Dashboard/RecentApplications';
import RiskGauge from '../components/Dashboard/RiskGauge';
import dashboardService from '../services/dashboardService';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [riskDistribution, setRiskDistribution] = useState(null);
    const [recentApplications, setRecentApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, riskRes, recentRes] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getRiskDistribution(),
                dashboardService.getRecentApplications(),
            ]);

            setStats(statsRes.stats || statsRes);
            setRiskDistribution(riskRes.distribution || riskRes);
            setRecentApplications(recentRes.applications || recentRes || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            toast.error('Failed to load dashboard data');
            // Set demo data on error
            setStats({ total: 156, approved: 89, rejected: 23, pendingReview: 44 });
            setRiskDistribution({ low: 45, medium: 35, high: 15, critical: 5 });
            setRecentApplications([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Loading dashboard..." />;
    }

    const avgRiskScore = stats ? Math.round(
        ((stats.approved || 0) * 20 + (stats.pendingReview || 0) * 50 + (stats.rejected || 0) * 80) /
        Math.max(stats.total || 1, 1)
    ) : 35;

    const handleDeleteApplication = (id) => {
        setRecentApplications(recentApplications.filter(app => app.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RiskDistributionChart data={riskDistribution} />
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Risk Score</h3>
                    <div className="flex justify-center">
                        <RiskGauge score={avgRiskScore} size="lg" />
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Based on {stats?.total || 0} applications
                    </p>
                </div>
            </div>

            {/* Recent Applications */}
            <RecentApplications applications={recentApplications} onDelete={handleDeleteApplication} />
        </div>
    );
};

export default Dashboard;
