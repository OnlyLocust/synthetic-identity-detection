const express = require('express');
const router = express.Router();
const detectionController = require('../controllers/detectionController');

router.post('/analyze', detectionController.analyzeRecords);
router.get('/health', detectionController.healthCheck);

module.exports = router;
