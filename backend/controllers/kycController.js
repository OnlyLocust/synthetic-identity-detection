const { v4: uuidv4 } = require('uuid');
const detectionController = require('./detectionController');
const { applications } = require('../data/store'); // Use shared store

// Start a new KYC application
const startApplication = (req, res) => {
    const applicationId = uuidv4();
    applications[applicationId] = {
        id: applicationId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        personalInfo: null,
        behaviorData: null,
        documents: [],
        biometric: null,
        result: null
    };
    res.json({ applicationId });
};

// ... (existing submit/upload methods) ...

const submitPersonalInfo = (req, res) => {
    const { id } = req.params;
    const { personalInfo, behaviorData } = req.body;

    // If app doesn't exist (because we generated ID on client), create it now
    if (!applications[id]) {
        applications[id] = {
            id,
            status: 'pending',
            createdAt: new Date().toISOString(),
            personalInfo: null,
            behaviorData: null,
            documents: [],
            biometric: null,
            result: null
        };
    }

    applications[id].personalInfo = personalInfo;
    applications[id].behaviorData = behaviorData;
    applications[id].status = 'processing_info';

    res.json({ success: true, message: 'Personal info received', applicationId: id });
};

const uploadDocument = (req, res) => {
    const { id } = req.params;
    if (!applications[id]) {
        return res.status(404).json({ error: 'Application not found' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = {
        id: uuidv4(),
        filename: req.file.filename,
        path: req.file.path,
        uploadedAt: new Date().toISOString()
    };

    applications[id].documents.push(document);
    res.json({ success: true, documentId: document.id });
};

const submitBiometric = (req, res) => {
    const { id } = req.params;
    const { faceImage, livenessResult } = req.body;

    if (!applications[id]) {
        return res.status(404).json({ error: 'Application not found' });
    }

    applications[id].biometric = {
        faceImage: 'captured',
        livenessResult,
        timestamp: new Date().toISOString()
    };

    // Trigger Final Analysis!
    const app = applications[id];

    const record = {
        ...app.personalInfo,
        faceAge: livenessResult.visualAge || 25,
        formTime: 5000
    };

    const mockReq = {
        body: {
            record,
            behavior: app.behaviorData || { events: [] },
            biometric: livenessResult
        }
    };

    const mockRes = {
        json: (data) => {
            applications[id].result = data;
            // determine final status
            if (data.breakdown.isSynthetic || data.compositeScore > 70) {
                applications[id].status = 'rejected';
            } else if (data.compositeScore > 40) {
                applications[id].status = 'review';
            } else {
                applications[id].status = 'approved';
            }
        },
        status: (code) => ({ json: (err) => console.error("Analysis Error", err) })
    };

    try {
        detectionController.unifiedAnalysis(mockReq, mockRes);
        res.json({ success: true, status: applications[id].status });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Analysis failed" });
    }
};

const getStatus = (req, res) => {
    const { id } = req.params;
    const app = applications[id];
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json({ status: app.status });
};

const getResult = (req, res) => {
    const { id } = req.params;
    const app = applications[id];
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json(app.result || { status: 'pending' });
};

const getApplications = (req, res) => {
    const list = Object.values(applications).map(a => ({
        id: a.id,
        name: a.personalInfo?.name || 'Unknown',
        status: a.status,
        date: a.createdAt,
        riskScore: a.result?.compositeScore || 0
    })).reverse(); // Newest first
    res.json(list);
};

const getApplicationById = (req, res) => {
    const { id } = req.params;
    const app = applications[id];
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json(app);
};

const deleteApplication = (req, res) => {
    const { id } = req.params;
    if (applications[id]) {
        delete applications[id];
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
};

module.exports = {
    startApplication,
    submitPersonalInfo,
    uploadDocument,
    submitBiometric,
    getStatus,
    getResult,
    getApplications,
    getApplicationById,
    deleteApplication
};
