"""
FastAPI application for cricket shot classification using CNN + BiLSTM model.
"""
import os
import ssl
import tempfile
import base64
from pathlib import Path
from typing import Optional, List

# Setup SSL context FIRST, before any imports that might trigger downloads
# This handles SSL certificate verification issues on macOS and other systems
# 
# WARNING: This disables SSL verification - only use in development!
# For production, fix SSL certificates:
#   - macOS: Run 'Install Certificates.command' from Python folder
#   - Or: pip install --upgrade certifi
#   - Or: Set ENABLE_SSL_VERIFY=1 to enable SSL verification
#
# By default, we disable SSL verification for development to avoid certificate issues
if os.getenv("ENABLE_SSL_VERIFY", "0") != "1":
    # Development mode: disable SSL verification to avoid certificate issues
    ssl._create_default_https_context = ssl._create_unverified_context
    print("Note: SSL verification disabled for development (to enable, set ENABLE_SSL_VERIFY=1)")
else:
    print("SSL verification enabled (production mode)")

import numpy as np
import cv2
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from tensorflow import keras

# Load environment variables from .env file
load_dotenv()

from utils.video_utils import extract_frames
from utils.preprocessing import preprocess_frames, get_feature_extractor
from utils.elevenlabs_utils import generate_feedback_message, generate_audio
from pydantic import BaseModel


# Initialize FastAPI app
app = FastAPI(
    title="Pitch-Perfect AI Backend",
    version="1.0"
)

# Configure CORS - allow frontend to access the API
# In production, replace "*" with your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins - adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the loaded model
model: Optional[keras.Model] = None


# Pydantic models for request/response validation
class AudioRequest(BaseModel):
    prediction: str
    confidence: float


class FrameRequest(BaseModel):
    frames: List[str]  # List of base64-encoded images


