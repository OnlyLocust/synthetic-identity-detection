"""
Configuration settings for OCR Pipeline
"""

# OCR Engine Settings
OCR_CONFIG = {
    'lang': 'en',
    'use_angle_cls': True,  # Auto-correct text orientation
    'det_db_thresh': 0.3,   # Lower = detect thinner fonts/watermarks
    'rec_batch_num': 6,     # Batch size for recognition
    'use_gpu': False,       # Set to True if GPU available
    'min_confidence': 0.5   # Minimum confidence threshold
}

# Preprocessing Settings
PREPROCESSING_CONFIG = {
    'target_width': 800,    # Target width for resizing
    'auto_align': True,     # Auto-detect and align documents
    'enhance': True,        # Apply image enhancement
    'adaptive_threshold': {
        'block_size': 11,   # Size of pixel neighborhood
        'C': 2              # Constant subtracted from mean
    }
}

# ID Validation Patterns
ID_PATTERNS = {
    'passport': r'[A-Z][0-9]{7}',           # Standard passport
    'aadhaar': r'\d{4}\s?\d{4}\s?\d{4}',    # Indian Aadhaar
    'pan': r'[A-Z]{5}[0-9]{4}[A-Z]',        # Indian PAN
    'license': r'[A-Z]{2}[0-9]{13}',        # Driver's license
    'generic_id': r'[A-Z0-9]{8,12}'         # Generic ID
}

# Medical Report Keywords (WHO Guidelines)
MEDICAL_KEYWORDS = {
    'fetal_measurements': [
        'BPD', 'Biparietal Diameter',
        'HC', 'Head Circumference',
        'FL', 'Femur Length',
        'AC', 'Abdominal Circumference',
        'CRL', 'Crown-Rump Length',
        'EFW', 'Estimated Fetal Weight'
    ],
    'gestational': [
        'GA', 'Gestational Age',
        'EDD', 'Expected Delivery Date',
        'LMP', 'Last Menstrual Period'
    ],
    'general': [
        'Ultrasound', 'Sonography', 'USG',
        'Fetus', 'Fetal', 'Pregnancy',
        'Trimester', 'Weeks', 'Antenatal'
    ]
}

# Validation Thresholds
VALIDATION_CONFIG = {
    'min_medical_keywords': 3,      # Minimum keywords to classify as medical
    'min_measurements': 2,          # Minimum measurements for valid medical report
    'id_confidence_threshold': 0.7, # Minimum confidence for ID extraction
    'medical_confidence_threshold': 0.6
}

# Output Settings
OUTPUT_CONFIG = {
    'save_preprocessed': True,
    'save_visualization': True,
    'save_json': True,
    'default_output_dir': './output'
}

# Logging Settings
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'date_format': '%Y-%m-%d %H:%M:%S'
}
