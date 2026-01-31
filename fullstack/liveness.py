import requests

# URL to download the FaceLandmarker model
model_url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
model_name = "face_landmarker.task"

# Download the model
print(f"Downloading {model_name}...")
response = requests.get(model_url, stream=True)
response.raise_for_status() # Raise an exception for bad status codes

with open(model_name, "wb") as f:
    for chunk in response.iter_content(chunk_size=8192):
        f.write(chunk)

print(f"{model_name} downloaded successfully.")
import cv2
import mediapipe as mp
import numpy as np
import time
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


class LivenessEngine:
    """
    Face liveness detection engine using MediaPipe Face Landmarker.
    Detects blinks and performs anti-spoofing checks.
    """
    
    def __init__(self, model_path='face_landmarker.task'):
        """
        Initialize the liveness detection engine.
        
        Args:
            model_path: Path to the MediaPipe face landmarker model file
        """
        # Configure FaceLandmarker options
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1
        )
        
        # Instantiate FaceLandmarker
        self.face_landmarker = vision.FaceLandmarker.create_from_options(options)
        
        # Eye landmarks for EAR calculation (MediaPipe indices)
        self.LEFT_EYE = [362, 385, 387, 263, 373, 380]
        self.RIGHT_EYE = [33, 160, 158, 133, 153, 144]
        
        # Session state
        self.sessions = {}
        
        # Configurable thresholds
        self.EAR_THRESHOLD = 0.2
        self.VARIANCE_THRESHOLD = 0.00001
        self.HISTORY_LENGTH = 30
        self.REQUIRED_BLINKS = 2
        self.TIME_LIMIT = 10.0
        self.SESSION_TIMEOUT = 15.0
    
    def calculate_ear(self, landmarks, eye_indices):
        """
        Calculate Eye Aspect Ratio (EAR) for blink detection.
        
        Args:
            landmarks: List of NormalizedLandmark objects
            eye_indices: Indices of eye landmarks
            
        Returns:
            float: Eye Aspect Ratio value
        """
        coords = [np.array([landmarks[i].x, landmarks[i].y]) for i in eye_indices]
        
        # EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
        d1 = np.linalg.norm(coords[1] - coords[5])
        d2 = np.linalg.norm(coords[2] - coords[4])
        d3 = np.linalg.norm(coords[0] - coords[3])
        
        if d3 == 0:
            return 0.0
        
        return (d1 + d2) / (2.0 * d3)
    
    def _initialize_session(self, session_id):
        """Initialize a new session for a user."""
        self.sessions[session_id] = {
            "blink_count": 0,
            "last_blink_time": 0,
            "start_time": time.time(),
            "landmarks_history": [],
            "is_closed": False
        }
    
    def process_frame(self, session_id, frame_data):
        """
        Process a video frame for liveness detection.
        
        Args:
            session_id: Unique identifier for the session
            frame_data: BGR image as numpy array
            
        Returns:
            dict: Detection results including status, blink count, and liveness
        """
        # Convert BGR to RGB for MediaPipe
        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=cv2.cvtColor(frame_data, cv2.COLOR_BGR2RGB)
        )
        
        # Perform face landmark detection
        detection_result = self.face_landmarker.detect(mp_image)
        
        # Initialize session if needed
        if session_id not in self.sessions:
            self._initialize_session(session_id)
        
        session = self.sessions[session_id]
        current_time = time.time()
        
        # Check if face is detected
        if not detection_result.face_landmarks:
            return {
                "status": "no_face",
                "blinkCount": session["blink_count"],
                "isLive": False,
                "variance": 0.0,
                "verified": False
            }
        
        # Get landmarks for the first detected face
        landmarks = detection_result.face_landmarks[0]
        
        # 1. Eye Aspect Ratio (EAR) for blink detection
        left_ear = self.calculate_ear(landmarks, self.LEFT_EYE)
        right_ear = self.calculate_ear(landmarks, self.RIGHT_EYE)
        avg_ear = (left_ear + right_ear) / 2.0
        
        # Blink detection
        if avg_ear < self.EAR_THRESHOLD:
            if not session["is_closed"]:
                session["is_closed"] = True
        else:
            if session["is_closed"]:
                session["blink_count"] += 1
                session["last_blink_time"] = current_time
                session["is_closed"] = False
        
        # 2. Anti-spoofing: Track nose tip movement variance
        nose_tip = np.array([landmarks[1].x, landmarks[1].y, landmarks[1].z])
        session["landmarks_history"].append(nose_tip)
        
        # Keep only recent history
        if len(session["landmarks_history"]) > self.HISTORY_LENGTH:
            session["landmarks_history"].pop(0)
        
        # Calculate variance to detect static images
        variance = 0.0
        if len(session["landmarks_history"]) > 10:
            variance = np.var(session["landmarks_history"], axis=0).sum()
        
        is_static = variance < self.VARIANCE_THRESHOLD
        
        # 3. Verification: Check if requirements are met
        time_elapsed = current_time - session["start_time"]
        verified = (
            session["blink_count"] >= self.REQUIRED_BLINKS and 
            time_elapsed <= self.TIME_LIMIT and
            not is_static
        )
        
        # Clean up old sessions
        if time_elapsed > self.SESSION_TIMEOUT:
            self.sessions.pop(session_id)
            return {
                "status": "timeout",
                "blinkCount": session["blink_count"],
                "isLive": not is_static,
                "variance": float(variance),
                "verified": False
            }
        
        return {
            "status": "verified" if verified else "processing",
            "blinkCount": session["blink_count"],
            "isLive": not is_static,
            "variance": float(variance),
            "verified": verified,
            "timeElapsed": time_elapsed,
            "avgEAR": avg_ear
        }
    
    def reset_session(self, session_id):
        """Reset a session's state."""
        if session_id in self.sessions:
            self.sessions.pop(session_id)
    
    def __del__(self):
        """Cleanup resources."""
        if hasattr(self, 'face_landmarker'):
            self.face_landmarker.close()
