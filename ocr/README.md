# OCR Pipeline for Echelon PS

High-fidelity OCR pipeline for extracting text from ID cards and medical reports using PaddleOCR.

## Features

- **Document Alignment**: Automatic perspective correction for skewed documents
- **Adaptive Preprocessing**: Handles varying lighting conditions and glares on plastic IDs/thermal prints
- **PaddleOCR Integration**: Optimized parameters for high-stakes documents
- **Entity Extraction**: Regex-based validation for IDs and medical measurements
- **Batch Processing**: Process multiple documents efficiently

## Installation

```bash
pip install -r requirements.txt
```

## Quick Start

### Single Image Processing

```bash
python pipeline.py <image_path> [document_type] [output_dir]
```

Example:
```bash
python pipeline.py sample_images/id.jpg id_card ./output
python pipeline.py sample_images/ultrasound.jpg medical_report ./output
```

### Using Python API

```python
from pipeline import process_document

results = process_document(
    'path/to/image.jpg',
    document_type='id_card',  # or 'passport', 'medical_report', 'ultrasound'
    output_dir='./output',
    save_visualization=True
)

print(results['full_text'])
print(results['entities'])
```

### Batch Processing

```python
from pipeline import OCRPipeline
from entity_extractor import DocumentType

pipeline = OCRPipeline()
results = pipeline.process_batch(
    image_paths=['img1.jpg', 'img2.jpg'],
    document_type=DocumentType.ID_CARD,
    output_dir='./output'
)
```

## Document Types

- **ID Card**: Generic ID cards with alphanumeric identifiers
- **Passport**: Standard passport format (e.g., A1234567)
- **Medical Report**: General medical documents
- **Ultrasound**: Fetal ultrasound reports with WHO Guidelines metrics (BPD, HC, FL, AC, etc.)

## Supported ID Formats

- **Passport**: `[A-Z][0-9]{7}`
- **Aadhaar**: `\d{4}\s?\d{4}\s?\d{4}`
- **PAN**: `[A-Z]{5}[0-9]{4}[A-Z]`
- **Driver's License**: `[A-Z]{2}[0-9]{13}`
- **Generic ID**: `[A-Z0-9]{8,12}`

## Medical Keywords (WHO Guidelines)

### Fetal Measurements
- BPD (Biparietal Diameter)
- HC (Head Circumference)
- FL (Femur Length)
- AC (Abdominal Circumference)
- CRL (Crown-Rump Length)
- EFW (Estimated Fetal Weight)

### Gestational Information
- GA (Gestational Age)
- EDD (Expected Delivery Date)
- LMP (Last Menstrual Period)

## Testing

Run demo tests:
```bash
python test_ocr.py
```

Test single image:
```bash
python test_ocr.py --mode single --input sample_images/id.jpg --type id_card
```

Test batch processing:
```bash
python test_ocr.py --mode batch --input sample_images/ --type medical_report
```

Test ID extraction:
```bash
python test_ocr.py --mode id_test
```

Test medical extraction:
```bash
python test_ocr.py --mode medical_test
```

## Project Structure

```
ocr/
├── preprocessing.py      # Document alignment & preprocessing
├── ocr_engine.py        # PaddleOCR integration
├── entity_extractor.py  # Entity extraction & validation
├── pipeline.py          # Main orchestration pipeline
├── config.py            # Configuration settings
├── utils.py             # Utility functions
├── test_ocr.py          # Test script
├── requirements.txt     # Dependencies
├── sample_images/       # Sample test images (to be added)
└── output/             # Processing results
```

## Configuration

Edit `config.py` to customize:
- OCR parameters (detection threshold, batch size, etc.)
- ID validation patterns
- Medical keywords
- Preprocessing settings

## Output

For each processed image, the pipeline generates:
- **JSON Results**: Extracted text, entities, and metadata
- **Preprocessed Image**: Aligned and enhanced document
- **OCR Visualization**: Image with bounding boxes and detected text

## Example Output

```json
{
  "document_type": "ultrasound",
  "full_text": "...",
  "entities": {
    "measurements": {
      "BPD": {"value": 85, "unit": "mm"},
      "HC": {"value": 320, "unit": "mm"},
      "FL": {"value": 65, "unit": "mm"},
      "GA": {"weeks": 32, "days": 4}
    },
    "extraction_confidence": 0.87
  },
  "processing_time_seconds": 2.34
}
```

## Notes

- First run will download PaddleOCR models (~100MB)
- GPU acceleration available (set `use_gpu=True` in config)
- For best results, ensure documents are well-lit and in focus
- Supported image formats: JPG, PNG, BMP

## License

Part of the Echelon PS project.
