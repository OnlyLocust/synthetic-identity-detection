import { RISK_LEVELS, STATUS_COLORS, DOCUMENT_CONFIG } from './constants';

export const getRiskLevel = (score) => {
    if (score <= RISK_LEVELS.LOW.max) return RISK_LEVELS.LOW;
    if (score <= RISK_LEVELS.MEDIUM.max) return RISK_LEVELS.MEDIUM;
    if (score <= RISK_LEVELS.HIGH.max) return RISK_LEVELS.HIGH;
    return RISK_LEVELS.CRITICAL;
};

export const getRiskColor = (score) => {
    return getRiskLevel(score).color;
};

export const getStatusColor = (status) => {
    return STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.pending;
};

export const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFile = (file) => {
    const errors = [];

    if (!file) {
        errors.push('No file selected');
        return { valid: false, errors };
    }

    if (file.size > DOCUMENT_CONFIG.MAX_SIZE_BYTES) {
        errors.push(`File size exceeds ${DOCUMENT_CONFIG.MAX_SIZE_MB}MB limit`);
    }

    if (!DOCUMENT_CONFIG.ACCEPTED_TYPES.includes(file.type)) {
        errors.push('Invalid file type. Accepted: JPEG, PNG, PDF');
    }

    return { valid: errors.length === 0, errors };
};

export const generateRandomBlinks = () => {
    return Math.floor(Math.random() * 3) + 2; // 2-4 blinks
};

export const calculateEAR = (eye) => {
    // Eye Aspect Ratio calculation
    // eye is array of 6 landmark points
    // EAR = (|P2-P6| + |P3-P5|) / (2 * |P1-P4|)
    const p1 = eye[0];
    const p2 = eye[1];
    const p3 = eye[2];
    const p4 = eye[3];
    const p5 = eye[4];
    const p6 = eye[5];

    const vertical1 = Math.sqrt(Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2));
    const vertical2 = Math.sqrt(Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2));
    const horizontal = Math.sqrt(Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2));

    if (horizontal === 0) return 0.3; // Default open eye value

    return (vertical1 + vertical2) / (2.0 * horizontal);
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

export const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ');
};

export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const maskSSN = (ssn) => {
    if (!ssn) return '';
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length < 4) return ssn;
    return '***-**-' + cleaned.slice(-4);
};

export const formatSSN = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,2})(\d{0,4})$/);
    if (match) {
        let formatted = '';
        if (match[1]) formatted += match[1];
        if (match[2]) formatted += '-' + match[2];
        if (match[3]) formatted += '-' + match[3];
        return formatted;
    }
    return value;
};

export const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
        let formatted = '';
        if (match[1]) formatted += '(' + match[1];
        if (match[2]) formatted += ') ' + match[2];
        if (match[3]) formatted += '-' + match[3];
        return formatted;
    }
    return value;
};

export const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const calculatePercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
};
