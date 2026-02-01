const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// All routes here are prefixed with /api/dashboard
router.get('/stats', dashboardController.getDashboardStats);
router.get('/risk-distribution', dashboardController.getRiskDistribution);
router.get('/recent', dashboardController.getRecentActivity);

module.exports = router;
