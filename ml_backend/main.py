"""
R.E.S.Q. Fire Detection API
FastAPI backend for YOLOv8 fire detection inference
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import base64
import torch
from ultralytics import YOLO
import os
from datetime import datetime
import binascii
from urllib.parse import urlparse, urlunparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# Load YOLOv8 model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")
model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the model
    global model
    try:
        if os.path.exists(MODEL_PATH):
            # Fix for PyTorch 2.6+ security change
            # Add safe globals for ultralytics model loading
            try:
                from ultralytics.nn.tasks import DetectionModel
                torch.serialization.add_safe_globals([DetectionModel])
            except:
                pass
            
            model = YOLO(MODEL_PATH)
            print(f"✅ Model loaded successfully from {MODEL_PATH}")
            print(f"📋 Model classes: {model.names}")
        else:
            print(f"⚠️ Model file not found at {MODEL_PATH}")
            print("Please copy best.pt to the ml_backend folder")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        # Try alternative loading method
        try:
            print("🔄 Trying alternative loading method...")
            # Force weights_only=False for older model files
            original_load = torch.load
            torch.load = lambda *args, **kwargs: original_load(*args, **{**kwargs, 'weights_only': False})
            model = YOLO(MODEL_PATH)
            torch.load = original_load
            print(f"✅ Model loaded successfully with alternative method")
            print(f"📋 Model classes: {model.names}")
        except Exception as e2:
            print(f"❌ Alternative loading also failed: {e2}")
    
    yield  # Server is running
    
    # Shutdown: Cleanup if needed
    print("Shutting down...")

app = FastAPI(
    title="R.E.S.Q. Fire Detection API",
    description="YOLOv8-based fire detection for the R.E.S.Q. monitoring system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "R.E.S.Q. Fire Detection API",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy" if model else "degraded",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
        "model_exists": os.path.exists(MODEL_PATH)
    }

def run_detection(image):
    results = model(image, verbose=False)

    detections = []
    highest_confidence = 0.0
    fire_detected = False

    for result in results:
        boxes = result.boxes
        if boxes is not None:
            for box in boxes:
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = model.names[class_id] if hasattr(model, 'names') else f"class_{class_id}"

                x1, y1, x2, y2 = box.xyxy[0].tolist()

                detection = {
                    "class": class_name,
                    "confidence": confidence,
                    "bbox": {
                        "x1": int(x1),
                        "y1": int(y1),
                        "x2": int(x2),
                        "y2": int(y2),
                        "width": int(x2 - x1),
                        "height": int(y2 - y1)
                    }
                }
                detections.append(detection)

                if class_name.lower() in ["fire", "flame", "smoke", "0"]:
                    if confidence > highest_confidence:
                        highest_confidence = confidence
                    if confidence >= 0.30:
                        fire_detected = True

    return {
        "success": True,
        "fire_detected": fire_detected,
        "highest_confidence": highest_confidence,
        "detection_count": len(detections),
        "detections": detections,
        "threshold": 0.90,
        "image_size": {
            "width": image.shape[1],
            "height": image.shape[0]
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/detect/base64")
def detect_fire_base64(data: dict):
    """
    Detect fire from a base64-encoded image
    
    Expected payload:
    {
        "image": "base64_encoded_image_string"
    }
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please check server logs.")
    
    image_data = data.get("image")

    if not image_data:
        raise HTTPException(status_code=400, detail="Image payload is required.")

    if "," in image_data:
        image_data = image_data.split(",")[1]

    try:
        image_bytes = base64.b64decode(image_data)
    except binascii.Error as decode_error:
        raise HTTPException(status_code=400, detail="Invalid base64 image data.") from decode_error

    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image format")

    return run_detection(image)

@app.post("/detect/url")
def detect_fire_url(data: dict):
    """
    Detect fire from an image URL (ESP32-CAM stream or snapshot)

    Expected payload:
    {
        "url": "http://<esp32-ip>:81/stream"
    }
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please check server logs.")

    url = data.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required.")
    if not url.lower().startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    parsed_url = urlparse(url)
    normalized_path = parsed_url.path.rstrip("/")
    if normalized_path.lower().endswith("/stream"):
        parsed_url = parsed_url._replace(path=normalized_path[: -len("/stream")] + "/capture")
        url = urlunparse(parsed_url)

    try:
        request = Request(url, headers={
            "User-Agent": "RESQ-Fire-Detector/1.0",
            "Accept": "image/jpeg,image/*;q=0.9,*/*;q=0.8",
            "Connection": "close",
            "ngrok-skip-browser-warning": "true",
        })
        with urlopen(request, timeout=5) as response:
            image_bytes = response.read()
    except HTTPError as http_error:
        raise HTTPException(status_code=502, detail=f"URL returned HTTP {http_error.code}.") from http_error
    except URLError as url_error:
        reason = getattr(url_error, "reason", "unknown error")
        raise HTTPException(status_code=502, detail=f"Unable to fetch image: {reason}") from url_error
    except Exception as unexpected_error:
        detail = f"Unable to fetch image from snapshot URL: {type(unexpected_error).__name__}"
        raise HTTPException(status_code=502, detail=detail) from unexpected_error

    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image content from URL.")

    return run_detection(image)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
