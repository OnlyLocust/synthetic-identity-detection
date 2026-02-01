import os
import cv2
import numpy as np
from PIL import Image, ImageChops

def calculate_ela(image_path: str, quality: int = 90) -> dict:
    """
    Performs Error Level Analysis (ELA) on an image.
    
    Args:
        image_path (str): The path to the image file.
        quality (int): The quality to re-save the image (default 90).
        
    Returns:
        dict: A dictionary containing the ELA score and a processed ELA image (as a path or placeholder).
              For this API, we will return a score representing the average error level.
    """
    try:
        original = Image.open(image_path).convert('RGB')
        
        # Save a temporary copy at the specified quality
        resaved_path = image_path + ".resaved.jpg"
        original.save(resaved_path, 'JPEG', quality=quality)
        resaved = Image.open(resaved_path)
        
        # Calculate the absolute difference between the original and the resaved image
        ela_image = ImageChops.difference(original, resaved)
        
        # Calculate the extrema (max difference) to scale the image
        extrema = ela_image.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        
        if max_diff == 0:
            scale = 1
        else:
            scale = 255.0 / max_diff
            
        ela_image = ImageEnhance.brightness(ela_image).enhance(scale)
        
        # Calculate a simple metric: percent of pixels with high difference
        # Convert to numpy array for easier calculation
        ela_np = np.array(ela_image)
        # Threshold for "high" error
        threshold = 30 
        high_error_pixels = np.sum(ela_np > threshold)
        total_pixels = ela_np.size
        
        ela_score = (high_error_pixels / total_pixels) * 100
        
        # Clean up
        resaved.close()
        os.remove(resaved_path)
        
        return {
            "score": ela_score,
            "max_difference": max_diff,
            "has_high_ela": ela_score > 5.0 # Threshold for flagging, fine-tune as needed
        }
        
    except Exception as e:
        print(f"Error in ELA: {e}")
        if os.path.exists(image_path + ".resaved.jpg"):
             os.remove(image_path + ".resaved.jpg")
        return {"score": 0, "error": str(e)}

from PIL import ImageEnhance
