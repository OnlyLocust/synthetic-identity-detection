from fastapi import FastAPI, UploadFile, File, HTTPException
import shutil
import os
import uuid
import logging
from typing import List

# Import analyzers
from .analyzers.ela import calculate_ela
from .analyzers.fft import detect_fft_artifacts
from .analyzers.ocr import check_text_alignment
from .analyzers.metadata import analyze_metadata

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI-Generated Document Forgery Detection Service")

UPLOAD_DIR = "input"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/v1/verify-document")
async def verify_document(file: UploadFile = File(...)):
    """
    Verifies a document for forgery using ELA, FFT, OCR, and Metadata analysis.
    """
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    try:
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"Processing file: {file_path}")
        
        # 1. Error Level Analysis (ELA)
        ela_result = calculate_ela(file_path)
        
        # 2. Frequency Domain Artifact Detection (FFT)
        fft_result = detect_fft_artifacts(file_path)
        
        # 3. Text & Font Consistency (OCR)
        ocr_result = check_text_alignment(file_path)
        
        # 4. Metadata & Compression Analysis
        metadata_result = analyze_metadata(file_path)
        
        # Aggregation Logic
        flags = []
        score = 0
        
        # ELA checks
        if ela_result.get("has_high_ela"):
            flags.append("ELA_INCONSISTENCY")
            score += 30
        
        # FFT checks
        if fft_result.get("is_ai_generated"):
            flags.append("AI_FFT_ARTIFACT")
            score += 40
            
        # OCR checks
        if ocr_result.get("manual_text_overlay_detected"):
            flags.append("MANUAL_TEXT_OVERLAY")
            score += 20
        elif ocr_result.get("inconsistency_count", 0) > 0:
             # Add a minor penalty for minor inconsistencies
             score += 10
             
        # Metadata checks
        if metadata_result.get("is_suspicious"):
            flags.extend(metadata_result.get("metadata_flags", []))
            score += 15
            
        # Normalize score to 0-100
        score = min(score, 100)
        
        # Recommendation
        if score > 75:
            recommendation = "REJECT"
        elif score > 25:
            recommendation = "REVIEW"
        else:
            recommendation = "PASS"
            
        return {
            "forgeryScore": score,
            "flags": flags,
            "recommendation": recommendation,
            "details": {
                "ela": ela_result,
                "fft": fft_result,
                "ocr": ocr_result,
                "metadata": metadata_result
            }
        }
        
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Cleanup
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {file_path}: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
