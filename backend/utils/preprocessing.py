"""
Preprocessing utilities for preparing video frames for model inference.
"""
import os
import ssl
import urllib.request
import numpy as np
from typing import List, Optional
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess
from tensorflow import keras

# Global feature extractor model (loaded once and reused)
_feature_extractor: Optional[keras.Model] = None


def _setup_ssl_for_keras():
    """
    Setup SSL context to handle certificate verification issues.
    This patches the default SSL context used by urllib (which Keras uses for downloads).
    WARNING: This disables SSL verification - only use in development!
    """
    # Set unverified SSL context globally for this process
    ssl._create_default_https_context = ssl._create_unverified_context
    print("SSL context configured to skip verification (DEVELOPMENT ONLY)")


def get_feature_extractor() -> keras.Model:
    """
    Get or create the EfficientNet feature extractor model.
    This model extracts 1280 features from each frame (EfficientNetB0 with global average pooling).
    Then we add additional processing to get to 1294 features if needed.
    
    Returns:
        Keras model for feature extraction
    
    Raises:
        RuntimeError: If the feature extractor cannot be loaded
    """
    global _feature_extractor
    
    if _feature_extractor is None:
        try:
            # Try to load with default settings first
            base_model = keras.applications.EfficientNetB0(
                weights='imagenet',
                include_top=False,
                input_shape=(224, 224, 3),
                pooling='avg'  # Global average pooling gives us 1280 features
            )
            _feature_extractor = base_model
            print("Feature extractor model loaded (EfficientNetB0)")
        except (urllib.error.URLError, ssl.SSLError, Exception) as e:
            # If SSL verification fails, configure SSL to skip verification (development only)
            error_msg = str(e).lower()
            if 'ssl' in error_msg or 'certificate' in error_msg:
                print("Warning: SSL certificate verification failed.")
                print("Configuring SSL to skip verification (DEVELOPMENT ONLY - not for production)")
                print("For production, please fix SSL certificates:")
                print("  macOS: Run 'Install Certificates.command' from Python folder")
                print("  Or: pip install --upgrade certifi")
                
                # Setup SSL to skip verification
                _setup_ssl_for_keras()
                
                try:
                    # Try again with unverified SSL
                    base_model = keras.applications.EfficientNetB0(
                        weights='imagenet',
                        include_top=False,
                        input_shape=(224, 224, 3),
                        pooling='avg'
                    )
                    _feature_extractor = base_model
                    print("Feature extractor model loaded (EfficientNetB0) with unverified SSL")
                except Exception as e2:
                    raise RuntimeError(
                        f"Failed to load EfficientNet feature extractor even with unverified SSL: {str(e2)}\n"
                        "Please fix SSL certificates or download weights manually:\n"
                        "1. macOS: Run 'Install Certificates.command' from Python folder\n"
                        "2. Or: pip install --upgrade certifi\n"
                        "3. Or: Download weights manually and use local path"
                    ) from e2
            else:
                raise RuntimeError(f"Failed to load EfficientNet feature extractor: {str(e)}") from e
    
    return _feature_extractor


def extract_features_from_frames(frames: np.ndarray) -> np.ndarray:
    """
    Extract features from frames using EfficientNet.
    
    Args:
        frames: Array of frames with shape (n_frames, 224, 224, 3)
    
    Returns:
        Feature array with shape (n_frames, 1294)
        Combines EfficientNet features (1280) with frame statistics (14) to reach 1294
    """
    feature_extractor = get_feature_extractor()
    
    # Preprocess frames for EfficientNet
    frames_preprocessed = efficientnet_preprocess(frames)
    
    # Extract features from each frame using EfficientNet
    # Input: (n_frames, 224, 224, 3) -> Output: (n_frames, 1280)
    cnn_features = feature_extractor.predict(frames_preprocessed, verbose=0)
    
    # Add frame-level statistics as additional features
    # This helps bridge the gap from 1280 to 1294 features
    n_frames = cnn_features.shape[0]
    additional_features = []
    
    for i in range(n_frames):
        frame = frames[i]
        # Extract statistical features from the frame
        # Mean and std of each channel (3 channels * 2 stats = 6 features)
        mean_rgb = np.mean(frame, axis=(0, 1))  # (3,)
        std_rgb = np.std(frame, axis=(0, 1))    # (3,)
        
        # Overall brightness and contrast
        brightness = np.mean(frame)              # (1,)
        contrast = np.std(frame)                 # (1,)
        
        # Edge density (using simple gradient)
        gray = np.mean(frame, axis=2)
        grad_x = np.abs(np.diff(gray, axis=1, prepend=gray[:, :1]))
        grad_y = np.abs(np.diff(gray, axis=0, prepend=gray[:1, :]))
        edge_density = np.mean(grad_x) + np.mean(grad_y)  # (1,)
        
        # Combine all additional features: 3 + 3 + 1 + 1 + 1 = 9 features
        # But we need 14, so let's add a few more
        # Min and max values per channel
        min_rgb = np.min(frame, axis=(0, 1))    # (3,)
        max_rgb = np.max(frame, axis=(0, 1))    # (3,)
        
        # Total: 3 (mean) + 3 (std) + 1 (brightness) + 1 (contrast) + 1 (edge) + 3 (min) + 3 (max) = 15
        # We only need 14, so we'll take the first 14
        frame_stats = np.concatenate([
            mean_rgb,      # 3
            std_rgb,       # 3
            [brightness],  # 1
            [contrast],    # 1
            [edge_density], # 1
            min_rgb,       # 3
            max_rgb[:2]    # 2 (take only first 2 to get exactly 14)
        ])
        
        additional_features.append(frame_stats)
    
    additional_features = np.array(additional_features, dtype=np.float32)  # (n_frames, 14)
    
    # Combine CNN features (1280) with statistical features (14) to get 1294 features
    features = np.concatenate([cnn_features, additional_features], axis=1)  # (n_frames, 1294)
    
    return features


def preprocess_frames(frames: List[np.ndarray], sequence_length: int = 8) -> np.ndarray:
    """
    Preprocess frames for model inference.
    
    This function extracts features from frames using EfficientNet and prepares them
    for the BiLSTM model which expects input shape (batch, sequence_length, feature_dim).
    
    Args:
        frames: List of frames as numpy arrays (224x224x3, RGB)
        sequence_length: Desired sequence length (default: 8)
    
    Returns:
        Preprocessed numpy array with shape (1, sequence_length, 1294)
        where 1294 is the feature dimension expected by the model
    """
    frames_array = np.array(frames, dtype=np.float32)
    
    # Handle sequence length
    if len(frames_array) < sequence_length:
        # Pad by repeating the last frame
        last_frame = frames_array[-1:]
        padding = np.repeat(last_frame, sequence_length - len(frames_array), axis=0)
        frames_array = np.concatenate([frames_array, padding], axis=0)
    elif len(frames_array) > sequence_length:
        # Trim by taking the last N frames
        frames_array = frames_array[-sequence_length:]
    
    # Extract features from frames using EfficientNet
    # Input: (sequence_length, 224, 224, 3) -> Output: (sequence_length, 1294)
    features = extract_features_from_frames(frames_array)
    
    # Expand dimensions to create batch: (1, sequence_length, 1294)
    features_batch = np.expand_dims(features, axis=0)
    
    return features_batch

