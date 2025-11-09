interface CricketPlayerSVGProps {
  action?: 'Batting' | 'Bowling' | 'Fielding';
  className?: string;
}

export function CricketPlayerSVG({ action = 'Batting', className = '' }: CricketPlayerSVGProps) {
  // Different poses for different actions
  const getPose = () => {
    switch (action) {
      case 'Batting':
        return {
          // Batting pose - player with bat raised
          body: { x: 50, y: 40, width: 12, height: 35 },
          head: { x: 50, y: 20, r: 8 },
          leftArm: { x1: 45, y1: 45, x2: 35, y2: 30 },
          rightArm: { x1: 55, y1: 45, x2: 70, y2: 25 },
          leftLeg: { x1: 47, y1: 75, x2: 42, y2: 95 },
          rightLeg: { x1: 53, y1: 75, x2: 58, y2: 95 },
          bat: { x1: 70, y1: 25, x2: 75, y2: 15 },
        };
      case 'Bowling':
        return {
          // Bowling pose - arm extended
          body: { x: 50, y: 40, width: 12, height: 35 },
          head: { x: 50, y: 20, r: 8 },
          leftArm: { x1: 45, y1: 45, x2: 40, y2: 35 },
          rightArm: { x1: 55, y1: 45, x2: 75, y2: 40 },
          leftLeg: { x1: 47, y1: 75, x2: 45, y2: 95 },
          rightLeg: { x1: 53, y1: 75, x2: 60, y2: 95 },
          bat: null,
        };
      case 'Fielding':
        return {
          // Fielding pose - low stance
          body: { x: 50, y: 50, width: 12, height: 30 },
          head: { x: 50, y: 30, r: 8 },
          leftArm: { x1: 45, y1: 55, x2: 35, y2: 60 },
          rightArm: { x1: 55, y1: 55, x2: 65, y2: 60 },
          leftLeg: { x1: 47, y1: 80, x2: 40, y2: 95 },
          rightLeg: { x1: 53, y1: 80, x2: 60, y2: 95 },
          bat: null,
        };
      default:
        return {
          body: { x: 50, y: 40, width: 12, height: 35 },
          head: { x: 50, y: 20, r: 8 },
          leftArm: { x1: 45, y1: 45, x2: 35, y2: 30 },
          rightArm: { x1: 55, y1: 45, x2: 70, y2: 25 },
          leftLeg: { x1: 47, y1: 75, x2: 42, y2: 95 },
          rightLeg: { x1: 53, y1: 75, x2: 58, y2: 95 },
          bat: { x1: 70, y1: 25, x2: 75, y2: 15 },
        };
    }
  };

  const pose = getPose();

  return (
    <svg
      viewBox="0 0 100 100"
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Player Body */}
      <ellipse
        cx={pose.body.x}
        cy={pose.body.y}
        rx={pose.body.width / 2}
        ry={pose.body.height / 2}
        fill="#10b981"
        fillOpacity="0.4"
        stroke="#34d399"
        strokeWidth="2"
      />

      {/* Head */}
      <circle
        cx={pose.head.x}
        cy={pose.head.y}
        r={pose.head.r}
        fill="#10b981"
        fillOpacity="0.6"
        stroke="#34d399"
        strokeWidth="2"
      />

      {/* Left Arm */}
      <line
        x1={pose.leftArm.x1}
        y1={pose.leftArm.y1}
        x2={pose.leftArm.x2}
        y2={pose.leftArm.y2}
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Right Arm */}
      <line
        x1={pose.rightArm.x1}
        y1={pose.rightArm.y1}
        x2={pose.rightArm.x2}
        y2={pose.rightArm.y2}
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Left Leg */}
      <line
        x1={pose.leftLeg.x1}
        y1={pose.leftLeg.y1}
        x2={pose.leftLeg.x2}
        y2={pose.leftLeg.y2}
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Right Leg */}
      <line
        x1={pose.rightLeg.x1}
        y1={pose.rightLeg.y1}
        x2={pose.rightLeg.x2}
        y2={pose.rightLeg.y2}
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Bat (for batting pose) */}
      {pose.bat && (
        <line
          x1={pose.bat.x1}
          y1={pose.bat.y1}
          x2={pose.bat.x2}
          y2={pose.bat.y2}
          stroke="#f59e0b"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

