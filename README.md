# Pitch-Perfect Codebase - Complete Explanation

## Project Overview

**Pitch-Perfect** (also called **CricVision**) is a real-time cricket action recognition system that uses AI to analyze cricket shots from live camera feed. It classifies shots as **"High"** (good shot) or **"Not High"** (needs improvement) and provides voice feedback to players.

### What the System Does:
1. **Captures live video** from webcam
2. **Detects player pose** using TensorFlow.js
3. **Sends video frames** to backend AI model
4. **Classifies cricket shot** as "High" or "Not High"
5. **Displays predictions** with confidence scores
6. **Provides voice feedback** using ElevenLabs TTS
7. **Shows real-time confidence graph** (ECG-style)

---

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│   Frontend      │────────▶│    Backend       │
│  (React/TS)     │  HTTP   │  (FastAPI/Python)│
│                 │◀────────│                  │
└─────────────────┘         └──────────────────┘
      │                             │
      │                             │
      ▼                             ▼
┌─────────────────┐         ┌──────────────────┐
│  Web Camera     │         │  CNN+BiLSTM Model│
│  Pose Detection │         │  EfficientNet    │
│  (TensorFlow.js)│         │  Feature Extract │
└─────────────────┘         └──────────────────┘
```

---

##  Backend Components (Python/FastAPI)

### 1. **Main Application (`backend/app.py`)**

The FastAPI backend serves as the core API server:

#### **Key Components:**

**a) Model Loading (`load_model()` function)**
- Loads the pre-trained Keras model: `cnn_bilstm_binary_classifier.keras`
- Model path: `backend/models/cnn_bilstm_binary_classifier.keras`
- This model combines:
  - **CNN (Convolutional Neural Network)**: Extracts spatial features from video frames
  - **BiLSTM (Bidirectional LSTM)**: Processes temporal sequences (the 8-frame sequence)
- Loaded once at startup using `@app.on_event("startup")`

**b) Feature Extractor Initialization**
- Loads EfficientNetB0 model for feature extraction
- EfficientNet extracts 1280 features per frame
- Combined with 14 statistical features = **1294 total features** per frame

#### **API Endpoints:**

**1. `/health` (GET)**
- Health check endpoint
- Returns: `{"status": "ok"}`

**2. `/predict` (POST)**
- Accepts uploaded video file (MP4/AVI)
- Processes video for classification
- **Workflow:**
  1. Validates video format
  2. Saves to temporary file
  3. Extracts 8 evenly distributed frames using `extract_frames()`
  4. Preprocesses frames using `preprocess_frames()`
  5. Runs model inference
  6. Returns prediction + confidence + message
- **Returns:** `{prediction: "High"/"Not High", confidence: 0.0-1.0, message: string}`

**3. `/predict-live` (POST)**
- Accepts base64-encoded image frames from frontend
- Real-time prediction endpoint for live camera feed
- **Input:** `{frames: ["base64_string1", "base64_string2", ...]}`
- **Workflow:**
  1. Decodes base64 images to numpy arrays
  2. Preprocesses frames (resize to 224x224, RGB conversion)
  3. Extracts features using EfficientNet
  4. Runs model inference
  5. Returns prediction
- **Returns:** Same as `/predict`

**4. `/generate-audio` (POST)**
- Generates audio feedback using ElevenLabs TTS
- **Input:** `{prediction: "High"/"Not High", confidence: 0.0-1.0}`
- **Workflow:**
  1. Generates feedback message based on prediction and confidence
  2. Calls ElevenLabs API to convert text to speech
  3. Returns base64-encoded audio
- **Returns:** `{message: string, audio_base64: string}`

---

### 2. **Video Processing (`backend/utils/video_utils.py`)**

**`extract_frames(video_path, frame_count=8)`**
- Opens video file using OpenCV
- Extracts evenly distributed frames across video duration
- Resizes frames to 224x224 pixels (model input size)
- Converts BGR to RGB (OpenCV uses BGR, model needs RGB)
- Returns list of numpy arrays: `[(224, 224, 3), (224, 224, 3), ...]`

**Frame Selection Logic:**
- If video has ≤8 frames: extracts all frames
- If video has >8 frames: calculates evenly spaced frame indices
  - Example: For 100 frames, extracts frames at indices: [0, 12, 25, 37, 50, 62, 75, 87]

---

### 3. **Preprocessing (`backend/utils/preprocessing.py`)**

This is where the magic happens! Converts raw video frames into model-ready features.

#### **Key Functions:**

**a) `get_feature_extractor()`**
- Creates/loads EfficientNetB0 model
- **EfficientNetB0** is a lightweight CNN pre-trained on ImageNet
- Configuration:
  - Input: 224x224x3 images
  - Output: 1280 features per frame (global average pooling)
  - Weights: ImageNet pre-trained (downloaded automatically)

**b) `extract_features_from_frames(frames)`**
- **Input:** Array of frames `(n_frames, 224, 224, 3)`
- **Process:**
  1. Preprocesses frames for EfficientNet (normalization)
  2. Passes through EfficientNet → outputs `(n_frames, 1280)`
  3. Extracts additional statistical features from each frame:
     - Mean RGB (3 features)
     - Std RGB (3 features)
     - Brightness (1 feature)
     - Contrast (1 feature)
     - Edge density (1 feature)
     - Min RGB (3 features)
     - Max RGB (2 features) = **14 additional features**
  4. Combines: 1280 (EfficientNet) + 14 (stats) = **1294 features per frame**
- **Output:** `(n_frames, 1294)`

**c) `preprocess_frames(frames, sequence_length=8)`**
- **Main preprocessing pipeline:**
  1. Ensures exactly 8 frames:
     - If <8 frames: pads by repeating last frame
     - If >8 frames: takes last 8 frames
  2. Extracts features using `extract_features_from_frames()`
  3. Adds batch dimension: `(1, 8, 1294)`
     - Batch size = 1 (single prediction)
     - Sequence length = 8 (temporal dimension)
     - Features = 1294 (spatial features per frame)
- **Output:** `(1, 8, 1294)` - Ready for BiLSTM model

---

### 4. **Audio Generation (`backend/utils/elevenlabs_utils.py`)**

**`generate_feedback_message(label, confidence)`**
- Generates contextual coaching messages based on:
  - **Label:** "High" or "Not High"
  - **Confidence:** 0.0 to 1.0
- **Message Logic:**
  - **High + High Confidence (>0.85)**: "Outstanding shot! That's world class technique!"
  - **High + Medium (0.7-0.85)**: "Great shot! Very well executed. Focus on..."
  - **High + Lower (0.6-0.7)**: "Good attempt! You're showing excellent form. Next time..."
  - **Not High + High Conf (>0.6)**: "Almost there! Your timing needs work..."
  - **Not High + Medium (0.4-0.6)**: "Needs improvement. Work on your timing..."
  - **Not High + Low (<0.4)**: "Practice makes perfect! Focus on balance..."
- Returns random variation from appropriate message set

**`generate_audio(message, voice="Clyde")`**
- Calls ElevenLabs TTS API
- Converts text message to speech audio
- Uses voice: "Clyde" (configurable)
- Model: `eleven_multilingual_v2`
- Returns base64-encoded audio (MP3 format)

---

## Frontend Components (React/TypeScript)

### 1. **Application Structure**

```
src/
├── App.tsx                 # Main router
├── main.tsx                # Entry point
├── pages/
│   ├── LandingPage.tsx     # Home/landing page
│   ├── ApplicationPage.tsx # Main application (camera + predictions)
│   └── AnalysisPage.tsx    # Analysis dashboard (placeholder)
├── components/
│   ├── CameraFeed.tsx      # Camera capture component
│   ├── ActionDisplay.tsx   # Prediction display + ECG chart
│   ├── PoseOverlay.tsx     # Skeleton overlay on video
│   └── ...
├── services/
│   ├── api.ts              # Backend API client
│   ├── poseDetection.ts    # TensorFlow.js pose detection
│   └── ttsService.ts       # Text-to-speech service
└── utils/
    └── frameBuffer.ts      # Frame buffering + motion detection
