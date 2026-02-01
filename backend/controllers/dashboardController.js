const { applications } = require('../data/store');

const getDashboardStats = (req, res) => {
    const allApps = Object.values(applications);
    const total = allApps.length;

    const pending = allApps.filter(a => ['pending', 'processing_info', 'review'].includes(a.status)).length;
    const rejected = allApps.filter(a => a.status === 'rejected').length;
    const approved = allApps.filter(a => a.status === 'approved').length;

    // Calculate avg risk score of processed apps
    const processed = allApps.filter(a => a.result);
    const avgRisk = processed.length > 0
        ? Math.round(processed.reduce((sum, a) => sum + (a.result.compositeScore || 0), 0) / processed.length)
        : 0;

    res.json({
        totalVerifications: total,
        pendingReviews: pending,
        autoRejected: rejected,
        avgRiskScore: avgRisk,
        verificationRate: total > 0 ? Math.round((approved / total) * 100) : 0
    });
};

const getRiskDistribution = (req, res) => {
    const allApps = Object.values(applications).filter(a => a.result);

    const distribution = [
        { name: 'Low Risk', value: 0, color: '#10B981' },
        { name: 'Medium Risk', value: 0, color: '#F59E0B' },
        { name: 'High Risk', value: 0, color: '#F97316' },
        { name: 'Critical', value: 0, color: '#EF4444' }
    ];

    allApps.forEach(a => {
        const score = a.result.compositeScore || 0;
        if (score <= 30) distribution[0].value++;
        else if (score <= 50) distribution[1].value++;
        else if (score <= 70) distribution[2].value++;
        else distribution[3].value++;
    });

    res.json(distribution);
};

const getRecentActivity = (req, res) => {
    const recent = Object.values(applications)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(a => ({
            id: a.id,
            user: a.personalInfo?.name || 'New User',
            action: a.status === 'pending' ? 'Application Started' : `Verification ${a.status}`,
            timestamp: a.createdAt,
            status: a.status,
            riskScore: a.result?.compositeScore || 0
        }));

    res.json(recent);
};

module.exports = {
    getDashboardStats,
    getRiskDistribution,
    getRecentActivity
};
