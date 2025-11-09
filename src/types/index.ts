export interface PredictionResponse {
  action: 'Batting' | 'Bowling' | 'Fielding';
  confidence: number;
  keypoints?: Keypoint[];
}

export interface Keypoint {
  x: number;
  y: number;
  visibility?: number;
  name?: string;
}

export interface ActionFeedback {
  action: 'Batting' | 'Bowling' | 'Fielding';
  message: string;
}