```

---

### 2. **Main Pages**

#### **a) Landing Page (`pages/LandingPage.tsx`)**
- Homepage with hero section
- Navigation to main app
- About modal
- 5-second loading animation when navigating to app

#### **b) Application Page (`pages/ApplicationPage.tsx`)** - **Main Component!**

This is the core of the application. Here's how it works:

**State Management:**
- `isCameraActive`: Whether camera is running
- `prediction`: Current prediction result
- `isProcessing`: Whether prediction is in progress
- `confidenceHistory`: Array of confidence values over time (for ECG chart)
- `keypoints`: Detected pose keypoints
- `audioTranscript`: Current audio feedback text

**Key Features:**

**1. Frame Capture Loop:**
```typescript
const handleFrameCapture = async (video) => {
  // Throttle to 5 FPS (200ms intervals)
  // Buffer frames (need 8 frames)
  // Detect motion
  // Send to backend when buffer ready
}
```

**2. Frame Buffer:**
- Uses `FrameBuffer` utility class
- Collects 8 frames over time (200ms intervals)
- Detects motion between frames
- Only triggers prediction when:
  - Buffer has 8 frames AND
  - Significant motion detected (>15% pixel change)

**3. Prediction Flow:**
1. Frame captured → Added to buffer
2. Buffer checks: Has 8 frames + motion?
3. If yes → Send to `/predict-live` endpoint
4. Backend processes → Returns prediction
5. Update UI: Display prediction + confidence
6. Add to confidence history (for chart)
7. Generate audio feedback (if action changed)

**4. Voice Feedback:**
- Only speaks when prediction changes (not every frame)
- Calls `/generate-audio` endpoint
- Falls back to browser TTS if backend fails

**5. Layout:**
- **Left 2/3:** Camera feed + pose overlay
- **Right 1/3:** Prediction display + audio transcript

---

### 3. **Camera Feed Component (`components/CameraFeed.tsx`)**

**Responsibilities:**
- Access webcam using `getUserMedia()`
- Display video feed (mirrored)
- Capture frames periodically
- Run pose detection (TensorFlow.js)

**Key Logic:**

**a) Camera Initialization:**
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: 1280, height: 720, facingMode: 'user' }
});
```

