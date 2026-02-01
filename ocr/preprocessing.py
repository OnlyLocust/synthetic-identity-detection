"""
Document Alignment & Preprocessing Module
Handles perspective correction, adaptive thresholding, and image enhancement
for ID cards and medical reports with varying lighting conditions.
"""

import cv2
import numpy as np
from typing import Tuple, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocumentPreprocessor:
    """Preprocesses documents for optimal OCR performance."""
    
    def __init__(self, target_width: int = 800):
        """
        Initialize the preprocessor.
        
        Args:
            target_width: Target width for resized images (maintains aspect ratio)
        """
        self.target_width = target_width
    
    def resize_image(self, image: np.ndarray) -> np.ndarray:
        """
        Resize image while maintaining aspect ratio.
        
        Args:
            image: Input image
            
        Returns:
            Resized image
        """
        height, width = image.shape[:2]
        if width > self.target_width:
            ratio = self.target_width / width
            new_height = int(height * ratio)
            image = cv2.resize(image, (self.target_width, new_height), 
                             interpolation=cv2.INTER_AREA)
        return image
    
    def detect_document_corners(self, image: np.ndarray) -> Optional[np.ndarray]:
        """
        Detect the four corners of a document using contour detection.
        
        Args:
            image: Input image
            
        Returns:
            Array of 4 corner points or None if not found
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Dilate edges to close gaps
        kernel = np.ones((5, 5), np.uint8)
        dilated = cv2.dilate(edges, kernel, iterations=1)
        
        # Find contours
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, 
                                       cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            logger.warning("No contours found in image")
            return None
        
        # Sort contours by area (largest first)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        
        # Find the largest rectangular contour
        for contour in contours[:5]:  # Check top 5 largest contours
            # Approximate the contour to a polygon
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
            
            # If the approximated contour has 4 points, we found our document
            if len(approx) == 4:
                logger.info("Document corners detected successfully")
                return approx.reshape(4, 2)
        
        logger.warning("Could not find 4-sided document contour")
        return None
    
    def order_points(self, pts: np.ndarray) -> np.ndarray:
        """
        Order points in consistent order: top-left, top-right, bottom-right, bottom-left.
        
        Args:
            pts: Array of 4 points
            
        Returns:
            Ordered array of points
        """
        rect = np.zeros((4, 2), dtype=np.float32)
        
        # Sum and difference to find corners
        s = pts.sum(axis=1)
        diff = np.diff(pts, axis=1)
        
        rect[0] = pts[np.argmin(s)]      # Top-left (smallest sum)
        rect[2] = pts[np.argmax(s)]      # Bottom-right (largest sum)
        rect[1] = pts[np.argmin(diff)]   # Top-right (smallest difference)
        rect[3] = pts[np.argmax(diff)]   # Bottom-left (largest difference)
        
        return rect
    
    def perspective_warp(self, image: np.ndarray, corners: np.ndarray) -> np.ndarray:
        """
        Apply perspective transformation to straighten the document.
        
        Args:
            image: Input image
            corners: Array of 4 corner points
            
        Returns:
            Warped (straightened) image
        """
        # Order the corners
        rect = self.order_points(corners)
        (tl, tr, br, bl) = rect
        
        # Calculate width of the new image
        widthA = np.linalg.norm(br - bl)
        widthB = np.linalg.norm(tr - tl)
        maxWidth = max(int(widthA), int(widthB))
        
        # Calculate height of the new image
        heightA = np.linalg.norm(tr - br)
        heightB = np.linalg.norm(tl - bl)
        maxHeight = max(int(heightA), int(heightB))
        
        # Destination points for the warped image
        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]
        ], dtype=np.float32)
        
        # Calculate perspective transform matrix
        M = cv2.getPerspectiveTransform(rect, dst)
        
        # Apply perspective transformation
        warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
        
        logger.info(f"Applied perspective warp: {image.shape} -> {warped.shape}")
        return warped
    
    def adaptive_threshold(self, image: np.ndarray) -> np.ndarray:
        """
        Apply adaptive thresholding to handle varying lighting conditions.
        Particularly useful for plastic ID cards with glare and thermal prints.
        
        Args:
            image: Input image (BGR or grayscale)
            
        Returns:
            Binary thresholded image
        """
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Apply adaptive thresholding
        # Using Gaussian method which is better for varying illumination
        binary = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            blockSize=11,  # Size of pixel neighborhood
            C=2            # Constant subtracted from mean
        )
        
        logger.info("Applied adaptive thresholding")
        return binary
    
    def enhance_image(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance image quality through noise reduction and sharpening.
        
        Args:
            image: Input image
            
        Returns:
            Enhanced image
        """
        # Denoise
        denoised = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
        
        # Sharpen using unsharp mask
        gaussian = cv2.GaussianBlur(denoised, (0, 0), 2.0)
        sharpened = cv2.addWeighted(denoised, 1.5, gaussian, -0.5, 0)
        
        # Increase contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization)
        lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        logger.info("Applied image enhancement")
        return enhanced
    
    def preprocess(self, image: np.ndarray, 
                   auto_align: bool = True,
                   enhance: bool = True) -> Tuple[np.ndarray, dict]:
        """
        Complete preprocessing pipeline for a document image.
        
        Args:
            image: Input image
            auto_align: Whether to automatically detect and align document
            enhance: Whether to apply image enhancement
            
        Returns:
            Tuple of (preprocessed image, metadata dict)
        """
        metadata = {
            'original_shape': image.shape,
            'aligned': False,
            'enhanced': enhance
        }
        
        # Resize for consistent processing
        image = self.resize_image(image)
        
        # Auto-align if requested
        if auto_align:
            corners = self.detect_document_corners(image)
            if corners is not None:
                image = self.perspective_warp(image, corners)
                metadata['aligned'] = True
            else:
                logger.warning("Auto-alignment failed, using original orientation")
        
        # Enhance image quality
        if enhance:
            image = self.enhance_image(image)
        
        metadata['final_shape'] = image.shape
        
        logger.info(f"Preprocessing complete: {metadata}")
        return image, metadata


def preprocess_for_ocr(image_path: str, 
                       auto_align: bool = True,
                       enhance: bool = True) -> Tuple[np.ndarray, np.ndarray, dict]:
    """
    Convenience function to preprocess an image for OCR.
    
    Args:
        image_path: Path to input image
        auto_align: Whether to automatically detect and align document
        enhance: Whether to apply image enhancement
        
    Returns:
        Tuple of (color image, binary image, metadata)
    """
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not load image from {image_path}")
    
    # Preprocess
    preprocessor = DocumentPreprocessor()
    preprocessed, metadata = preprocessor.preprocess(image, auto_align, enhance)
    
    # Also create binary version for OCR
    binary = preprocessor.adaptive_threshold(preprocessed)
    
    return preprocessed, binary, metadata
