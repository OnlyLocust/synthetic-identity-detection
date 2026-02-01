"""
Utility functions for OCR Pipeline
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Union, Optional
import logging
import json

def setup_logging(level: str = 'INFO'):
    """
    Setup logging configuration.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR)
    """
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


def load_image(image_path: Union[str, Path]) -> np.ndarray:
    """
    Load an image from file.
    
    Args:
        image_path: Path to image file
        
    Returns:
        Image as numpy array
        
    Raises:
        ValueError: If image cannot be loaded
    """
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"Could not load image from {image_path}")
    return image


def save_image(image: np.ndarray, output_path: Union[str, Path]):
    """
    Save an image to file.
    
    Args:
        image: Image as numpy array
        output_path: Path to save image
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), image)


def load_json(json_path: Union[str, Path]) -> dict:
    """
    Load JSON file.
    
    Args:
        json_path: Path to JSON file
        
    Returns:
        Dictionary from JSON
    """
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(data: dict, output_path: Union[str, Path]):
    """
    Save dictionary to JSON file.
    
    Args:
        data: Dictionary to save
        output_path: Path to save JSON
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def draw_bounding_boxes(image: np.ndarray, 
                       boxes: list,
                       color: tuple = (0, 255, 0),
                       thickness: int = 2) -> np.ndarray:
    """
    Draw bounding boxes on image.
    
    Args:
        image: Input image
        boxes: List of bounding boxes (each as 4 points)
        color: Box color (BGR)
        thickness: Line thickness
        
    Returns:
        Image with boxes drawn
    """
    result = image.copy()
    for box in boxes:
        box = np.array(box, dtype=np.int32)
        cv2.polylines(result, [box], True, color, thickness)
    return result


def create_side_by_side(image1: np.ndarray, 
                       image2: np.ndarray,
                       labels: Optional[tuple] = None) -> np.ndarray:
    """
    Create side-by-side comparison of two images.
    
    Args:
        image1: First image
        image2: Second image
        labels: Optional tuple of (label1, label2)
        
    Returns:
        Combined image
    """
    # Resize images to same height
    h1, w1 = image1.shape[:2]
    h2, w2 = image2.shape[:2]
    
    target_height = max(h1, h2)
    
    if h1 != target_height:
        ratio = target_height / h1
        image1 = cv2.resize(image1, (int(w1 * ratio), target_height))
    
    if h2 != target_height:
        ratio = target_height / h2
        image2 = cv2.resize(image2, (int(w2 * ratio), target_height))
    
    # Add labels if provided
    if labels:
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(image1, labels[0], (10, 30), font, 1, (255, 255, 255), 2)
        cv2.putText(image2, labels[1], (10, 30), font, 1, (255, 255, 255), 2)
    
    # Concatenate horizontally
    combined = np.hstack([image1, image2])
    return combined


def get_image_files(directory: Union[str, Path], 
                   extensions: tuple = ('.jpg', '.jpeg', '.png', '.bmp')) -> list:
    """
    Get all image files from a directory.
    
    Args:
        directory: Directory to search
        extensions: Tuple of valid extensions
        
    Returns:
        List of image file paths
    """
    directory = Path(directory)
    image_files = []
    
    for ext in extensions:
        image_files.extend(directory.glob(f'*{ext}'))
        image_files.extend(directory.glob(f'*{ext.upper()}'))
    
    return sorted(image_files)


def validate_image_path(image_path: Union[str, Path]) -> Path:
    """
    Validate that image path exists and is a file.
    
    Args:
        image_path: Path to validate
        
    Returns:
        Validated Path object
        
    Raises:
        FileNotFoundError: If path doesn't exist
        ValueError: If path is not a file
    """
    image_path = Path(image_path)
    
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    if not image_path.is_file():
        raise ValueError(f"Path is not a file: {image_path}")
    
    return image_path


def format_confidence(confidence: float) -> str:
    """
    Format confidence score as percentage.
    
    Args:
        confidence: Confidence score (0-1)
        
    Returns:
        Formatted string
    """
    return f"{confidence * 100:.1f}%"


def print_results_summary(results: dict):
    """
    Print a formatted summary of OCR results.
    
    Args:
        results: Results dictionary from pipeline
    """
    print("\n" + "="*60)
    print("OCR PROCESSING RESULTS")
    print("="*60)
    print(f"Image: {results['image_path']}")
    print(f"Document Type: {results['document_type']}")
    print(f"Processing Time: {results['processing_time_seconds']:.2f}s")
    print(f"Text Regions Detected: {len(results['ocr_data'])}")
    
    if results['preprocessing_metadata'].get('aligned'):
        print("✓ Document auto-aligned")
    
    print("\n" + "-"*60)
    print("EXTRACTED TEXT:")
    print("-"*60)
    print(results['full_text'][:500])
    if len(results['full_text']) > 500:
        print("... (truncated)")
    
    print("\n" + "-"*60)
    print("EXTRACTED ENTITIES:")
    print("-"*60)
    
    entities = results['entities']
    
    if 'id_info' in entities:
        print(f"ID Number: {entities['id_info']['id_number']}")
        print(f"ID Type: {entities['id_info']['id_type']}")
        print(f"Confidence: {format_confidence(entities['id_info']['confidence'])}")
    
    if 'measurements' in entities:
        print("Medical Measurements:")
        for key, value in entities['measurements'].items():
            if isinstance(value, dict):
                if 'value' in value:
                    print(f"  {key}: {value['value']} {value.get('unit', '')}")
                elif 'weeks' in value:
                    print(f"  {key}: {value['weeks']} weeks {value.get('days', 0)} days")
    
    if 'potential_names' in entities:
        print(f"Potential Names: {', '.join(entities['potential_names'])}")
    
    print(f"\nExtraction Confidence: {format_confidence(entities['extraction_confidence'])}")
    print("="*60 + "\n")
