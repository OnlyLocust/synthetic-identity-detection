const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const multer = require('multer');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// All routes here are prefixed with /api/kyc
router.post('/start', kycController.startApplication);

// :id routes
router.post('/:id/personal-info', kycController.submitPersonalInfo);
router.post('/:id/document', upload.single('document'), kycController.uploadDocument);
router.post('/:id/biometric', kycController.submitBiometric);
router.get('/:id/status', kycController.getStatus);
router.get('/:id/result', kycController.getResult);
router.get('/applications', kycController.getApplications);
router.get('/:id', kycController.getApplicationById);
router.delete('/:id', kycController.deleteApplication);

module.exports = router;
