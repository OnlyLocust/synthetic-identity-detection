"""
Entity Extraction & Validation Module
Extracts structured information from OCR text using regex patterns
and keyword matching for IDs and medical reports.
"""

import re
from typing import Dict, List, Optional, Any
from enum import Enum
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocumentType(Enum):
    """Supported document types."""
    ID_CARD = "id_card"
    PASSPORT = "passport"
    MEDICAL_REPORT = "medical_report"
    ULTRASOUND = "ultrasound"
    UNKNOWN = "unknown"


class EntityExtractor:
    """Extract and validate entities from OCR text."""
    
    # Regex patterns for different ID formats
    ID_PATTERNS = {
        'passport': r'[A-Z][0-9]{7}',  # Standard passport format
        'aadhaar': r'\d{4}\s?\d{4}\s?\d{4}',  # Indian Aadhaar
        'pan': r'[A-Z]{5}[0-9]{4}[A-Z]',  # Indian PAN card
        'license': r'[A-Z]{2}[0-9]{13}',  # Driver's license (varies by region)
        'generic_id': r'[A-Z0-9]{8,12}'  # Generic alphanumeric ID
    }
    
    # Medical report keywords (WHO Guidelines for ultrasound)
    MEDICAL_KEYWORDS = {
        'fetal_measurements': [
            'BPD', 'Biparietal Diameter',
            'HC', 'Head Circumference',
            'FL', 'Femur Length',
            'AC', 'Abdominal Circumference',
            'CRL', 'Crown-Rump Length'
        ],
        'gestational': [
            'GA', 'Gestational Age',
            'EDD', 'Expected Delivery Date',
            'LMP', 'Last Menstrual Period'
        ],
        'general': [
            'Ultrasound', 'Sonography', 'USG',
            'Fetus', 'Fetal', 'Pregnancy',
            'Trimester', 'Weeks'
        ]
    }
    
    def __init__(self):
        """Initialize the entity extractor."""
        self.compiled_patterns = {
            key: re.compile(pattern, re.IGNORECASE)
            for key, pattern in self.ID_PATTERNS.items()
        }
    
    def detect_document_type(self, text: str) -> DocumentType:
        """
        Detect the type of document based on content.
        
        Args:
            text: OCR extracted text
            
        Returns:
            DocumentType enum
        """
        text_lower = text.lower()
        
        # Check for medical keywords
        medical_score = 0
        for category, keywords in self.MEDICAL_KEYWORDS.items():
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    medical_score += 1
        
        if medical_score >= 3:
            if any(kw.lower() in text_lower for kw in ['ultrasound', 'sonography', 'usg']):
                return DocumentType.ULTRASOUND
            return DocumentType.MEDICAL_REPORT
        
        # Check for ID patterns
        if 'passport' in text_lower:
            return DocumentType.PASSPORT
        
        # Check if any ID pattern matches
        for pattern_name, pattern in self.compiled_patterns.items():
            if pattern.search(text):
                if pattern_name == 'passport':
                    return DocumentType.PASSPORT
                return DocumentType.ID_CARD
        
        return DocumentType.UNKNOWN
    
    def extract_id_number(self, text: str, 
                         id_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Extract ID number from text.
        
        Args:
            text: OCR extracted text
            id_type: Specific ID type to look for (optional)
            
        Returns:
            Dictionary with id_number, id_type, and confidence
        """
        if id_type and id_type in self.compiled_patterns:
            # Search for specific ID type
            pattern = self.compiled_patterns[id_type]
            match = pattern.search(text)
            if match:
                return {
                    'id_number': match.group(0),
                    'id_type': id_type,
                    'confidence': 0.9
                }
        else:
            # Try all patterns
            for pattern_name, pattern in self.compiled_patterns.items():
                match = pattern.search(text)
                if match:
                    return {
                        'id_number': match.group(0),
                        'id_type': pattern_name,
                        'confidence': 0.8
                    }
        
        logger.warning("No ID number found in text")
        return None
    
    def extract_medical_measurements(self, text: str) -> Dict[str, Any]:
        """
        Extract medical measurements from ultrasound/medical reports.
        
        Args:
            text: OCR extracted text
            
        Returns:
            Dictionary with extracted measurements
        """
        measurements = {}
        
        # Pattern to match measurements: "BPD: 85mm" or "HC = 320 mm"
        measurement_pattern = r'([A-Z]{2,3})\s*[:=]?\s*(\d+\.?\d*)\s*(mm|cm|weeks)?'
        matches = re.finditer(measurement_pattern, text, re.IGNORECASE)
        
        for match in matches:
            key = match.group(1).upper()
            value = float(match.group(2))
            unit = match.group(3) if match.group(3) else 'mm'
            
            # Check if it's a known fetal measurement
            if any(key in keyword for keyword in self.MEDICAL_KEYWORDS['fetal_measurements']):
                measurements[key] = {
                    'value': value,
                    'unit': unit
                }
        
        # Extract gestational age
        ga_pattern = r'(?:GA|Gestational Age)\s*[:=]?\s*(\d+)\s*(?:weeks?|wks?)\s*(\d+)?\s*(?:days?)?'
        ga_match = re.search(ga_pattern, text, re.IGNORECASE)
        if ga_match:
            weeks = int(ga_match.group(1))
            days = int(ga_match.group(2)) if ga_match.group(2) else 0
            measurements['GA'] = {
                'weeks': weeks,
                'days': days,
                'total_days': weeks * 7 + days
            }
        
        logger.info(f"Extracted {len(measurements)} medical measurements")
        return measurements
    
    def extract_dates(self, text: str) -> List[Dict[str, str]]:
        """
        Extract dates from text (various formats).
        
        Args:
            text: OCR extracted text
            
        Returns:
            List of dictionaries with date and format
        """
        dates = []
        
        # Common date patterns
        date_patterns = [
            (r'\d{2}[-/]\d{2}[-/]\d{4}', 'DD-MM-YYYY'),
            (r'\d{4}[-/]\d{2}[-/]\d{2}', 'YYYY-MM-DD'),
            (r'\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}', 'DD Mon YYYY'),
        ]
        
        for pattern, format_name in date_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                dates.append({
                    'date': match.group(0),
                    'format': format_name
                })
        
        return dates
    
    def extract_names(self, text: str) -> List[str]:
        """
        Extract potential names from text (simple heuristic).
        
        Args:
            text: OCR extracted text
            
        Returns:
            List of potential names
        """
        # Pattern: 2-3 capitalized words (common name format)
        name_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b'
        matches = re.findall(name_pattern, text)
        
        # Filter out common words that aren't names
        common_words = {'Date', 'Name', 'Address', 'Report', 'Patient', 'Doctor'}
        names = [name for name in matches if name not in common_words]
        
        return names
    
    def extract_entities(self, text: str, 
                        extracted_data: List[Dict],
                        document_type: Optional[DocumentType] = None) -> Dict[str, Any]:
        """
        Extract all relevant entities from OCR text.
        
        Args:
            text: Full OCR text
            extracted_data: Detailed OCR data with positions
            document_type: Known document type (optional)
            
        Returns:
            Dictionary with all extracted entities
        """
        # Auto-detect document type if not provided
        if document_type is None:
            document_type = self.detect_document_type(text)
        
        logger.info(f"Extracting entities for document type: {document_type.value}")
        
        entities = {
            'document_type': document_type.value,
            'raw_text': text
        }
        
        # Extract based on document type
        if document_type in [DocumentType.ID_CARD, DocumentType.PASSPORT]:
            # Extract ID number
            id_info = self.extract_id_number(text)
            if id_info:
                entities['id_info'] = id_info
            
            # Extract names
            names = self.extract_names(text)
            if names:
                entities['potential_names'] = names
            
            # Extract dates (DOB, expiry, etc.)
            dates = self.extract_dates(text)
            if dates:
                entities['dates'] = dates
        
        elif document_type in [DocumentType.MEDICAL_REPORT, DocumentType.ULTRASOUND]:
            # Extract medical measurements
            measurements = self.extract_medical_measurements(text)
            if measurements:
                entities['measurements'] = measurements
            
            # Extract patient name
            names = self.extract_names(text)
            if names:
                entities['patient_name'] = names[0] if names else None
            
            # Extract dates
            dates = self.extract_dates(text)
            if dates:
                entities['report_dates'] = dates
            
            # Validate medical report
            entities['is_valid_medical_report'] = len(measurements) >= 2
        
        # Add confidence score
        entities['extraction_confidence'] = self._calculate_confidence(entities, document_type)
        
        logger.info(f"Entity extraction complete: {len(entities)} fields extracted")
        return entities
    
    def _calculate_confidence(self, entities: Dict[str, Any], 
                             document_type: DocumentType) -> float:
        """
        Calculate overall confidence score for extraction.
        
        Args:
            entities: Extracted entities
            document_type: Document type
            
        Returns:
            Confidence score (0-1)
        """
        score = 0.5  # Base score
        
        if document_type == DocumentType.ID_CARD or document_type == DocumentType.PASSPORT:
            if 'id_info' in entities:
                score += 0.3
            if 'potential_names' in entities:
                score += 0.1
            if 'dates' in entities:
                score += 0.1
        
        elif document_type == DocumentType.MEDICAL_REPORT or document_type == DocumentType.ULTRASOUND:
            if 'measurements' in entities:
                score += 0.2 * min(len(entities['measurements']) / 3, 1)
            if entities.get('is_valid_medical_report'):
                score += 0.2
            if 'patient_name' in entities:
                score += 0.1
        
        return min(score, 1.0)


def extract_from_text(text: str, 
                     extracted_data: Optional[List[Dict]] = None) -> Dict[str, Any]:
    """
    Convenience function to extract entities from OCR text.
    
    Args:
        text: OCR extracted text
        extracted_data: Optional detailed OCR data
        
    Returns:
        Dictionary with extracted entities
    """
    extractor = EntityExtractor()
    return extractor.extract_entities(text, extracted_data or [])
