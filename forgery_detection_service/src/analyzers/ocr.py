import cv2
import pytesseract
import numpy as np
from PIL import Image

def check_text_alignment(image_path: str) -> dict:
    """
    Checks for text alignment consistency using OCR.
    specifically checking if 'Name' fields or similar have inconsistent vertical alignment
    which might indicate manual text overlay.
    
    Args:
        image_path (str): Path to the image file.
        
    Returns:
        dict: Detection results.
    """
    try:
        # Load image
        img = cv2.imread(image_path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Use pytesseract to extract data with bounding boxes
        # Output format: dict with 'left', 'top', 'width', 'height', 'text', etc.
        data = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)
        
        num_boxes = len(data['text'])
        
        inconsistencies = []
        rows = {} # Group words by approximate Y position (row)
        
        # Threshold for considering text on the same row (pixels)
        row_threshold = 10 
        
        for i in range(num_boxes):
            text = data['text'][i].strip()
            if not text:
                continue
                
            top = data['top'][i]
            height = data['height'][i]
            center_y = top + height / 2
            
            # Find a matching row or create new
            matched_row = None
            for y_key in rows:
                if abs(y_key - center_y) < row_threshold:
                    matched_row = y_key
                    break
            
            if matched_row is None:
                rows[center_y] = []
                matched_row = center_y
                
            rows[matched_row].append({
                "text": text,
                "top": top,
                "height": height,
                "index": i
            })
            
        # Analyze rows for alignment deviation
        # If a word in a row has a 'top' that differs significantly from the row median, flag it.
        
        for y_key, words in rows.items():
            if len(words) < 2:
                continue
                
            tops = [w['top'] for w in words]
            median_top = np.median(tops)
            
            for w in words:
                # 3 pixel deviation as per requirements
                if abs(w['top'] - median_top) > 3:
                    # We flag it, but we might want to be selective about what text we flag.
                    # For now, flag if it looks like a "Name" field or crucial data could be tricky 
                    # without more context, so we'll just return the count of misaligned items.
                    inconsistencies.append({
                        "text": w['text'],
                        "deviation": abs(w['top'] - median_top),
                        "row_median": median_top
                    })

        return {
            "manual_text_overlay_detected": len(inconsistencies) > 0,
            "inconsistency_count": len(inconsistencies),
            "details": inconsistencies[:5] # Return top 5 for brevity
        }

    except Exception as e:
        # Pytesseract might fail if Tesseract is not in PATH
        return {"manual_text_overlay_detected": False, "error": str(e)}