**b) Frame Capture Loop:**
- Uses `requestAnimationFrame()` for smooth 60 FPS rendering
- Calls `onFrameCapture` callback for prediction frames
- Runs pose detection at 10 FPS (100ms intervals)

**c) Pose Detection:**
- Initializes TensorFlow.js pose detector (MoveNet Lightning)
- Detects pose every 100ms
- Passes keypoints to parent via `onPoseDetected` callback

---

### 4. **Action Display Component (`components/ActionDisplay.tsx`)**

**Displays:**
1. **Current Prediction:** "High" or "Not High" (large text)
2. **Confidence Percentage:** 0-100%
3. **ECG-style Chart:** Real-time confidence over time

**Chart Features:**
- Uses Recharts library
- Line chart showing confidence history
- Area fill with gradient (green for "High", orange for "Not High")
- Updates in real-time as new predictions come in
- X-axis: Time points (sequential)
- Y-axis: Confidence percentage (0-100%)

**Visual States:**
- **High + High Conf:** Green gradient
- **High + Low Conf:** Orange/yellow
- **Not High:** Orange gradient

---

### 5. **API Service (`services/api.ts`)**

**Functions:**

**a) `healthCheck()`**
- Checks if backend is available
- GET `/health`

**b) `predictLive(frames: string[])`**
- Sends 8 base64-encoded frames to backend
- POST `/predict-live`
- Ensures exactly 8 frames (pads if needed)
- Returns: `{prediction, confidence, message}`

**c) `generateAudio(prediction, confidence)`**
- Requests audio generation from backend
- POST `/generate-audio`
- Returns: `{message, audio_base64}`

---

### 6. **Pose Detection Service (`services/poseDetection.ts`)**

**Uses TensorFlow.js Pose Detection API**

**Model Hierarchy (Fallback):**
1. **MoveNet Lightning** (primary) - Fastest, lightweight
2. **MoveNet Thunder** (fallback) - More accurate
3. **BlazePose Lite** (final fallback) - Most compatible

**Functions:**
- `initializePoseDetector()`: Loads model
- `detectPose(video)`: Detects pose in video frame
  - Returns keypoints with normalized coordinates (0-1)
  - Each keypoint: `{x, y, visibility, name}`
- `disposePoseDetector()`: Cleanup

**Keypoints Detected:**
- Nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles
- 17 keypoints total (MoveNet)

---

### 7. **Frame Buffer Utility (`utils/frameBuffer.ts`)**

**Purpose:** Buffer video frames before sending to backend

**Features:**

**a) Motion Detection:**
- Calculates pixel difference between consecutive frames
- Detects if >15% of pixels changed (configurable threshold)
- Prevents unnecessary API calls when camera is static

**b) Frame Buffering:**
- Maintains exactly 8 frames in buffer
- Adds frames at 200ms intervals (throttled)
- When buffer full + motion detected → ready for prediction

**c) Methods:**
- `addFrame(video)`: Capture frame, add to buffer, check motion
  - Returns `true` if buffer ready (8 frames + motion)
- `getFrames()`: Returns array of base64-encoded frames
- `clear()`: Reset buffer
- `resetMotionFlag()`: Reset motion detection (after prediction sent)

**Motion Calculation:**
```typescript
// Converts to grayscale
// Compares pixel values
// Counts pixels that changed >30 units (RGB scale 0-255)
// Returns percentage of changed pixels
```

