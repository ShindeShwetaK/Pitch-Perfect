# CricVision - Pose-Based Action Recognition in Cricket Players

A real-time pose estimation and action recognition system for cricket players, built with React + Vite + TypeScript + TailwindCSS.

## Features

- 🎥 **Live Camera Feed**: Real-time webcam capture with start/stop controls
- 🦴 **Pose Skeleton Overlay**: Visual skeleton overlay on detected poses (placeholder for now)
- 🏏 **Action Recognition**: Classifies actions as Batting, Bowling, or Fielding
- 📊 **Confidence Scores**: Displays confidence percentages with visual indicators
- 🔊 **Voice Feedback**: Real-time voice feedback using ElevenLabs TTS API
- 📈 **Action History**: Timeline of detected actions with timestamps
- 🎨 **Dark Theme UI**: Modern sports analytics dashboard with glowing accents

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS with custom cricket theme
- **TTS**: ElevenLabs API (with browser fallback)
- **State Management**: React Hooks
- **Type Safety**: TypeScript

## Prerequisites

- Node.js 18+ and npm/yarn
- Webcam access
- (Optional) ElevenLabs API key for voice feedback

## Quick Start (No Docker Required!)

This is a **frontend-only React app**. No Docker needed!

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000`

**That's it!** The app runs immediately. See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Optional: ElevenLabs TTS Setup

For enhanced voice feedback, create a `.env` file:
```env
VITE_ELEVENLABS_API_KEY=your_api_key_here
VITE_ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

**Note**: The app works perfectly without ElevenLabs! It automatically uses browser TTS as a fallback.

See [SETUP.md](./SETUP.md) for detailed ElevenLabs setup instructions.

## Usage

1. **Start Camera**: Click the "Start Camera" button to begin video capture
2. **View Predictions**: The app will display detected actions (Batting, Bowling, Fielding) with confidence scores
3. **Pose Overlay**: Skeleton keypoints will be overlaid on the video feed (mock data for now)
4. **Voice Feedback**: Action-specific feedback will be spoken when actions are detected
5. **Stop Camera**: Click "Stop Camera" to end the session

## Project Structure

```
src/
├── components/
│   ├── ActionDisplay.tsx      # Action label and confidence display
│   ├── CameraFeed.tsx         # Camera capture component
│   ├── CricketPlayerSVG.tsx   # Animated player pose visualization
│   ├── Dashboard.tsx          # Main dashboard component
│   └── PoseOverlay.tsx        # Skeleton overlay component
├── services/
│   ├── mockApi.ts             # Mock prediction API (replace with real backend)
│   └── ttsService.ts          # ElevenLabs TTS integration
├── types/
│   └── index.ts               # TypeScript type definitions
├── styles/
│   └── index.css              # Global styles and Tailwind imports
├── App.tsx                    # Main app component
└── main.tsx                   # Entry point
```

## Backend Integration

Currently, the app uses a mock API that returns random predictions. To connect to your FastAPI backend:

1. **Update `src/services/mockApi.ts`**
   - Uncomment the `predictFromBackend` function
   - Update the API endpoint URL
   - Replace `mockPredict` calls with `predictFromBackend` in `Dashboard.tsx`

2. **Backend API Format**
   The backend should return JSON in this format:
   ```json
   {
     "action": "Batting",
     "confidence": 0.92,
     "keypoints": [
       {"x": 0.5, "y": 0.3, "visibility": 0.9, "name": "nose"},
       ...
     ]
   }
   ```

## Customization

### Voice Feedback Messages

Edit `src/services/ttsService.ts` to customize feedback messages:
```typescript
const ACTION_FEEDBACKS = {
  Batting: { action: 'Batting', message: 'Your custom message here' },
  // ...
};
```

### Theme Colors

Edit `tailwind.config.js` to customize colors:
```javascript
colors: {
  'cricket-green': '#00ff88',
  'cricket-blue': '#00d4ff',
  // ...
}
```

## Future Enhancements

- [ ] Connect to real pose estimation model (MediaPipe/YOLOv8-Pose)
- [ ] Real-time keypoint detection from video frames
- [ ] Action timeline visualization
- [ ] Export action history as CSV/JSON
- [ ] Multiple camera support
- [ ] Record and playback sessions
- [ ] Advanced analytics dashboard

## Troubleshooting

### Camera Not Working
- Ensure you've granted camera permissions in your browser
- Check if another application is using the camera
- Try a different browser (Chrome recommended)

### Voice Feedback Not Working
- Check if ElevenLabs API key is set correctly
- Browser TTS should work as fallback
- Check browser console for errors

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
