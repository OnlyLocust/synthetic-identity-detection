from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np
import base64
import json
import random
import time
from liveness import LivenessEngine, LivenessState

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Engine
liveness_engine = LivenessEngine()

def base64_to_image(base64_string):
    if "base64," in base64_string:
        base64_string = base64_string.split("base64,")[1]
    image_bytes = base64.b64decode(base64_string)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image

@app.websocket("/ws/liveness")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Reset session on new connection
    liveness_engine.session.reset(challenge_type="BLINK")
    
    try:
        while True:
            data = await websocket.receive_text()
            # Expecting JSON: { "image": "base64...", "command": "start" }
            payload = json.loads(data)
            
            if "image" in payload:
                frame = base64_to_image(payload["image"])
                
                # Check Face & Liveness
                result, remaining = liveness_engine.process_frame(frame)
                
                # Build Response
                state = liveness_engine.session.state.value
                challenge = liveness_engine.session.challenge_type
                
                response = {
                    "state": state,
                    "challenge": challenge,
                    "remaining_time": remaining,
                    "verified": liveness_engine.session.verified
                }
                
                await websocket.send_json(response)
                
                # If success, we might want to automatically close or wait for client to disconnect
                if state == "SUCCESS" or state == "FAILED":
                    # Keep connection open for client to handle the transition
                    pass

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

@app.post("/api/age-detect")
async def detect_age():
    # Simulation of Age Detection Model (e.g., DeepFace)
    # in a real app, we would process the last valid frame
    time.sleep(1.0) # Simulate processing
    
    # Mock return
    visual_age = random.randint(25, 45) # Mock for demo
    confidence = round(random.uniform(0.85, 0.99), 2)
    
    return {
        "visual_age": visual_age,
        "age_range": [visual_age - 3, visual_age + 3],
        "confidence": confidence,
        "model": "Simulated_DeepAge_V2"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