---

### 8. **TTS Service (`services/ttsService.ts`)**

**Text-to-Speech Integration**

**Functions:**

**a) `speakActionFeedback(action, confidence, message)`**
- **Primary:** Calls backend `/generate-audio` endpoint
- **Fallback:** Browser `speechSynthesis` API if backend fails
- Prevents overlapping audio (stops current if new starts)

**b) `playAudioFromBase64(audio_base64)`**
- Decodes base64 to binary
- Creates Blob → Audio element
- Plays audio
- Cleans up after playback

**c) `stopAudio()`**
- Stops any playing audio
- Cancels browser TTS

---

##  AI Model Architecture

### **Model: CNN + BiLSTM Binary Classifier**

**Input Shape:** `(batch_size, 8, 1294)`
- **8:** Sequence length (8 video frames)
- **1294:** Features per frame

**Architecture Flow:**

1. **Feature Extraction (per frame):**
   - EfficientNetB0 extracts 1280 features
   - Statistical features add 14 more
   - Total: 1294 features per frame

2. **Temporal Processing (BiLSTM):**
   - Processes sequence of 8 frames
   - BiLSTM understands motion/timing patterns
   - Captures temporal relationships between frames

3. **Classification:**
   - Output: 2 classes (softmax) OR 1 probability (sigmoid)
   - Classes: "Not High" (0) vs "High" (1)

**Model File:**
- Location: `backend/models/cnn_bilstm_binary_classifier.keras`
- Format: Keras SavedModel format
- Loaded at server startup

---

##  Complete Data Flow

### **Live Camera Prediction Flow:**

```
1. User clicks "Start Camera"
   ↓
2. CameraFeed component accesses webcam
   ↓
3. Video stream starts → Display on screen
   ↓
4. Frame capture loop (60 FPS):
   - Every frame: Check if pose detection needed (100ms intervals)
   - Every frame: Capture for prediction buffer (200ms intervals)
   ↓
5. FrameBuffer.addFrame():
   - Convert frame to base64
   - Detect motion vs previous frame
   - Add to buffer (max 8 frames)
   ↓
6. When buffer ready (8 frames + motion detected):
   ↓
7. ApplicationPage sends frames to backend:
   POST /predict-live {frames: [base64...]}
   ↓
8. Backend receives frames:
   - Decode base64 → numpy arrays
   - Resize to 224x224
   - Convert BGR → RGB
   ↓
9. Preprocessing:
   - Extract features using EfficientNet (1280 features)
   - Add statistical features (14 features)
   - Combine → 1294 features per frame
   - Stack 8 frames → (1, 8, 1294)
   ↓
10. Model Inference:
    - Run CNN+BiLSTM model
    - Output: [prob_not_high, prob_high] OR single probability
    ↓
11. Post-processing:
    - Determine class (argmax or threshold 0.5)
    - Calculate confidence
    - Generate feedback message
    ↓
12. Return to frontend:
    {prediction: "High", confidence: 0.85, message: "..."}
    ↓
13. Frontend updates:
    - Display prediction + confidence
    - Add to confidence history (for ECG chart)
    - If action changed → Generate audio
    ↓
14. Audio Generation (if needed):
    POST /generate-audio {prediction, confidence}
    ↓
15. Backend:
    - Generate feedback message
    - Call ElevenLabs API → Audio MP3
    - Return base64 audio
    ↓
16. Frontend:
    - Decode base64 → Play audio
    - Display transcript
```

---

##  Key Features Explained

### **1. Motion Detection**
- **Why:** Prevents sending frames when camera is static (saves API calls)
- **How:** Pixel difference analysis between frames
- **Threshold:** 15% of pixels must change to trigger prediction

### **2. Frame Buffering**
- **Why:** Model needs 8 frames to understand temporal patterns
- **How:** Collects frames over time (200ms intervals = 1.6 seconds for 8 frames)
- **Padding:** If <8 frames available, repeats last frame

### **3. Throttling**
- **Prediction:** 5 FPS (200ms intervals) - Prevents API overload
- **Pose Detection:** 10 FPS (100ms intervals) - Balance between accuracy and performance
- **Frame Capture:** 60 FPS (render loop) - Smooth video display

### **4. Real-time Visualization**
- **ECG Chart:** Shows confidence trends over time
- **Pose Overlay:** Skeleton keypoints drawn on video
- **Live Updates:** UI updates instantly with new predictions

### **5. Voice Feedback**
- **Contextual Messages:** Different messages based on confidence level
- **Variations:** Random selection from message pool (not repetitive)
- **Smart Triggering:** Only speaks when action changes (not every frame)

