"""
Main OCR Pipeline
Orchestrates the complete OCR workflow: preprocessing → OCR → entity extraction
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, Union
import logging
import json
from datetime import datetime

from preprocessing import DocumentPreprocessor, preprocess_for_ocr
from ocr_engine import OCREngine, quick_ocr
from entity_extractor import EntityExtractor, DocumentType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OCRPipeline:
    """End-to-end OCR pipeline for document processing."""
    
    def __init__(self, 
                 use_gpu: bool = False,
                 min_confidence: float = 0.5,
                 auto_align: bool = True,
                 enhance: bool = True):
        """
        Initialize the OCR pipeline.
        
        Args:
            use_gpu: Whether to use GPU for OCR
            min_confidence: Minimum confidence for text recognition
            auto_align: Whether to auto-align documents
            enhance: Whether to enhance image quality
        """
        self.preprocessor = DocumentPreprocessor()
        self.ocr_engine = OCREngine(use_gpu=use_gpu)
        self.entity_extractor = EntityExtractor()
        
        self.min_confidence = min_confidence
        self.auto_align = auto_align
        self.enhance = enhance
        
        logger.info("OCR Pipeline initialized")
    
    def process_image(self, 
                     image_path: Union[str, Path],
                     document_type: Optional[DocumentType] = None,
                     save_visualization: bool = False,
                     output_dir: Optional[Union[str, Path]] = None) -> Dict[str, Any]:
        """
        Process a single document image through the complete pipeline.
        
        Args:
            image_path: Path to input image
            document_type: Known document type (optional, will auto-detect)
            save_visualization: Whether to save visualization images
            output_dir: Directory to save outputs (required if save_visualization=True)
            
        Returns:
            Dictionary containing:
                - preprocessing_metadata: Info about preprocessing steps
                - ocr_data: Raw OCR results with bounding boxes
                - full_text: Concatenated text
                - entities: Extracted structured entities
                - document_type: Detected/specified document type
                - processing_time: Time taken for processing
        """
        start_time = datetime.now()
        image_path = Path(image_path)
        
        logger.info(f"Processing image: {image_path}")
        
        # Step 1: Load and preprocess
        logger.info("Step 1: Preprocessing...")
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Could not load image from {image_path}")
        
        preprocessed, metadata = self.preprocessor.preprocess(
            image, 
            auto_align=self.auto_align,
            enhance=self.enhance
        )
        
        # Save preprocessed image if requested
        if save_visualization and output_dir:
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
            preprocessed_path = output_dir / f"{image_path.stem}_preprocessed.jpg"
            cv2.imwrite(str(preprocessed_path), preprocessed)
            logger.info(f"Saved preprocessed image: {preprocessed_path}")
        
        # Step 2: OCR
        logger.info("Step 2: Running OCR...")
        ocr_data = self.ocr_engine.extract_with_layout(
            preprocessed, 
            min_confidence=self.min_confidence
        )
        full_text = '\n'.join([item['text'] for item in ocr_data])
        
        # Save OCR visualization if requested
        if save_visualization and output_dir:
            vis_image = self.ocr_engine.visualize_results(preprocessed, ocr_data)
            vis_path = output_dir / f"{image_path.stem}_ocr_visualization.jpg"
            cv2.imwrite(str(vis_path), vis_image)
            logger.info(f"Saved OCR visualization: {vis_path}")
        
        # Step 3: Entity extraction
        logger.info("Step 3: Extracting entities...")
        entities = self.entity_extractor.extract_entities(
            full_text, 
            ocr_data,
            document_type=document_type
        )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Compile results
        results = {
            'image_path': str(image_path),
            'preprocessing_metadata': metadata,
            'ocr_data': ocr_data,
            'full_text': full_text,
            'entities': entities,
            'document_type': entities['document_type'],
            'processing_time_seconds': processing_time,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Processing complete in {processing_time:.2f}s")
        logger.info(f"Document type: {results['document_type']}")
        logger.info(f"Extracted {len(ocr_data)} text regions")
        
        return results
    
    def process_batch(self,
                     image_paths: list,
                     document_type: Optional[DocumentType] = None,
                     save_results: bool = True,
                     output_dir: Optional[Union[str, Path]] = None) -> list:
        """
        Process multiple images in batch.
        
        Args:
            image_paths: List of image paths
            document_type: Known document type for all images (optional)
            save_results: Whether to save results to JSON
            output_dir: Directory to save outputs
            
        Returns:
            List of results for each image
        """
        results = []
        
        for i, image_path in enumerate(image_paths):
            logger.info(f"Processing batch {i+1}/{len(image_paths)}")
            try:
                result = self.process_image(
                    image_path,
                    document_type=document_type,
                    save_visualization=True,
                    output_dir=output_dir
                )
                results.append(result)
            except Exception as e:
                logger.error(f"Error processing {image_path}: {e}")
                results.append({
                    'image_path': str(image_path),
                    'error': str(e)
                })
        
        # Save batch results
        if save_results and output_dir:
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
            results_path = output_dir / f"batch_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            with open(results_path, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved batch results: {results_path}")
        
        return results
    
    def save_results(self, results: Dict[str, Any], output_path: Union[str, Path]):
        """
        Save processing results to JSON file.
        
        Args:
            results: Processing results dictionary
            output_path: Path to save JSON file
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Results saved to: {output_path}")


def process_document(image_path: str,
                    document_type: Optional[str] = None,
                    output_dir: str = './output',
                    save_visualization: bool = True) -> Dict[str, Any]:
    """
    Convenience function to process a single document.
    
    Args:
        image_path: Path to input image
        document_type: Document type ('id_card', 'passport', 'medical_report', 'ultrasound')
        output_dir: Directory to save outputs
        save_visualization: Whether to save visualization images
        
    Returns:
        Processing results dictionary
    """
    # Convert document type string to enum
    doc_type = None
    if document_type:
        try:
            doc_type = DocumentType(document_type.lower())
        except ValueError:
            logger.warning(f"Unknown document type: {document_type}, will auto-detect")
    
    # Initialize pipeline
    pipeline = OCRPipeline()
    
    # Process image
    results = pipeline.process_image(
        image_path,
        document_type=doc_type,
        save_visualization=save_visualization,
        output_dir=output_dir
    )
    
    # Save results
    output_path = Path(output_dir) / f"{Path(image_path).stem}_results.json"
    pipeline.save_results(results, output_path)
    
    return results


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python pipeline.py <image_path> [document_type] [output_dir]")
        print("Document types: id_card, passport, medical_report, ultrasound")
        sys.exit(1)
    
    image_path = sys.argv[1]
    document_type = sys.argv[2] if len(sys.argv) > 2 else None
    output_dir = sys.argv[3] if len(sys.argv) > 3 else './output'
    
    results = process_document(image_path, document_type, output_dir)
    
    print("\n" + "="*50)
    print("OCR PROCESSING COMPLETE")
    print("="*50)
    print(f"Document Type: {results['document_type']}")
    print(f"Processing Time: {results['processing_time_seconds']:.2f}s")
    print(f"\nExtracted Text:\n{results['full_text'][:500]}...")
    print(f"\nEntities: {json.dumps(results['entities'], indent=2)}")
