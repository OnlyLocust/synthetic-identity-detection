import requests
import os
import sys

def test_api():
    url = "http://localhost:8000/api/v1/verify-document"
    
    # Create a dummy image for testing if one doesn't exist
    test_image_path = "test_image.jpg"
    if not os.path.exists(test_image_path):
        from PIL import Image, ImageDraw
        img = Image.new('RGB', (100, 100), color = 'red')
        img.save(test_image_path)
        print(f"Created temporary test image: {test_image_path}")

    try:
        files = {'file': open(test_image_path, 'rb')}
        response = requests.post(url, files=files)
        
        print(f"Status Code: {response.status_code}")
        print("Response JSON:")
        print(response.json())
        
        if response.status_code == 200:
            print("SUCCESS: API call worked.")
        else:
            print("FAILURE: API call failed.")
            
    except Exception as e:
        print(f"Error calling API: {e}")
    finally:
        if os.path.exists(test_image_path) and "test_image.jpg" in test_image_path:
            # os.remove(test_image_path) 
            pass # Keep it for debugging for now

if __name__ == "__main__":
    test_api()
