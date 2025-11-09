import { useEffect, useRef } from 'react';

interface CameraFeedProps {
  onFrameCapture?: (video: HTMLVideoElement) => void;
  isActive: boolean;
  onCameraReady?: () => void;
  onCameraError?: (error: Error) => void;
}

export function CameraFeed({
  onFrameCapture,
  isActive,
  onCameraReady,
  onCameraError,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          onCameraReady?.();
          startFrameCapture();
        };
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to access camera');
      console.error('Camera access error:', err);
      onCameraError?.(err);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startFrameCapture = () => {
    const captureFrame = () => {
      if (videoRef.current && isActive && onFrameCapture) {
        onFrameCapture(videoRef.current);
      }
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(captureFrame);
      }
    };

    captureFrame();
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
          <div className="text-center p-8">
            <div className="text-6xl mb-4 animate-pulse">📹</div>
            <p className="text-cricket-text-muted text-lg font-medium">Camera feed will appear here</p>
            <p className="text-sm text-cricket-text-muted/70 mt-2">Click Start to begin</p>
          </div>
        </div>
      )}
    </div>
  );
}

