export const HERO_CONTENT = {
  mainHeading: 'Pitch-Perfect',
  subHeading: 'Pose-Based Action Recognition in Cricket Players',
  tagline: 'Real-time AI-powered analysis of cricket shots and player movements',
};

export const CTA_BUTTONS = {
  primary: {
    label: 'Launch Analysis',
    route: '/app',
  },
  secondary: {
    label: 'Learn More',
    action: 'open-about-modal',
  },
};

export const BACKGROUND = {
  imagePath: '/assets/images/cricket-ground-bg.jpg',
  imageAlt: 'Cricket ground under stadium lights',
};

export const FEATURES = [
  {
    title: 'Real-time Pose Tracking',
    description:
      'Capture and analyze player movements in real time with high-precision pose estimation.',
    icon: '🎯',
  },
  {
    title: 'AI Action Classification',
    description: 'Classify cricket shots as High or Not High with confidence scoring.',
    icon: '🤖',
  },
  {
    title: 'Instant Voice Feedback',
    description:
      'Deliver contextual voice coaching using advanced text-to-speech technology.',
    icon: '🔊',
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Capture',
    description: 'Use your camera to stream live player movement into the platform.',
  },
  {
    step: 2,
    title: 'Analyze',
    description:
      'Pitch-Perfect processes video frames with a CNN + BiLSTM model to classify shots as High or Not High.',
  },
  {
    step: 3,
    title: 'Coach',
    description:
      `Receive actionable insights and feedback tailored to each player's performance.`,
  },
];

export const TECHNOLOGY_STACK = [
  'FastAPI backend with TensorFlow inference',
  'CNN + BiLSTM shot classification model',
  'EfficientNet-based frame preprocessing',
  'Real-time ElevenLabs voice feedback',
  'React, TypeScript, and Tailwind CSS frontend',
];

export const USE_CASES = [
  'Professional coaching sessions',
  'Grassroots cricket training programs',
  'Performance analytics for broadcasters',
  'Academy-level player development',
  'Self-paced training for aspiring players',
];

export const ANALYSIS_DASHBOARD_PLACEHOLDER = {
  title: 'Session Analysis Coming Soon',
  description:
    'Review detailed insights from completed training sessions, including action frequency, confidence trends, and timeline replays.',
};

export const NAV_LINKS = [
  { label: 'Home', route: '/' },
  { label: 'Live Analysis', route: '/app' },
  { label: 'Session Dashboard', route: '/analysis' },
];

