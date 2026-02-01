import cv2
import mediapipe as mp
import time
import math
import numpy as np
from collections import deque
from enum import Enum
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

class LivenessState(Enum):
    WAITING = "WAITING"
    CHALLENGE_ACTIVE = "CHALLENGE_ACTIVE"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class LivenessSession:
    """Manages the state and data for a single liveness detection session."""
    def __init__(self, challenge_type="BLINK", time_limit=10.0):
        self.state = LivenessState.WAITING
        self.challenge_type = challenge_type  # BLINK, NOD, TURN
        self.start_time = time.time()
        self.time_limit = time_limit
        
        # Counters and data
        self.blink_count = 0
        self.blink_frames = 0
        self.is_blink_active = False
        
        # Pose data
        self.last_yaw = 0.0
        self.last_pitch = 0.0
        self.last_ear = 0.0
        
        # Buffers for smoothing
        self.yaw_buffer = deque(maxlen=5)
        self.pitch_buffer = deque(maxlen=5)
        self.ear_buffer = deque(maxlen=5)
        
        self.verified = False

    def reset(self, challenge_type=None):
        """Explicitly reset all state variables."""
        if challenge_type:
            self.challenge_type = challenge_type
        self.state = LivenessState.WAITING
        self.start_time = time.time()
        self.blink_count = 0
        self.blink_frames = 0
        self.is_blink_active = False
        self.last_yaw = 0.0
        self.last_pitch = 0.0
        self.last_ear = 0.0
        self.yaw_buffer.clear()
        self.pitch_buffer.clear()
        self.ear_buffer.clear()
        self.verified = False
        print(f"Session Reset: Challenge set to {self.challenge_type}")

class LivenessEngine:
    """
    Enhanced liveness detection engine using MediaPipe.
    """
    def __init__(self, model_path='face_landmarker.task'):
        # Initialize MediaPipe Face Landmarker
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=True,
            num_faces=1
        )
        self.face_landmarker = vision.FaceLandmarker.create_from_options(options)
        
        # Eye indices (MediaPipe)
        # Left Eye EAR indices: outer, top1, top2, inner, bottom1, bottom2
        self.LEFT_EYE = [362, 385, 387, 263, 373, 380]
        # Right Eye EAR indices: outer, top1, top2, inner, bottom1, bottom2
        self.RIGHT_EYE = [33, 160, 158, 133, 153, 144]
        
        # Detection Thresholds
        self.EAR_THRESHOLD = 0.20
        self.POSE_THRESHOLD = 15.0  # Degrees
        self.DEBOUNCE_FRAMES = 2    # Min frames to count as blink
        
        self.session = LivenessSession()

    def calculate_ear(self, landmarks):
        """Calculate Eye Aspect Ratio (EAR)."""
        def eye_ear(eye_indices):
            p = [landmarks[i] for i in eye_indices]
            # p[0]=outer, p[1]=top1, p[2]=top2, p[3]=inner, p[4]=bottom1, p[5]=bottom2
            vertical1 = math.sqrt((p[1].x - p[5].x)**2 + (p[1].y - p[5].y)**2)
            vertical2 = math.sqrt((p[2].x - p[4].x)**2 + (p[2].y - p[4].y)**2)
            horizontal = math.sqrt((p[0].x - p[3].x)**2 + (p[0].y - p[3].y)**2)
            return (vertical1 + vertical2) / (2.0 * horizontal + 1e-6)

        left_ear = eye_ear(self.LEFT_EYE)
        right_ear = eye_ear(self.RIGHT_EYE)
        return (left_ear + right_ear) / 2.0

    def extract_pose(self, matrix):
        """Extract Yaw and Pitch from transformation matrix."""
        # MediaPipe matrix is 4x4. Rotation is the top-left 3x3.
        # r20 = -sin(yaw)
        yaw = -math.asin(matrix[0, 2])
        # r21 = sin(pitch) * cos(yaw)
        pitch = math.atan2(matrix[1, 2], matrix[2, 2])
        return math.degrees(yaw), math.degrees(pitch)

    def process_frame(self, frame):
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        result = self.face_landmarker.detect(mp_image)
        
        if not result.face_landmarks:
            return None, "NO_FACE"

        landmarks = result.face_landmarks[0]
        
        # Get Pose
        yaw, pitch = 0.0, 0.0
        if result.facial_transformation_matrixes:
            yaw, pitch = self.extract_pose(result.facial_transformation_matrixes[0])
        
        # Get EAR
        ear = self.calculate_ear(landmarks)
        
        # Smooth values using buffers
        self.session.ear_buffer.append(ear)
        self.session.yaw_buffer.append(yaw)
        self.session.pitch_buffer.append(pitch)
        
        smooth_ear = sum(self.session.ear_buffer) / len(self.session.ear_buffer)
        smooth_yaw = sum(self.session.yaw_buffer) / len(self.session.yaw_buffer)
        smooth_pitch = sum(self.session.pitch_buffer) / len(self.session.pitch_buffer)
        
        self.session.last_ear = smooth_ear
        self.session.last_yaw = smooth_yaw
        self.session.last_pitch = smooth_pitch
        
        # State Machine Logic
        current_time = time.time()
        elapsed = current_time - self.session.start_time
        remaining = max(0, self.session.time_limit - elapsed)

        if self.session.state == LivenessState.WAITING:
            self.session.state = LivenessState.CHALLENGE_ACTIVE
            self.session.start_time = current_time
            
        elif self.session.state == LivenessState.CHALLENGE_ACTIVE:
            if remaining <= 0:
                self.session.state = LivenessState.FAILED
            else:
                self.verify_challenge(smooth_ear, smooth_yaw, smooth_pitch)
                if self.session.verified:
                    self.session.state = LivenessState.SUCCESS

        return result, remaining

    def verify_challenge(self, ear, yaw, pitch):
        s = self.session
        if s.challenge_type == "BLINK":
            if ear < self.EAR_THRESHOLD:
                s.blink_frames += 1
                if s.blink_frames >= self.DEBOUNCE_FRAMES and not s.is_blink_active:
                    s.is_blink_active = True
            else:
                if s.is_blink_active:
                    s.blink_count += 1
                    s.is_blink_active = False
                s.blink_frames = 0
            
            if s.blink_count >= 2:
                s.verified = True

        elif s.challenge_type == "TURN":
            # Success if yaw exceeds threshold (Look Left/Right)
            if abs(yaw) > self.POSE_THRESHOLD:
                s.verified = True
                
        elif s.challenge_type == "NOD":
            # Success if pitch exceeds threshold (Look Up/Down)
            if abs(pitch) > self.POSE_THRESHOLD:
                s.verified = True

