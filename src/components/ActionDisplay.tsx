import type { PredictionResponse } from '../types';

interface ActionDisplayProps {
  prediction: PredictionResponse | null;
  isActive: boolean;
}

const ACTION_ICONS = {
  Batting: '🏏',
  Bowling: '⚾',
  Fielding: '🧤',
};

export function ActionDisplay({ prediction, isActive }: ActionDisplayProps) {
  if (!prediction || !isActive) {
    return (
      <div className="card-glass rounded-2xl p-8 shadow-xl">
        <div className="text-center text-cricket-text-muted">
          <div className="text-5xl mb-3 animate-pulse">⏸️</div>
          <p className="font-medium">Waiting for prediction...</p>
        </div>
      </div>
    );
  }

  const { action, confidence } = prediction;
  const confidencePercent = Math.round(confidence * 100);
  const icon = ACTION_ICONS[action];

  // Confidence color based on value
  const confidenceColor =
    confidence > 0.8
      ? 'text-cricket-green-bright'
      : confidence > 0.6
      ? 'text-cricket-orange'
      : 'text-yellow-400';

  // Determine border and glow based on action
  const borderColorClass = action === 'Batting' 
    ? 'border-cricket-green/50' 
    : action === 'Bowling'
    ? 'border-cricket-blue/50'
    : 'border-cricket-orange/50';

  const glowStyle = action === 'Batting'
    ? { boxShadow: '0 0 30px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.2)' }
    : action === 'Bowling'
    ? { boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)' }
    : { boxShadow: '0 0 30px rgba(245, 158, 11, 0.4), 0 0 60px rgba(245, 158, 11, 0.2)' };
  
  return (
    <div
      className={`card-glass rounded-2xl p-8 border-2 transition-all duration-300 shadow-2xl ${borderColorClass}`}
      style={glowStyle}
    >
      <div className="text-center animate-slide-up">
        {/* Action Icon */}
        <div className="text-7xl mb-4 animate-float">{icon}</div>

        {/* Action Label */}
        <h2 className={`text-4xl font-extrabold mb-4 bg-gradient-to-r ${action === 'Batting' ? 'from-cricket-green to-cricket-green-bright' : action === 'Bowling' ? 'from-cricket-blue to-cricket-blue-bright' : 'from-cricket-orange to-yellow-400'} bg-clip-text text-transparent`}>
          {action}
        </h2>

        {/* Confidence Score */}
        <div className="mt-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-sm text-cricket-text-muted font-medium">Confidence</span>
            <span className={`text-3xl font-bold ${confidenceColor}`}>
              {confidencePercent}%
            </span>
          </div>

          {/* Confidence Bar */}
          <div className="w-full bg-slate-700/50 rounded-full h-4 mt-4 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                confidence > 0.8
                  ? 'bg-gradient-to-r from-cricket-green to-cricket-green-bright'
                  : confidence > 0.6
                  ? 'bg-gradient-to-r from-cricket-orange to-yellow-400'
                  : 'bg-gradient-to-r from-yellow-400 to-orange-400'
              }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-cricket-green rounded-full animate-pulse shadow-lg shadow-cricket-green/50" />
          <span className="text-xs text-cricket-text-muted font-semibold">Live Detection Active</span>
        </div>
      </div>
    </div>
  );
}

