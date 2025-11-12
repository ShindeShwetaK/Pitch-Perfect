/**
 * API service for communicating with the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface BackendPredictionResponse {
  prediction: 'High' | 'Not High';
  confidence: number;
  message: string;
}

export interface BackendAudioResponse {
  message: string;
  audio_base64: string;
}

/**
 * Check if backend is healthy and available
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

/**
 * Predict action from live camera frames
 * Sends frames to backend /predict-live endpoint
 * @param frames Array of base64-encoded frame strings (should be 8 frames)
 */
export async function predictLive(
  frames: string[]
): Promise<BackendPredictionResponse> {
  // Ensure we have at least 8 frames (pad with last frame if needed)
  const framesToSend = [...frames];
  if (framesToSend.length < 8 && framesToSend.length > 0) {
    const lastFrame = framesToSend[framesToSend.length - 1];
    while (framesToSend.length < 8) {
      framesToSend.push(lastFrame);
    }
  }

  if (framesToSend.length === 0) {
    throw new Error('No frames provided for prediction');
  }

  // Send to backend
  const response = await fetch(`${API_BASE_URL}/predict-live`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      frames: framesToSend,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prediction failed: ${response.status} ${errorText}`);
  }

  const data: BackendPredictionResponse = await response.json();
  return data;
}

/**
 * Generate audio feedback from backend
 * Uses backend /generate-audio endpoint
 */
export async function generateAudio(
  prediction: 'High' | 'Not High',
  confidence: number
): Promise<BackendAudioResponse> {
  const response = await fetch(`${API_BASE_URL}/generate-audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prediction,
      confidence,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Audio generation failed: ${response.status} ${errorText}`);
  }

  const data: BackendAudioResponse = await response.json();
  return data;
}

