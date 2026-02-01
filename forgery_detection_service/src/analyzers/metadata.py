from PIL import Image, ExifTags
import os

def analyze_metadata(image_path: str) -> dict:
    """
    Analyzes image metadata for signs of editing software or stripped tags.
    
    Args:
        image_path (str): Path to the image file.
        
    Returns:
        dict: Analysis results.
    """
    try:
        img = Image.open(image_path)
        exif_data = img._getexif()
        
        flags = []
        software_found = None
        
        suspicious_softwares = ['Adobe Photoshop', 'GIMP', 'Canvas', 'Paint', 'Editor']
        
        if exif_data:
            for tag, value in exif_data.items():
                tag_name = ExifTags.TAGS.get(tag, tag)
                
                if tag_name == 'Software':
                    software_found = str(value)
                    for soft in suspicious_softwares:
                        if soft.lower() in software_found.lower():
                            flags.append("EDITING_SOFTWARE_DETECTED")
                            break
                            
        else:
            # Missing EXIF is not definitive proof of forgery but suspicious for "original" photos
            # However, for web uploads it's common. We'll add a mild flag.
            flags.append("METADATA_STRIPPED")
            
        # Check for Double Quantization (Simplified check)
        # Real double quantization detection requires analyzing DCT coefficients which is complex.
        # Here we look for quantization tables in the info if available or just rely on metadata.
        # This is a placeholder for the advanced check.
        # True double quantization check would be in the DQT tables.
        
        if hasattr(img, 'quantization'):
            # Accessing quantization tables if available (JPEG)
            pass
            
        return {
            "metadata_flags": flags,
            "software": software_found,
            "is_suspicious": len(flags) > 0
        }

    except Exception as e:
        return {"metadata_flags": [], "error": str(e)}