@app.on_event("startup")
async def load_model():
    """
    Load the Keras model and feature extractor on application startup.
    """
    global model
    
    # Load the main classification model
    app_dir = Path(__file__).parent
    model_path = app_dir / "models" / "cnn_bilstm_binary_classifier.keras"
    
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model file not found at {model_path.absolute()}. "
            "Please ensure the model file is placed in the models/ directory."
        )
    
    try:
        model = keras.models.load_model(str(model_path))
        print(f"Model loaded successfully from {model_path}")
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {str(e)}")
    
    # Load the feature extractor (EfficientNet) at startup to catch errors early
    try:
        print("Loading feature extractor (EfficientNetB0)...")
        get_feature_extractor()
        print("Feature extractor loaded successfully")
    except Exception as e:
        print(f"Warning: Failed to load feature extractor at startup: {str(e)}")
        print("Feature extractor will be loaded on first request (may cause delays)")


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        JSON response with status "ok"
    """
    return {"status": "ok"}


@app.post("/predict")
async def predict(video: UploadFile = File(...)):
    """
    Predict cricket shot classification from uploaded video.
    
    Args:
        video: Uploaded video file (mp4, avi formats)
    
    Returns:
        JSON response with prediction, confidence, and message (no audio)
    """
    # Validate file format
    allowed_formats = [".mp4", ".avi"]
    file_extension = Path(video.filename).suffix.lower()
    
    if file_extension not in allowed_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Allowed formats: {', '.join(allowed_formats)}"
        )
    
    # Create temporary file to save uploaded video
    temp_file = None
    temp_file_path = None
    
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            content = await video.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Extract frames from video
        try:
            frames = extract_frames(temp_file_path, frame_count=8)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Video processing error: {str(e)}")
        
        # Preprocess frames for model
        preprocessed_frames = preprocess_frames(frames, sequence_length=8)
        
        # Run model inference
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        try:
            prediction = model.predict(preprocessed_frames, verbose=0)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model inference error: {str(e)}")
        
        # Extract prediction and confidence
        # Following the starter code approach: model outputs softmax with 2 classes
        # [prob_not_high, prob_high] - use argmax to get class index
        pred_array = np.array(prediction)
        pred_flat = pred_array.flatten()
        
        if len(pred_flat) == 2:
            # Softmax output: [prob_not_high, prob_high]
            # Use argmax to determine class (0 = Not High, 1 = High)
            class_idx = int(np.argmax(pred_flat))
            label = "High" if class_idx == 1 else "Not High"
            # Confidence is the maximum probability
            confidence = float(np.max(pred_flat))
        elif len(pred_flat) == 1:
            # Sigmoid output: single probability value
            high_probability = float(pred_flat[0])
            label = "High" if high_probability >= 0.5 else "Not High"
            confidence = high_probability if high_probability >= 0.5 else 1.0 - high_probability
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected model output shape: {prediction.shape}"
            )
        
        # Round confidence to 3 decimal places
        confidence = round(confidence, 3)
        
        # Generate feedback message (text only, no audio)
        message = generate_feedback_message(label, confidence)
        
        # Return response without audio
        return JSONResponse(content={
            "prediction": label,
            "confidence": confidence,
            "message": message
        })
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        # Handle general exceptions
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                print(f"Warning: Failed to delete temporary file: {e}")


@app.post("/generate-audio")
async def generate_audio_endpoint(request: AudioRequest):
    """
    Generate audio feedback from prediction and confidence.
    
    Args:
        request: AudioRequest with prediction and confidence
    
    Returns:
        JSON response with message and audio_base64
    """
    # Validate prediction label
    if request.prediction not in ["High", "Not High"]:
        raise HTTPException(
            status_code=400,
            detail="Prediction must be either 'High' or 'Not High'"
        )
    
    # Validate confidence range
    if not 0.0 <= request.confidence <= 1.0:
        raise HTTPException(
            status_code=400,
            detail="Confidence must be between 0.0 and 1.0"
        )
    
    try:
        # Generate feedback message
        message = generate_feedback_message(request.prediction, request.confidence)
        
        # Generate audio
        audio_base64 = generate_audio(message)
        
        # Return response
        return JSONResponse(content={
            "message": message,
            "audio_base64": audio_base64
        })
    
    except Exception as e:
        # Handle ElevenLabs API errors
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate audio: {str(e)}"
        )


def decode_base64_image(image_base64: str) -> np.ndarray:
    """
    Decode a base64-encoded image to a numpy array.
    
    Args:
        image_base64: Base64-encoded image string (with or without data URL prefix)
    
    Returns:
        NumPy array of the image in RGB format (224x224x3)
    """
    try:
        # Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_base64)
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode image using OpenCV
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image")
        
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize to 224x224
        img_resized = cv2.resize(img_rgb, (224, 224))
        
        return img_resized
    
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")


@app.post("/predict-live")
async def predict_live(request: FrameRequest):
    """
    Predict cricket shot classification from live camera frames.
    
    This endpoint accepts multiple frames (preferably 8) as base64-encoded images
    and returns predictions for real-time feedback.
    
    Args:
        request: FrameRequest with list of base64-encoded frame images
    
    Returns:
        JSON response with prediction, confidence, and message (no audio)
    """
    try:
        # Validate that we have at least one frame
        if not request.frames or len(request.frames) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one frame is required"
            )
        
        # Decode all frames
        decoded_frames = []
        for i, frame_base64 in enumerate(request.frames):
            try:
                frame = decode_base64_image(frame_base64)
                decoded_frames.append(frame)
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to decode frame {i + 1}: {str(e)}"
                )
        
        # Preprocess frames for model (extracts features using EfficientNet)
        try:
            preprocessed_frames = preprocess_frames(decoded_frames, sequence_length=8)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Frame preprocessing error: {str(e)}"
            )
        
        # Run model inference
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        try:
            prediction = model.predict(preprocessed_frames, verbose=0)
        except Exception as e:
            error_msg = str(e)
            # Provide more helpful error message for shape mismatches
            if "Invalid input shape" in error_msg or "incompatible shape" in error_msg:
                raise HTTPException(
                    status_code=500,
                    detail=f"Model input shape error: The model received data with incompatible shape. "
                           f"Expected features of size 1294 per frame. Error details: {error_msg}"
                )
            raise HTTPException(status_code=500, detail=f"Model inference error: {error_msg}")
        
        # Extract prediction and confidence
        # Following the starter code approach: model outputs softmax with 2 classes
        # [prob_not_high, prob_high] - use argmax to get class index
        pred_array = np.array(prediction)
        pred_flat = pred_array.flatten()
        
        if len(pred_flat) == 2:
            # Softmax output: [prob_not_high, prob_high]
            # Use argmax to determine class (0 = Not High, 1 = High)
            class_idx = int(np.argmax(pred_flat))
            label = "High" if class_idx == 1 else "Not High"
            # Confidence is the maximum probability
            confidence = float(np.max(pred_flat))
        elif len(pred_flat) == 1:
            # Sigmoid output: single probability value
            high_probability = float(pred_flat[0])
            label = "High" if high_probability >= 0.5 else "Not High"
            confidence = high_probability if high_probability >= 0.5 else 1.0 - high_probability
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected model output shape: {prediction.shape}"
            )
        
        # Round confidence to 3 decimal places
        confidence = round(confidence, 3)
        
        # Generate feedback message (text only, no audio)
        message = generate_feedback_message(label, confidence)
        
        # Return response without audio
        return JSONResponse(content={
            "prediction": label,
            "confidence": confidence,
            "message": message
        })
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        # Handle general exceptions
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