---

##  Environment Variables

### **Backend (`backend/.env`):**
```
ELEVENLABS_API_KEY=sk_xxxxx    # Required for audio generation
ELEVENLABS_VOICE=Clyde         # Optional, defaults to "Clyde"
```

### **Frontend (`frontend/.env`):**
```
VITE_API_BASE_URL=http://localhost:8000  # Backend URL
VITE_ELEVENLABS_API_KEY=sk_xxxxx         # Optional (unused if backend handles TTS)
```

---

##  Dependencies

### **Backend:**
- `fastapi`: Web framework
- `tensorflow`: Deep learning framework
- `opencv-python`: Video/image processing
- `numpy`: Numerical operations
- `elevenlabs`: Text-to-speech API
- `python-dotenv`: Environment variable management

### **Frontend:**
- `react`: UI framework
- `typescript`: Type safety
- `vite`: Build tool
- `tailwindcss`: Styling
- `@tensorflow/tfjs`: TensorFlow.js (pose detection)
- `axios`: HTTP client
- `recharts`: Chart library
- `react-router-dom`: Routing

---

##  How to Run

### **Backend:**
```bash
cd backend
pip install -r requirements.txt
# Set up .env file with ELEVENLABS_API_KEY
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend:**
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

---

##  UI Components Overview

### **Application Page Layout:**
```
┌─────────────────────────────────────────────┐
│  Sidebar Navigation                         │
├──────────────────────┬──────────────────────┤
│                      │                      │
│   Camera Feed        │  Prediction Panel    │
│   (Video + Pose)     │  - Action Label      │
│                      │  - Confidence %      │
│                      │  - ECG Chart         │
│                      ├──────────────────────┤
│                      │  Audio Transcript    │
│                      │  (Feedback text)     │
│                      │                      │
├──────────────────────┴──────────────────────┤
│  [Start Camera] [Stop Camera]              │
└─────────────────────────────────────────────┘
```

---

##  Technical Decisions Explained

### **Why 8 frames?**
- Temporal sequences need multiple frames to capture motion
- 8 frames at 200ms intervals = 1.6 seconds of video
- Enough to see a complete cricket shot motion
- BiLSTM works well with sequence lengths of 8-16

### **Why EfficientNet + Statistical Features?**
- EfficientNet: Pre-trained on ImageNet, extracts rich visual features
- Statistical features: Add frame-level characteristics (brightness, contrast, edges)
- Combined: 1294 features capture both semantic (what) and statistical (how) information

### **Why Base64 Encoding?**
- HTTP-friendly format (JSON strings)
- No binary data in JSON responses
- Easy to decode on both sides
- Standard approach for image transmission over APIs

### **Why Motion Detection?**
- Reduces unnecessary API calls
- Only processes when player is moving (doing a shot)
- Saves backend resources
- Improves user experience (less lag)

---

##  Error Handling

### **Backend:**
- Model loading errors → Server fails to start (prevents silent failures)
- Video processing errors → Returns HTTP 400 with error message
- Model inference errors → Returns HTTP 500 with details
- ElevenLabs errors → Returns HTTP 500, frontend falls back to browser TTS

### **Frontend:**
- Camera access denied → Shows error message
- Backend unavailable → Error displayed, gracefully handles
- Pose detection fails → Continues without pose overlay (non-critical)
- Audio generation fails → Falls back to browser TTS

---

##  Performance Optimizations

1. **Model Loading:** Loaded once at startup (not per request)
2. **Feature Extractor:** Cached globally (not recreated per request)
3. **Frame Throttling:** Prevents excessive API calls
4. **Motion Detection:** Only processes when movement detected
5. **Pose Detection:** Runs at 10 FPS (not every frame)
6. **Audio Caching:** Stops previous audio before playing new (prevents overlap)

---

##  Future Enhancements

- Connect real pose detection to action classification
- Export session data (CSV/JSON)
- Multiple camera support
- Video recording and playback
- Advanced analytics dashboard
- Real-time coaching tips overlay

---

##  Summary

**Pitch-Perfect** is a complete real-time cricket shot analysis system that:

1. **Captures** live video from webcam
2. **Detects** player pose using TensorFlow.js
3. **Processes** video frames through AI model (CNN+BiLSTM)
4. **Classifies** shots as "High" or "Not High"
5. **Provides** real-time feedback with voice and visualizations
6. **Displays** confidence trends in ECG-style chart

The system is built with modern web technologies (React, TypeScript, FastAPI) and uses state-of-the-art AI models (EfficientNet, BiLSTM) for accurate cricket shot analysis.

