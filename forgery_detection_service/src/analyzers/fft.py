import cv2
import numpy as np

def detect_fft_artifacts(image_path: str) -> dict:
    """
    Detects periodic artifacts in the frequency domain characteristic of AI generation (GANs/Diffusion).
    
    Args:
        image_path (str): Path to the image file.
        
    Returns:
        dict: Detection results including a boolean flag and score.
    """
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return {"detected": False, "error": "Could not read image"}

        # Perform FFT
        f = np.fft.fft2(img)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-6) # Add small epsilon to avoid log(0)

        # AI-generated images often have strong periodic spikes in high frequencies.
        # We analyze the high-frequency regions.
        
        rows, cols = img.shape
        crow, ccol = rows // 2, cols // 2
        
        # Mask the center (low frequencies)
        mask_radius = 20
        magnitude_spectrum[crow-mask_radius:crow+mask_radius, ccol-mask_radius:ccol+mask_radius] = 0
        
        # Calculate mean and standard deviation of the high frequency logs
        mean_mag = np.mean(magnitude_spectrum)
        std_mag = np.std(magnitude_spectrum)
        
        # Simple heuristic: if there are many pixels significantly brighter than the mean, 
        # it suggests periodic artifacts.
        
        # Identify peaks
        threshold = mean_mag + 4 * std_mag
        peaks = np.sum(magnitude_spectrum > threshold)
        
        # Normalized score based on image size
        peak_ratio = peaks / (rows * cols) * 10000 
        
        # Thresholds would need calibration on a dataset, but we'll set a reasonable starter
        is_ai_generated = peak_ratio > 5.0 

        return {
            "is_ai_generated": bool(is_ai_generated),
            "fft_score": float(peak_ratio)
        }

    except Exception as e:
        return {"detected": False, "error": str(e)}
