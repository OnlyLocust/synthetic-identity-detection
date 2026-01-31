const DetectionEngine = require('../services/detectionEngine');

const analyzeRecords = (req, res) => {
    try {
        const { records } = req.body;

        // Validation
        if (!records || !Array.isArray(records)) {
            return res.status(400).json({
                error: 'Invalid request format. Expected { records: [...] }'
            });
        }

        if (records.length === 0) {
            return res.status(400).json({
                error: 'No records provided for analysis'
            });
        }

        // Validate each record has required fields
        const requiredFields = ['name', 'dob', 'email', 'phone', 'faceAge', 'deviceId', 'ip', 'formTime', 'userId'];
        const invalidRecords = [];

        records.forEach((record, index) => {
            const missingFields = requiredFields.filter(field => !(field in record));
            if (missingFields.length > 0) {
                invalidRecords.push({ index, missingFields });
            }
        });

        if (invalidRecords.length > 0) {
            return res.status(400).json({
                error: 'Some records are missing required fields',
                invalidRecords
            });
        }

        // Run detection engine
        const engine = new DetectionEngine();
        const results = engine.analyze(records);

        // Generate summary
        const summary = {
            totalRecords: records.length,
            syntheticCount: results.filter(r => r.analysis.isSynthetic).length,
            cleanCount: results.filter(r => !r.analysis.isSynthetic).length,
            averageRiskScore: Math.round(
                results.reduce((sum, r) => sum + r.analysis.riskScore, 0) / results.length
            ),
            rulesTriggered: {}
        };

        // Count rule occurrences
        results.forEach(record => {
            record.analysis.reasons.forEach(reason => {
                const ruleName = reason.rule.split(' - ')[0];
                summary.rulesTriggered[ruleName] = (summary.rulesTriggered[ruleName] || 0) + 1;
            });
        });

        res.json({
            success: true,
            summary,
            results
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Internal server error during analysis',
            message: error.message
        });
    }
};

const healthCheck = (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
};

module.exports = {
    analyzeRecords,
    healthCheck
};
