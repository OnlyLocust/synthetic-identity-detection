export const API_BASE_URL = 'http://localhost:3001';
export const ML_SERVICE_URL = 'http://localhost:5001';

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    NEW_APPLICATION: '/application/new',
    APPLICATIONS: '/applications',
    APPLICATION_DETAIL: '/application/:id',
};

export const KYC_STAGES = [
    { id: 1, name: 'Data Intake', key: 'data_intake' },
    { id: 2, name: 'Document Forgery Detection', key: 'document_forgery' },
    { id: 3, name: 'Biometric Verification', key: 'biometric_verification' },
    { id: 4, name: 'Behavioral Analysis', key: 'behavioral_analysis' },
    { id: 5, name: 'Data Correlation', key: 'data_correlation' },
    { id: 6, name: 'ML Risk Scoring', key: 'ml_risk_scoring' },
    { id: 7, name: 'Decision Engine', key: 'decision_engine' },
];

export const STAGE_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    PASS: 'pass',
    FAIL: 'fail',
};

export const APPLICATION_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REVIEW: 'review',
};

export const RISK_LEVELS = {
    LOW: { min: 0, max: 30, label: 'Low Risk', color: '#10B981' },
    MEDIUM: { min: 31, max: 50, label: 'Medium Risk', color: '#F59E0B' },
    HIGH: { min: 51, max: 70, label: 'High Risk', color: '#F97316' },
    CRITICAL: { min: 71, max: 100, label: 'Critical Risk', color: '#EF4444' },
};

export const BLINK_CONFIG = {
    EAR_THRESHOLD: 0.20,
    CONSECUTIVE_FRAMES: 2,
    MIN_BLINK_DURATION: 150,
    MAX_BLINK_DURATION: 400,
    DETECTION_INTERVAL: 100,
    TIMEOUT_SECONDS: 15,
    MIN_BLINKS: 2,
    MAX_BLINKS: 4,
};

export const BEHAVIOR_CONFIG = {
    MOUSE_TRACK_INTERVAL: 100,
    MAX_MOUSE_EVENTS: 1000,
    MAX_SCROLL_EVENTS: 500,
    MAX_KEYSTROKE_EVENTS: 500,
};

export const DOCUMENT_CONFIG = {
    MAX_SIZE_MB: 10,
    MAX_SIZE_BYTES: 10 * 1024 * 1024,
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
    ACCEPTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],
};

export const STATUS_COLORS = {
    approved: { bg: 'bg-success-100', text: 'text-success-800', badge: 'badge-success' },
    rejected: { bg: 'bg-danger-100', text: 'text-danger-800', badge: 'badge-danger' },
    review: { bg: 'bg-warning-100', text: 'text-warning-800', badge: 'badge-warning' },
    processing: { bg: 'bg-primary-100', text: 'text-primary-800', badge: 'badge-primary' },
    pending: { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'badge-gray' },
};

export const COUNTRIES = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'India', 'Japan', 'Brazil', 'Mexico', 'Other'
];

export const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
];
