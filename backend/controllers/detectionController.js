const DetectionEngine = require('../services/detectionEngine');

const legitimateUsers = require('../data/legitimateUsers.json');

const analyzeRecords = (req, res) => {
    try {
        const { records, record } = req.body;

        // Handle single record analysis
        if (record) {
            // Validate required fields
            const requiredFields = ['name', 'dob', 'email', 'phone', 'faceAge', 'deviceId', 'ip', 'formTime', 'userId'];
            const missingFields = requiredFields.filter(field => !(field in record));

            if (missingFields.length > 0) {
                return res.status(400).json({
                    error: 'Record is missing required fields',
                    missingFields
                });
            }

            const engine = new DetectionEngine();
            // Analyze against legitimate users
            const result = engine.analyzeSingle(record, legitimateUsers);
            const results = [result];

            const summary = {
                totalRecords: 1,
                syntheticCount: result.analysis.isSynthetic ? 1 : 0,
                cleanCount: result.analysis.isSynthetic ? 0 : 1,
                averageRiskScore: result.analysis.riskScore,
                rulesTriggered: {}
            };

            result.analysis.reasons.forEach(reason => {
                const ruleName = reason.rule.split(' - ')[0];
                summary.rulesTriggered[ruleName] = (summary.rulesTriggered[ruleName] || 0) + 1;
            });

            return res.json({
                success: true,
                summary,
                results
            });
        }

        // Validation for array of records
        if (!records || !Array.isArray(records)) {
            return res.status(400).json({
                error: 'Invalid request format. Expected { records: [...] } or { record: {...} }'
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

const unifiedAnalysis = (req, res) => {
    try {
        const { record, behavior, biometric } = req.body;

        // 1. Core Identity Detection
        const engine = new DetectionEngine();

        // Ensure record has defaults for fields not in form
        const fullRecord = {
            ...record,
            ip: record.ip || "127.0.0.1",
            formTime: behavior ? 5000 : record.formTime // mock or use behavior
        };

        const identityResult = engine.analyzeSingle(fullRecord, legitimateUsers);
        const identityScore = identityResult.analysis.riskScore;

        const behaviorService = require('../services/behaviorService');

        // ... (in unifiedAnalysis) ...

        // 2. Behavioral Scoring (Advanced)
        let behaviorScore = 0;
        let behaviorDetails = {};

        if (behavior && behavior.events) {
            const behaviorAnalysis = behaviorService.analyzeBehavior(behavior.events);
            behaviorScore = parseFloat(behaviorAnalysis.behaviorScore) * 100; // normalized 0-100? No, service returns 1.0 = good.
            // Service returns: behaviorScore (1.0 = good, 0.0 = bad), syntheticRiskScore (0-100, high = bad)

            // We want Risk Score (0-100, High = Bad)
            behaviorScore = behaviorAnalysis.syntheticRiskScore;
            behaviorDetails = behaviorAnalysis.details;
        } else if (behavior) {
            // Fallback for limited data (e.g. just velocity)
            if (behavior.velocity === 0 || behavior.velocity > 5) behaviorScore += 30;
            if (behavior.avgKeystroke < 50) behaviorScore += 40;
        }

        // 3. Age Verification
        // Logic: Compare DOB year with Visual Age
        let ageMatchScore = 0;
        let isSyntheticAge = false;

        if (record.dob && biometric && biometric.visualAge) {
            const birthYear = new Date(record.dob).getFullYear();
            const currentYear = new Date().getFullYear();
            const statedAge = currentYear - birthYear;
            const diff = Math.abs(statedAge - biometric.visualAge);

            // Standard variance map
            if (diff > 10) ageMatchScore = 80;
            else if (diff > 5) ageMatchScore = 40;
            else if (diff > 3) ageMatchScore = 15;

            if (diff > 7) isSyntheticAge = true;
        }

        // Aggregation: Unified Trust Score — Identity (40%), Behavior (30%), Biometrics (30%)
        let compositeScore = Math.round(
            (identityScore * 0.4) + (behaviorScore * 0.3) + (ageMatchScore * 0.3)
        );

        // Override if critical flags in identity
        if (identityResult.analysis.isSynthetic || isSyntheticAge) {
            // Boost score if logic suggests synthetic
            compositeScore = Math.max(compositeScore, 75);
        }

        const breakdown = {
            identityScore,
            behaviorScore,
            ageMatchScore,
            isSynthetic: compositeScore > 70
        };

        res.json({
            success: true,
            compositeScore,
            breakdown,
            details: identityResult.analysis.reasons // Identity reasons
        });

    } catch (error) {
        console.error("Unified Analysis Error", error);
        res.status(500).json({ error: "Aggregator Failed" });
    }
};

module.exports = {
    analyzeRecords,
    healthCheck,
    unifiedAnalysis
};
