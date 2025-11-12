# Environment Variables Setup

## Required Environment Variables

### 1. `ELEVENLABS_API_KEY` (Required for audio generation)
- **Purpose**: API key for ElevenLabs text-to-speech service
- **How to get**: Sign up at [elevenlabs.io](https://elevenlabs.io/) and get your API key from the dashboard
- **Example**: `ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx`
- **Note**: If not set, audio generation will fail but predictions will still work

### 2. `ELEVENLABS_VOICE` (Optional)
- **Purpose**: Voice name to use for text-to-speech
- **Default**: "Adam"
- **Example**: `ELEVENLABS_VOICE=Clyde`
- **Note**: If the specified voice is not available, the system will automatically use an available voice from your account
- **Available voices**: Check your ElevenLabs account for available voices (common ones: Clyde, Roger, Sarah, Laura, Charlie)

## Optional Environment Variables

### Model Path (Optional)
- **Default**: `models/cnn_bilstm_binary_classifier.keras`
- **Note**: Model path is currently hardcoded in `app.py`. You can modify it if needed.

### Server Configuration (Optional)
- **Host**: Default is `0.0.0.0` (set via uvicorn command)
- **Port**: Default is `8000` (set via uvicorn command)

## Setup Instructions

### 1. Install python-dotenv (if not already installed):

```bash
cd backend
pip install python-dotenv
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

### 2. Create a `.env` file in the `backend/` directory:

```bash
cd backend
touch .env
```

### 3. Add your environment variables to `.env`:

```env
ELEVENLABS_API_KEY=your_actual_api_key_here
ELEVENLABS_VOICE=Clyde
```

**Important**: 
- Replace `your_actual_api_key_here` with your actual ElevenLabs API key
- Replace `Clyde` with a voice available in your account (run the test script to see available voices)
- If you don't set `ELEVENLABS_VOICE`, the system will automatically select an available voice

### 4. Verify the setup:

Run the test script to verify your ElevenLabs connection:
```bash
python test_elevenlabs.py
```

This will:
- Check if the API key is loaded
- Test API connection
- Generate a test audio file
- Verify base64 encoding/decoding

### 5. Alternative: Export in shell (Not Recommended)

If you prefer not to use `.env` files, you can export the variable:

**Linux/Mac:**
```bash
export ELEVENLABS_API_KEY=your_actual_api_key_here
```

**Windows:**
```cmd
set ELEVENLABS_API_KEY=your_actual_api_key_here
```

**Note**: Using `.env` files with python-dotenv is the recommended approach as it's easier to manage and doesn't require exporting variables each time.

## Current Implementation

The backend currently reads the `ELEVENLABS_API_KEY` from environment variables using `os.getenv()`. If the key is not set, a warning will be printed and audio generation will fail.

## Testing

To verify your environment variables are set correctly:

```bash
# Check if the variable is set
echo $ELEVENLABS_API_KEY  # Linux/Mac
echo %ELEVENLABS_API_KEY%  # Windows

# Or test in Python
python -c "import os; print(os.getenv('ELEVENLABS_API_KEY', 'Not set'))"
```

## Security Notes

1. **Never commit `.env` files** to version control
2. Add `.env` to your `.gitignore` file
3. Use different API keys for development and production
4. Rotate API keys regularly
5. In production, use secure secret management (AWS Secrets Manager, Azure Key Vault, etc.)

## Troubleshooting

### Audio generation fails
- Check if `ELEVENLABS_API_KEY` is set: `echo $ELEVENLABS_API_KEY`
- Verify the API key is valid at [elevenlabs.io](https://elevenlabs.io/)
- Check API key permissions and usage limits

### Backend starts but model fails to load
- Ensure the model file exists at `backend/models/cnn_bilstm_binary_classifier.keras`
- Check file permissions
- Verify the model file is not corrupted

