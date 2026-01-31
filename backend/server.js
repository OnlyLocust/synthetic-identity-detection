  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const morgan = require('morgan');
  const path = require('path');

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));

  // In-memory storage for correlation analysis
  const identityStore = new Map();

  /**
   * Detection Engine - Core correlation logic
   */
  class DetectionEngine {
    constructor() {
      this.records = [];
      this.correlationMap = {
        emails: new Map(),
        phones: new Map(),
        deviceIds: new Map(),
        ips: new Map()
      };
    }

    /**
     * Calculate age from date of birth
     */
    calculateAge(dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }

    /**
     * Rule 1: Age Mismatch Detection
     * Flags if variance between calculated age from DOB and faceAge > ±5 years
     */
    detectAgeMismatch(record) {
      const reasons = [];
      const calculatedAge = this.calculateAge(record.dob);
      const ageVariance = Math.abs(calculatedAge - record.faceAge);
      
      if (ageVariance > 5) {
        reasons.push({
          rule: 'Age Mismatch',
          severity: 'high',
          details: `DOB suggests age ${calculatedAge}, but faceAge recorded ${record.faceAge} (variance: ${ageVariance} years)`,
          calculatedAge,
          reportedFaceAge: record.faceAge,
          variance: ageVariance
        });
      }
      
      return reasons;
    }

    /**
     * Rule 2: Identity Clustering Detection
     * Checks if same phone, email, or deviceId is used across multiple unique userIds
     */
    detectIdentityClustering(record, allRecords) {
      const reasons = [];
      const conflicts = {
        email: [],
        phone: [],
        deviceId: []
      };

      // Check email clustering
      const emailUsers = allRecords.filter(r => 
        r.email === record.email && r.userId !== record.userId
      );
      if (emailUsers.length > 0) {
        conflicts.email = emailUsers.map(r => r.userId);
        reasons.push({
          rule: 'Identity Clustering - Email',
          severity: 'high',
          details: `Email "${record.email}" shared across ${emailUsers.length + 1} user IDs`,
          sharedWith: conflicts.email,
          sharedValue: record.email,
          type: 'email'
        });
      }

      // Check phone clustering
      const phoneUsers = allRecords.filter(r => 
        r.phone === record.phone && r.userId !== record.userId
      );
      if (phoneUsers.length > 0) {
        conflicts.phone = phoneUsers.map(r => r.userId);
        reasons.push({
          rule: 'Identity Clustering - Phone',
          severity: 'high',
          details: `Phone "${record.phone}" shared across ${phoneUsers.length + 1} user IDs`,
          sharedWith: conflicts.phone,
          sharedValue: record.phone,
          type: 'phone'
        });
      }

      // Check deviceId clustering
      const deviceUsers = allRecords.filter(r => 
        r.deviceId === record.deviceId && r.userId !== record.userId
      );
      if (deviceUsers.length > 0) {
        conflicts.deviceId = deviceUsers.map(r => r.userId);
        reasons.push({
          rule: 'Identity Clustering - Device',
          severity: 'critical',
          details: `Device ID "${record.deviceId}" shared across ${deviceUsers.length + 1} user IDs`,
          sharedWith: conflicts.deviceId,
          sharedValue: record.deviceId,
          type: 'deviceId'
        });
      }

      return reasons;
    }

    /**
     * Rule 3: Behavioral Pattern Detection
     * Flags unnaturally low form completion time (< 2 seconds)
     */
    detectBehavioralPatterns(record) {
      const reasons = [];
      const BOT_THRESHOLD = 2000; // 2 seconds in milliseconds

      if (record.formTime < BOT_THRESHOLD) {
        const timeInSeconds = (record.formTime / 1000).toFixed(2);
        reasons.push({
          rule: 'Behavioral Pattern - Bot Suspected',
          severity: 'medium',
          details: `Form completed in ${timeInSeconds}s (threshold: 2s) - possible automation`,
          formTime: record.formTime,
          threshold: BOT_THRESHOLD,
          timeInSeconds: parseFloat(timeInSeconds)
        });
      }

      return reasons;
    }

    /**
     * Rule 4: Network Fingerprinting Detection
     * Flags when multiple disparate identities share same IP and deviceId
     */
    detectNetworkFingerprinting(record, allRecords) {
      const reasons = [];
      
      // Find records with same IP and deviceId but different userId
      const sameNetworkRecords = allRecords.filter(r => 
        r.ip === record.ip && 
        r.deviceId === record.deviceId && 
        r.userId !== record.userId
      );

      if (sameNetworkRecords.length > 0) {
        const uniqueUserIds = [...new Set(sameNetworkRecords.map(r => r.userId))];
        reasons.push({
          rule: 'Network Fingerprint Conflict',
          severity: 'critical',
          details: `IP "${record.ip}" and Device "${record.deviceId}" combination used by ${uniqueUserIds.length + 1} different identities`,
          sharedIp: record.ip,
          sharedDeviceId: record.deviceId,
          conflictingUserIds: uniqueUserIds,
          conflictCount: uniqueUserIds.length + 1
        });
      }

      return reasons;
    }

    /**
     * Calculate risk score based on detected issues
     */
    calculateRiskScore(reasons) {
      if (reasons.length === 0) return 0;

      const severityWeights = {
        low: 10,
        medium: 25,
        high: 40,
        critical: 60
      };

      let totalScore = 0;
      reasons.forEach(reason => {
        totalScore += severityWeights[reason.severity] || 10;
      });

      // Cap at 100
      return Math.min(totalScore, 100);
    }

    /**
     * Determine if record is synthetic based on risk score and rules triggered
     */
    isSynthetic(riskScore, reasons) {
      // Critical rules automatically flag as synthetic
      const hasCritical = reasons.some(r => r.severity === 'critical');
      if (hasCritical) return true;

      // High risk score flags as synthetic
      if (riskScore >= 70) return true;

      // Multiple high severity issues
      const highCount = reasons.filter(r => r.severity === 'high').length;
      if (highCount >= 2) return true;

      return false;
    }

    /**
     * Analyze a single record
     */
    analyzeRecord(record, allRecords) {
      const reasons = [
        ...this.detectAgeMismatch(record),
        ...this.detectIdentityClustering(record, allRecords),
        ...this.detectBehavioralPatterns(record),
        ...this.detectNetworkFingerprinting(record, allRecords)
      ];

      const riskScore = this.calculateRiskScore(reasons);
      const synthetic = this.isSynthetic(riskScore, reasons);

      return {
        ...record,
        analysis: {
          riskScore,
          isSynthetic: synthetic,
          reasons: reasons.map(r => ({
            rule: r.rule,
            severity: r.severity,
            details: r.details
          })),
          details: reasons,
          analyzedAt: new Date().toISOString()
        }
      };
    }

    /**
     * Analyze all records with cross-reference correlation
     */
    analyze(records) {
      this.records = records;
      return records.map(record => this.analyzeRecord(record, records));
    }
  }

  /**
   * POST /api/analyze
   * Analyzes an array of identity records for synthetic fraud indicators
   */
  app.post('/api/analyze', (req, res) => {
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
  });

  /**
   * GET /api/health
   * Health check endpoint
   */
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve static files from frontend build
  app.use(express.static(path.join(__dirname, 'dist')));

  // Serve index.html for all non-API routes (SPA support)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      error: 'Something went wrong!',
      message: err.message
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Synthetic Identity Detector API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 Analyze endpoint: http://localhost:${PORT}/api/analyze`);
  });

  module.exports = { DetectionEngine, app };
