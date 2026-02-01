"""
Test script for OCR Pipeline
Demonstrates processing of ID cards and medical reports
"""

import sys
from pathlib import Path
import argparse
import logging

from pipeline import OCRPipeline, process_document
from entity_extractor import DocumentType
from utils import setup_logging, print_results_summary, get_image_files

setup_logging('INFO')
logger = logging.getLogger(__name__)


def test_single_image(image_path: str, 
                     document_type: str = None,
                     output_dir: str = './output'):
    """
    Test OCR pipeline on a single image.
    
    Args:
        image_path: Path to test image
        document_type: Document type hint
        output_dir: Output directory
    """
    logger.info(f"Testing single image: {image_path}")
    
    results = process_document(
        image_path,
        document_type=document_type,
        output_dir=output_dir,
        save_visualization=True
    )
    
    print_results_summary(results)
    
    return results


def test_batch_processing(input_dir: str, 
                         document_type: str = None,
                         output_dir: str = './output'):
    """
    Test batch processing on a directory of images.
    
    Args:
        input_dir: Directory containing images
        document_type: Document type hint for all images
        output_dir: Output directory
    """
    logger.info(f"Testing batch processing: {input_dir}")
    
    # Get all image files
    image_files = get_image_files(input_dir)
    
    if not image_files:
        logger.error(f"No images found in {input_dir}")
        return
    
    logger.info(f"Found {len(image_files)} images")
    
    # Convert document type
    doc_type = None
    if document_type:
        try:
            doc_type = DocumentType(document_type.lower())
        except ValueError:
            logger.warning(f"Unknown document type: {document_type}")
    
    # Initialize pipeline
    pipeline = OCRPipeline()
    
    # Process batch
    results = pipeline.process_batch(
        image_files,
        document_type=doc_type,
        save_results=True,
        output_dir=output_dir
    )
    
    # Print summary
    print("\n" + "="*60)
    print("BATCH PROCESSING SUMMARY")
    print("="*60)
    print(f"Total Images: {len(results)}")
    
    successful = sum(1 for r in results if 'error' not in r)
    failed = len(results) - successful
    
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    
    # Document type breakdown
    doc_types = {}
    for r in results:
        if 'document_type' in r:
            dt = r['document_type']
            doc_types[dt] = doc_types.get(dt, 0) + 1
    
    print("\nDocument Types:")
    for dt, count in doc_types.items():
        print(f"  {dt}: {count}")
    
    print("="*60 + "\n")
    
    return results


def test_id_extraction():
    """Test ID extraction with sample text."""
    from entity_extractor import EntityExtractor
    
    logger.info("Testing ID extraction...")
    
    extractor = EntityExtractor()
    
    # Test cases
    test_cases = [
        ("Passport: A1234567", "passport"),
        ("Aadhaar: 1234 5678 9012", "aadhaar"),
        ("PAN: ABCDE1234F", "pan"),
    ]
    
    print("\n" + "="*60)
    print("ID EXTRACTION TESTS")
    print("="*60)
    
    for text, expected_type in test_cases:
        result = extractor.extract_id_number(text)
        print(f"\nText: {text}")
        if result:
            print(f"✓ Extracted: {result['id_number']} (type: {result['id_type']})")
            if result['id_type'] == expected_type:
                print("  Match: ✓")
            else:
                print(f"  Match: ✗ (expected {expected_type})")
        else:
            print("✗ No ID found")
    
    print("="*60 + "\n")


def test_medical_extraction():
    """Test medical measurement extraction with sample text."""
    from entity_extractor import EntityExtractor
    
    logger.info("Testing medical extraction...")
    
    extractor = EntityExtractor()
    
    # Sample ultrasound report text
    sample_text = """
    ULTRASOUND REPORT
    Patient: Jane Doe
    Date: 15 Jan 2024
    
    Fetal Biometry:
    BPD: 85mm
    HC: 320mm
    FL: 65mm
    AC: 280mm
    
    GA: 32 weeks 4 days
    EDD: 20 Mar 2024
    """
    
    measurements = extractor.extract_medical_measurements(sample_text)
    
    print("\n" + "="*60)
    print("MEDICAL EXTRACTION TEST")
    print("="*60)
    print(f"\nSample Text:\n{sample_text}")
    print("\nExtracted Measurements:")
    
    for key, value in measurements.items():
        if isinstance(value, dict):
            if 'value' in value:
                print(f"  {key}: {value['value']} {value.get('unit', '')}")
            elif 'weeks' in value:
                print(f"  {key}: {value['weeks']} weeks {value.get('days', 0)} days")
    
    print("="*60 + "\n")


def main():
    """Main test function."""
    parser = argparse.ArgumentParser(description='Test OCR Pipeline')
    parser.add_argument('--mode', choices=['single', 'batch', 'id_test', 'medical_test'],
                       default='single', help='Test mode')
    parser.add_argument('--input', help='Input image path or directory')
    parser.add_argument('--type', choices=['id_card', 'passport', 'medical_report', 'ultrasound'],
                       help='Document type')
    parser.add_argument('--output', default='./output', help='Output directory')
    
    args = parser.parse_args()
    
    if args.mode == 'single':
        if not args.input:
            print("Error: --input required for single mode")
            sys.exit(1)
        test_single_image(args.input, args.type, args.output)
    
    elif args.mode == 'batch':
        if not args.input:
            print("Error: --input required for batch mode")
            sys.exit(1)
        test_batch_processing(args.input, args.type, args.output)
    
    elif args.mode == 'id_test':
        test_id_extraction()
    
    elif args.mode == 'medical_test':
        test_medical_extraction()


if __name__ == "__main__":
    # If no arguments provided, run demo tests
    if len(sys.argv) == 1:
        print("Running demo tests...\n")
        test_id_extraction()
        test_medical_extraction()
        print("\nFor full testing, use:")
        print("  python test_ocr.py --mode single --input <image_path>")
        print("  python test_ocr.py --mode batch --input <directory>")
    else:
        main()
