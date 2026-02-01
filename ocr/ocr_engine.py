"""
OCR Engine using PaddleOCR
Optimized for high-stakes documents like IDs and medical reports.
"""

from paddleocr import PaddleOCR
import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OCREngine:
    """PaddleOCR wrapper with optimized parameters for document processing."""
    
    def __init__(self, 
                 lang: str = 'en',
                 use_angle_cls: bool = True,
                 det_db_thresh: float = 0.3,
                 rec_batch_num: int = 6,
                 use_gpu: bool = False):
        """
        Initialize PaddleOCR with optimized parameters.
        
        Args:
            lang: Language for OCR (default: 'en')
            use_angle_cls: Automatically correct text orientation (upside down, 90°)
            det_db_thresh: Detection threshold (lower = detect thinner fonts, watermarks)
            rec_batch_num: Batch size for recognition (higher = faster but more memory)
            use_gpu: Whether to use GPU acceleration
        """
        logger.info("Initializing PaddleOCR engine...")
        
        self.ocr = PaddleOCR(
            use_angle_cls=use_angle_cls,
            lang=lang,
            det_db_thresh=det_db_thresh,
            rec_batch_num=rec_batch_num,
            use_gpu=use_gpu,
            show_log=False
        )
        
        self.lang = lang
        logger.info(f"PaddleOCR initialized: lang={lang}, det_thresh={det_db_thresh}, "
                   f"angle_cls={use_angle_cls}, batch={rec_batch_num}")
    
    def extract_text(self, image: np.ndarray, 
                     min_confidence: float = 0.5) -> List[Dict]:
        """
        Extract text from an image with bounding boxes and confidence scores.
        
        Args:
            image: Input image (BGR or grayscale)
            min_confidence: Minimum confidence threshold for text recognition
            
        Returns:
            List of dictionaries containing:
                - text: Recognized text
                - confidence: Confidence score (0-1)
                - bbox: Bounding box coordinates [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        """
        # Run OCR
        result = self.ocr.ocr(image, cls=True)
        
        if not result or not result[0]:
            logger.warning("No text detected in image")
            return []
        
        # Parse results
        extracted_data = []
        for line in result[0]:
            bbox = line[0]
            text_info = line[1]
            text = text_info[0]
            confidence = text_info[1]
            
            # Filter by confidence
            if confidence >= min_confidence:
                extracted_data.append({
                    'text': text,
                    'confidence': confidence,
                    'bbox': bbox
                })
                logger.debug(f"Detected: '{text}' (confidence: {confidence:.3f})")
            else:
                logger.debug(f"Filtered low confidence: '{text}' ({confidence:.3f})")
        
        logger.info(f"Extracted {len(extracted_data)} text regions "
                   f"(min_confidence={min_confidence})")
        return extracted_data
    
    def get_full_text(self, image: np.ndarray, 
                      min_confidence: float = 0.5,
                      separator: str = '\n') -> str:
        """
        Extract all text from image as a single string.
        
        Args:
            image: Input image
            min_confidence: Minimum confidence threshold
            separator: Separator between text lines
            
        Returns:
            Concatenated text string
        """
        extracted_data = self.extract_text(image, min_confidence)
        text_lines = [item['text'] for item in extracted_data]
        return separator.join(text_lines)
    
    def extract_with_layout(self, image: np.ndarray,
                           min_confidence: float = 0.5) -> List[Dict]:
        """
        Extract text with spatial layout information (useful for structured documents).
        
        Args:
            image: Input image
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of dictionaries with text, confidence, bbox, and position info
        """
        extracted_data = self.extract_text(image, min_confidence)
        
        # Add position information
        for item in extracted_data:
            bbox = np.array(item['bbox'])
            
            # Calculate center point
            center_x = int(np.mean(bbox[:, 0]))
            center_y = int(np.mean(bbox[:, 1]))
            
            # Calculate bounding box dimensions
            x_coords = bbox[:, 0]
            y_coords = bbox[:, 1]
            width = int(np.max(x_coords) - np.min(x_coords))
            height = int(np.max(y_coords) - np.min(y_coords))
            
            item['position'] = {
                'center': (center_x, center_y),
                'width': width,
                'height': height,
                'top_left': (int(np.min(x_coords)), int(np.min(y_coords)))
            }
        
        # Sort by vertical position (top to bottom)
        extracted_data.sort(key=lambda x: x['position']['center'][1])
        
        return extracted_data
    
    def visualize_results(self, image: np.ndarray, 
                         extracted_data: List[Dict],
                         show_confidence: bool = True) -> np.ndarray:
        """
        Draw bounding boxes and text on the image for visualization.
        
        Args:
            image: Input image
            extracted_data: List of extracted text data
            show_confidence: Whether to show confidence scores
            
        Returns:
            Annotated image
        """
        # Create a copy to draw on
        vis_image = image.copy()
        
        for item in extracted_data:
            bbox = np.array(item['bbox'], dtype=np.int32)
            text = item['text']
            confidence = item['confidence']
            
            # Draw bounding box
            cv2.polylines(vis_image, [bbox], True, (0, 255, 0), 2)
            
            # Prepare label
            if show_confidence:
                label = f"{text} ({confidence:.2f})"
            else:
                label = text
            
            # Draw text label
            x, y = bbox[0]
            cv2.putText(vis_image, label, (x, y - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        logger.info(f"Visualized {len(extracted_data)} text regions")
        return vis_image
    
    def batch_process(self, images: List[np.ndarray],
                     min_confidence: float = 0.5) -> List[List[Dict]]:
        """
        Process multiple images in batch.
        
        Args:
            images: List of input images
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of extracted data for each image
        """
        results = []
        for i, image in enumerate(images):
            logger.info(f"Processing image {i+1}/{len(images)}")
            extracted_data = self.extract_text(image, min_confidence)
            results.append(extracted_data)
        
        logger.info(f"Batch processing complete: {len(images)} images")
        return results


def quick_ocr(image_path: str, 
              min_confidence: float = 0.5,
              visualize: bool = False) -> Tuple[str, List[Dict], Optional[np.ndarray]]:
    """
    Convenience function for quick OCR on an image file.
    
    Args:
        image_path: Path to input image
        min_confidence: Minimum confidence threshold
        visualize: Whether to return visualization image
        
    Returns:
        Tuple of (full_text, extracted_data, visualization_image)
    """
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not load image from {image_path}")
    
    # Initialize OCR engine
    engine = OCREngine()
    
    # Extract text
    extracted_data = engine.extract_with_layout(image, min_confidence)
    full_text = '\n'.join([item['text'] for item in extracted_data])
    
    # Create visualization if requested
    vis_image = None
    if visualize:
        vis_image = engine.visualize_results(image, extracted_data)
    
    return full_text, extracted_data, vis_image
