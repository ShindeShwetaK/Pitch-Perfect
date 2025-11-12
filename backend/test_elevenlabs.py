"""
Test script to verify ElevenLabs API connection and audio generation.
"""
import os
import base64
from dotenv import load_dotenv
from elevenlabs import generate, set_api_key, voices

# Load environment variables from .env file
load_dotenv()


def test_elevenlabs_connection():
    """
    Test ElevenLabs API connection and audio generation.
    """
    print("=" * 60)
    print("ElevenLabs API Connection Test")
    print("=" * 60)
    
    # Get API key from environment
    api_key = os.getenv("ELEVENLABS_API_KEY", "")
    
    if not api_key:
        print("❌ ERROR: ELEVENLABS_API_KEY not found in environment variables")
        print("\nTo fix this:")
        print("1. Create a .env file in the backend/ directory")
        print("2. Add: ELEVENLABS_API_KEY=your_api_key_here")
        print("3. Get your API key from: https://elevenlabs.io/")
        return False
    
    print(f"✓ API Key found: {api_key[:10]}...{api_key[-4:]}")
    
    # Set API key
    try:
        set_api_key(api_key)
        print("✓ API key set successfully")
    except Exception as e:
        print(f"❌ ERROR: Failed to set API key: {e}")
        return False
    
    # Test 1: List available voices and find a suitable one
    print("\n" + "-" * 60)
    print("Test 1: Fetching available voices...")
    print("-" * 60)
    try:
        voices_list = voices()
        print(f"✓ Successfully retrieved {len(voices_list)} voices")
        
        # Get preferred voice from env or use default
        preferred_voice = os.getenv("ELEVENLABS_VOICE", "Adam")
        print(f"  Preferred voice: {preferred_voice}")
        
        # Find preferred voice
        selected_voice = None
        for voice in voices_list:
            if voice.name.lower() == preferred_voice.lower():
                selected_voice = voice
                break
        
        # If preferred voice not found, use first available voice
        if not selected_voice:
            print(f"⚠ Warning: '{preferred_voice}' voice not found in available voices")
            if voices_list:
                available_voice_names = [v.name for v in voices_list]
                print(f"  Available voices: {available_voice_names[:10]}")
                # Prefer male-sounding voices: Clyde, Roger, Charlie, or any available
                preferred_names = ["Clyde", "Roger", "Charlie", "Adam", "Rachel"]
                for pref_name in preferred_names:
                    for voice in voices_list:
                        if voice.name == pref_name:
                            selected_voice = voice
                            break
                    if selected_voice:
                        break
                
                # If still no match, use first available
                if not selected_voice:
                    selected_voice = voices_list[0]
                
                print(f"  Using voice: '{selected_voice.name}' (ID: {selected_voice.voice_id})")
                print(f"  💡 Tip: Set ELEVENLABS_VOICE={selected_voice.name} in .env to use this voice")
        else:
            print(f"✓ Found '{selected_voice.name}' voice (ID: {selected_voice.voice_id})")
        
        # Store selected voice name for use in tests
        test_voice_name = selected_voice.name
        
    except Exception as e:
        print(f"❌ ERROR: Failed to fetch voices: {e}")
        return False
    
    # Test 2: Generate audio
    print("\n" + "-" * 60)
    print("Test 2: Generating audio...")
    print("-" * 60)
    test_message = "Hello! This is a test of the ElevenLabs text-to-speech API."
    print(f"Test message: '{test_message}'")
    
    try:
        audio = generate(
            text=test_message,
            voice=test_voice_name,
            model="eleven_multilingual_v2"
        )
        
        if audio:
            audio_size = len(audio)
            print(f"✓ Audio generated successfully")
            print(f"  Audio size: {audio_size} bytes ({audio_size / 1024:.2f} KB)")
            
            # Test base64 encoding (as used in the API)
            audio_base64 = base64.b64encode(audio).decode('utf-8')
            print(f"✓ Base64 encoding successful")
            print(f"  Base64 length: {len(audio_base64)} characters")
            
            # Test decoding
            decoded_audio = base64.b64decode(audio_base64)
            if decoded_audio == audio:
                print(f"✓ Base64 decode test passed")
            else:
                print(f"❌ ERROR: Base64 decode mismatch")
                return False
            
            # Optionally save audio file for testing
            output_file = "test_audio_output.mp3"
            try:
                with open(output_file, "wb") as f:
                    f.write(audio)
                print(f"✓ Audio saved to: {output_file}")
                print(f"  You can play this file to verify audio quality")
            except Exception as e:
                print(f"⚠ Warning: Could not save audio file: {e}")
        else:
            print("❌ ERROR: Audio generation returned empty result")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: Failed to generate audio: {e}")
        print(f"\nPossible causes:")
        print("  - Invalid API key")
        print("  - API quota exceeded")
        print("  - Network connection issues")
        print(f"  - Voice '{test_voice_name}' not available")
        return False
    
    # Test 3: Generate feedback message (as used in the app)
    print("\n" + "-" * 60)
    print("Test 3: Generating cricket feedback message...")
    print("-" * 60)
    feedback_message = "Great shot! Very well executed."
    print(f"Feedback message: '{feedback_message}'")
    
    try:
        audio = generate(
            text=feedback_message,
            voice=test_voice_name,
            model="eleven_multilingual_v2"
        )
        if audio:
            print(f"✓ Feedback audio generated successfully")
            print(f"  Audio size: {len(audio)} bytes")
        else:
            print("❌ ERROR: Feedback audio generation returned empty result")
            return False
    except Exception as e:
        print(f"❌ ERROR: Failed to generate feedback audio: {e}")
        return False
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    print("\nElevenLabs API is configured correctly and ready to use.")
    print("You can now use the /generate-audio endpoint in your backend.")
    return True


if __name__ == "__main__":
    success = test_elevenlabs_connection()
    exit(0 if success else 1)

