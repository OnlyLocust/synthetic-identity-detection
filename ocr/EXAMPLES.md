# OCR Pipeline - Example Usage

This file contains example code snippets for using the OCR pipeline.

## Basic Usage

### Process a Single Image

```python
from pipeline import process_document

# Process an ID card
results = process_document(
    'sample_images/id_card.jpg',
    document_type='id_card',
    output_dir='./output'
)

print(f"Document Type: {results['document_type']}")
print(f"Extracted Text:\n{results['full_text']}")
print(f"Entities: {results['entities']}")
```

### Process Medical Report

```python
from pipeline import process_document

results = process_document(
    'sample_images/ultrasound.jpg',
    document_type='ultrasound',
    output_dir='./output'
)

# Access medical measurements
measurements = results['entities'].get('measurements', {})
for key, value in measurements.items():
    if 'value' in value:
        print(f"{key}: {value['value']} {value['unit']}")
```

## Advanced Usage

### Custom Pipeline Configuration

```python
from pipeline import OCRPipeline
from entity_extractor import DocumentType

# Initialize with custom settings
pipeline = OCRPipeline(
    use_gpu=False,
    min_confidence=0.6,
    auto_align=True,
    enhance=True
)

# Process image
results = pipeline.process_image(
    'sample_images/passport.jpg',
    document_type=DocumentType.PASSPORT,
    save_visualization=True,
    output_dir='./output'
)
```

### Batch Processing

```python
from pipeline import OCRPipeline
from pathlib import Path

pipeline = OCRPipeline()

# Get all images from directory
image_paths = list(Path('sample_images').glob('*.jpg'))

# Process batch
results = pipeline.process_batch(
    image_paths,
    save_results=True,
    output_dir='./output'
)

# Analyze results
for result in results:
    if 'error' not in result:
        print(f"{result['image_path']}: {result['document_type']}")
```

### Using Individual Components

#### Preprocessing Only

```python
from preprocessing import DocumentPreprocessor
import cv2

preprocessor = DocumentPreprocessor()
image = cv2.imread('sample_images/skewed_id.jpg')

# Auto-align and enhance
preprocessed, metadata = preprocessor.preprocess(
    image,
    auto_align=True,
    enhance=True
)

# Save result
cv2.imwrite('output/preprocessed.jpg', preprocessed)
```

#### OCR Only

```python
from ocr_engine import OCREngine
import cv2

engine = OCREngine(det_db_thresh=0.3)
image = cv2.imread('sample_images/id_card.jpg')

# Extract text with layout
extracted_data = engine.extract_with_layout(image, min_confidence=0.5)

for item in extracted_data:
    print(f"Text: {item['text']}")
    print(f"Confidence: {item['confidence']:.2f}")
    print(f"Position: {item['position']}")
```

#### Entity Extraction Only

```python
from entity_extractor import EntityExtractor

extractor = EntityExtractor()

# Extract ID number
text = "Passport No: A1234567"
id_info = extractor.extract_id_number(text)
print(f"ID: {id_info['id_number']} (type: {id_info['id_type']})")

# Extract medical measurements
medical_text = """
BPD: 85mm
HC: 320mm
FL: 65mm
GA: 32 weeks 4 days
"""
measurements = extractor.extract_medical_measurements(medical_text)
print(f"Measurements: {measurements}")
```

## Visualization

### Display Results

```python
from pipeline import OCRPipeline
import cv2

pipeline = OCRPipeline()
image_path = 'sample_images/id_card.jpg'

# Process image
results = pipeline.process_image(image_path, save_visualization=True, output_dir='./output')

# Load and display visualization
vis_image = cv2.imread(f"output/{Path(image_path).stem}_ocr_visualization.jpg")
cv2.imshow('OCR Results', vis_image)
cv2.waitKey(0)
```

### Side-by-Side Comparison

```python
from utils import create_side_by_side, load_image
import cv2

original = load_image('sample_images/id_card.jpg')
preprocessed = load_image('output/id_card_preprocessed.jpg')

comparison = create_side_by_side(
    original, 
    preprocessed,
    labels=('Original', 'Preprocessed')
)

cv2.imwrite('output/comparison.jpg', comparison)
```

## Error Handling

```python
from pipeline import process_document

try:
    results = process_document('sample_images/test.jpg')
    print(f"Success: {results['document_type']}")
except FileNotFoundError as e:
    print(f"Image not found: {e}")
except ValueError as e:
    print(f"Invalid image: {e}")
except Exception as e:
    print(f"Processing error: {e}")
```

## Working with Results

### Save Results to JSON

```python
from pipeline import OCRPipeline
from utils import save_json

pipeline = OCRPipeline()
results = pipeline.process_image('sample_images/id_card.jpg')

# Save to custom location
save_json(results, 'custom_output/results.json')
```

### Filter by Confidence

```python
from pipeline import OCRPipeline

pipeline = OCRPipeline(min_confidence=0.7)  # Higher threshold
results = pipeline.process_image('sample_images/id_card.jpg')

# Only high-confidence text will be extracted
high_conf_text = [
    item['text'] 
    for item in results['ocr_data'] 
    if item['confidence'] > 0.8
]
```

## Integration Example

### Flask API Endpoint

```python
from flask import Flask, request, jsonify
from pipeline import process_document
import tempfile
import os

app = Flask(__name__)

@app.route('/api/ocr', methods=['POST'])
def ocr_endpoint():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    doc_type = request.form.get('document_type')
    
    # Save temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
        file.save(tmp.name)
        
        try:
            results = process_document(tmp.name, document_type=doc_type)
            return jsonify({
                'success': True,
                'document_type': results['document_type'],
                'text': results['full_text'],
                'entities': results['entities']
            })
        finally:
            os.unlink(tmp.name)

if __name__ == '__main__':
    app.run(debug=True)
```
