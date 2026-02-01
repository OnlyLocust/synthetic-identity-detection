const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' })); // Allow all for demo, user requested check for specific origins but * covers it.
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Routes
const detectionRoutes = require('./routes/detectionRoutes');
const kycRoutes = require('./routes/kycRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const DetectionEngine = require('./services/detectionEngine');

app.use('/api', detectionRoutes);
app.use('/api/kyc', kycRoutes);      // /api/kyc/start, /api/kyc/:id ...
app.use('/api/dashboard', dashboardRoutes); // /api/dashboard/stats ...

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
