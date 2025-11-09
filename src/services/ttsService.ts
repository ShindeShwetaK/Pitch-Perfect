import type { ActionFeedback } from '../types';

// Action to feedback message mapping
const ACTION_FEEDBACKS: Record<string, ActionFeedback> = {
  Batting: {
    action: 'Batting',
    message: 'Nice batting form! Keep your front leg steady.',
  },
  Bowling: {
    action: 'Bowling',
    message: 'Good bowling motion! Extend your arm fully.',
  },
  Fielding: {
    action: 'Fielding',
    message: 'Great fielding stance! Stay low and quick.',
  },
};

// ElevenLabs API configuration
// Add your API key directly here, or leave empty to use browser TTS
const ELEVENLABS_API_KEY = 'YOUR_ELEVENLABS_API_KEY_HERE'; // Replace with your actual API key
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Default voice ID (Rachel - English)
const ELEVENLABS_API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;

// Track current audio playback to prevent overlap
let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;

/**
 * Get feedback message for an action
 */
export function getActionFeedback(action: 'Batting' | 'Bowling' | 'Fielding'): ActionFeedback {
  return ACTION_FEEDBACKS[action] || ACTION_FEEDBACKS.Batting;
}

/**
 * Convert text to speech using ElevenLabs TTS API
 */
async function textToSpeech(text: string): Promise<ArrayBuffer> {
  if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'YOUR_ELEVENLABS_API_KEY_HERE') {
    console.warn('ElevenLabs API key not set. Using browser TTS as fallback.');
    throw new Error('API key not configured');
  }

  const response = await fetch(ELEVENLABS_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  return response.arrayBuffer();
}

/**
 * Play audio from ArrayBuffer
 */
function playAudio(audioBuffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    // Stop current audio if playing
    if (currentAudio && isPlaying) {
      currentAudio.pause();
      currentAudio = null;
    }

    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      isPlaying = false;
      currentAudio = null;
      URL.revokeObjectURL(audioUrl);
      resolve();
    };

    audio.onerror = (error) => {
      isPlaying = false;
      currentAudio = null;
      URL.revokeObjectURL(audioUrl);
      reject(error);
    };

    currentAudio = audio;
    isPlaying = true;
    audio.play().catch(reject);
  });
}

/**
 * Fallback to browser TTS if ElevenLabs is not available
 */
function fallbackTTS(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);
      speechSynthesis.speak(utterance);
    } else {
      reject(new Error('Text-to-speech not supported'));
    }
  });
}

/**
 * Speak action feedback with voice
 * Uses ElevenLabs if API key is configured, otherwise falls back to browser TTS
 */
export async function speakActionFeedback(action: 'Batting' | 'Bowling' | 'Fielding'): Promise<void> {
  const feedback = getActionFeedback(action);
  
  try {
    // Try ElevenLabs first
    if (ELEVENLABS_API_KEY) {
      const audioBuffer = await textToSpeech(feedback.message);
      await playAudio(audioBuffer);
    } else {
      // Fallback to browser TTS
      await fallbackTTS(feedback.message);
    }
  } catch (error) {
    console.error('TTS Error:', error);
    // Try browser TTS as fallback
    try {
      await fallbackTTS(feedback.message);
    } catch (fallbackError) {
      console.error('Fallback TTS also failed:', fallbackError);
    }
  }
}

/**
 * Stop any currently playing audio
 */
export function stopAudio(): void {
  if (currentAudio && isPlaying) {
    currentAudio.pause();
    currentAudio = null;
    isPlaying = false;
  }
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

