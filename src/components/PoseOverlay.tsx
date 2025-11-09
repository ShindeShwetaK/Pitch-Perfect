import type { Keypoint } from '../types';

interface PoseOverlayProps {
  keypoints?: Keypoint[];
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
}

// Define skeleton connections (pairs of keypoint indices)
// Based on MediaPipe pose model structure
const SKELETON_CONNECTIONS: Array<[number, number]> = [
  // Head
  [0, 1], [0, 2], [1, 3], [2, 4],
  // Torso
  [5, 6], [5, 11], [6, 12], [11, 12],
  // Left arm
  [5, 7], [7, 9],
  // Right arm
  [6, 8], [8, 10],
  // Left leg
  [11, 13], [13, 15],
  // Right leg
  [12, 14], [14, 16],
];

// Keypoint names for reference (MediaPipe pose) - 17 keypoints
// ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
//  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
//  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
//  'left_knee', 'right_knee', 'left_ankle', 'right_ankle']

export function PoseOverlay({
  keypoints = [],
  videoWidth,
  videoHeight,
  containerWidth,
  containerHeight,
}: PoseOverlayProps) {
  if (!keypoints || keypoints.length === 0) {
    return null;
  }

  // Calculate scaling factors
  // Handle both normalized (0-1) and pixel coordinates
  const maxX = keypoints.length > 0 ? Math.max(...keypoints.map(kp => kp.x)) : 1;
  const maxY = keypoints.length > 0 ? Math.max(...keypoints.map(kp => kp.y)) : 1;
  // Assume normalized if max values are <= 1.0 (allowing some tolerance)
  const isNormalized = maxX <= 1.0 && maxY <= 1.0 && maxX > 0 && maxY > 0;

  const scaleX = isNormalized 
    ? containerWidth  // If normalized, multiply by container width
    : containerWidth / videoWidth; // If pixels, scale by ratio
  const scaleY = isNormalized
    ? containerHeight  // If normalized, multiply by container height
    : containerHeight / videoHeight; // If pixels, scale by ratio

  // Scale keypoints to container size
  const scaledKeypoints = keypoints.map((kp) => ({
    x: kp.x * scaleX,
    y: kp.y * scaleY,
    visibility: kp.visibility || 1,
  }));

  // Filter connections based on visibility
  const visibleConnections = SKELETON_CONNECTIONS.filter(([i, j]) => {
    const kp1 = scaledKeypoints[i];
    const kp2 = scaledKeypoints[j];
    return (
      kp1 &&
      kp2 &&
      kp1.visibility > 0.5 &&
      kp2.visibility > 0.5
    );
  });

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
      style={{ zIndex: 10 }}
    >
      {/* Draw skeleton connections */}
      <g stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round">
        {visibleConnections.map(([i, j], index) => {
          const kp1 = scaledKeypoints[i];
          const kp2 = scaledKeypoints[j];
          if (!kp1 || !kp2) return null;

          return (
            <line
              key={`connection-${index}`}
              x1={kp1.x}
              y1={kp1.y}
              x2={kp2.x}
              y2={kp2.y}
              strokeOpacity={Math.min(kp1.visibility, kp2.visibility) * 0.9}
              style={{
                filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))',
              }}
            />
          );
        })}
      </g>

      {/* Draw keypoints */}
      <g fill="#3b82f6">
        {scaledKeypoints.map((kp, index) => {
          if (!kp || kp.visibility < 0.5) return null;

          return (
            <circle
              key={`keypoint-${index}`}
              cx={kp.x}
              cy={kp.y}
              r="5"
              fillOpacity={kp.visibility}
              style={{
                filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.8))',
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}