import cv2


def main():
    """
    Test the liveness detection engine with webcam input.
    Press 'q' to quit, 'r' to reset session.
    """
    # Initialize camera
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not open webcam")
        return

    # Initialize liveness engine
    try:
        engine = LivenessEngine(model_path='face_landmarker.task')
    except Exception as e:
        print(f"Error initializing engine: {e}")
        print("Make sure 'face_landmarker.task' is in the current directory")
        print("Download from: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task")
        cap.release()
        return

    session_id = "test_user_123"

    print("Liveness Detection Started")
    print("Instructions:")
    print("- Look at the camera and blink naturally")
    print("- You need to blink 2 times within 10 seconds")
    print("- Press 'q' to quit")
    print("- Press 'r' to reset session")
    print("-" * 50)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break

        # Process the frame
        result = engine.process_frame(session_id, frame)

        # Determine display color
        if result["verified"]:
            color = (0, 255, 0)  # Green
            status_text = "VERIFIED"
        elif result["status"] == "no_face":
            color = (0, 0, 255)  # Red
            status_text = "NO FACE DETECTED"
        elif result["status"] == "timeout":
            color = (0, 165, 255)  # Orange
            status_text = "TIMEOUT - Press 'r' to retry"
        else:
            color = (255, 255, 0)  # Yellow
            status_text = "PROCESSING"

        # Display information on frame
        cv2.putText(frame, status_text, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

        cv2.putText(frame, f"Blinks: {result['blinkCount']}/2", (10, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        cv2.putText(frame, f"Live: {result['isLive']}", (10, 110),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        cv2.putText(frame, f"Variance: {result['variance']:.6f}", (10, 150),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

        if 'timeElapsed' in result:
            cv2.putText(frame, f"Time: {result['timeElapsed']:.1f}s / 10s", (10, 190),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

        if 'avgEAR' in result:
            cv2.putText(frame, f"EAR: {result['avgEAR']:.3f}", (10, 230),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

        # Show the frame
        cv2.imshow('Liveness Detection', frame)

        # Handle key presses
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            print("Exiting...")
            break
        elif key == ord('r'):
            print("Resetting session...")
            engine.reset_session(session_id)

    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print("Cleanup complete")


if __name__ == "__main__":
    main()