def main():
    cap = cv2.VideoCapture(0)
    engine = LivenessEngine()
    
    challenges = ["BLINK", "NOD", "TURN"]
    current_idx = 0
    engine.session.reset(challenge_type=challenges[current_idx])

    print("Advanced Liveness Detection Started")
    print("Press 'q' to quit, 'r' to rotate challenge and reset")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        frame = cv2.flip(frame, 1) # Mirror
        detection, remaining = engine.process_frame(frame)
        session = engine.session
        
        # UI Rendering
        h, w, _ = frame.shape
        color = (0, 255, 0) if session.state == LivenessState.SUCCESS else (0, 0, 255) if session.state == LivenessState.FAILED else (255, 165, 0)
        
        # Title and State
        cv2.putText(frame, f"STATE: {session.state.value}", (20, 40), cv2.FONT_HERSHEY_DUPLEX, 0.8, color, 2)
        cv2.putText(frame, f"TASK: {session.challenge_type}", (20, 80), cv2.FONT_HERSHEY_DUPLEX, 0.8, (255, 255, 255), 2)
        
        # Progress & Timer
        if session.state == LivenessState.CHALLENGE_ACTIVE:
            timer_color = (0, 0, 255) if remaining < 3 else (255, 255, 255)
            cv2.putText(frame, f"Time Left: {remaining:.1f}s", (w - 200, 40), cv2.FONT_HERSHEY_DUPLEX, 0.7, timer_color, 2)
            
            if session.challenge_type == "BLINK":
                cv2.putText(frame, f"Blinks: {session.blink_count}/2", (20, 120), cv2.FONT_HERSHEY_DUPLEX, 0.7, (200, 200, 200), 2)
            else:
                cv2.putText(frame, "Awaiting Movement...", (20, 120), cv2.FONT_HERSHEY_DUPLEX, 0.7, (200, 200, 200), 2)

        # Debug Corner
        debug_rect = (w - 210, h - 110, 200, 100)
        cv2.rectangle(frame, (debug_rect[0], debug_rect[1]), (debug_rect[0] + debug_rect[2], debug_rect[1] + debug_rect[3]), (0, 0, 0), -1)
        cv2.putText(frame, f"EAR: {session.last_ear:.3f}", (w - 200, h - 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        cv2.putText(frame, f"Yaw: {session.last_yaw:.1f}", (w - 200, h - 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        cv2.putText(frame, f"Pitch: {session.last_pitch:.1f}", (w - 200, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

        cv2.imshow('Liveness Detection Refactored', frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('r'):
            current_idx = (current_idx + 1) % len(challenges)
            engine.session.reset(challenge_type=challenges[current_idx])

    cap.release()
    cv2.destroyAllWindows()
    print("Session Ended.")

if __name__ == "__main__":
    main()