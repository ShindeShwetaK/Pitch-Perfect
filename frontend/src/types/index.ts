export interface PredictionResponse {
  prediction: 'High' | 'Not High';
  confidence: number;
  message: string;
}

export interface ActionFeedback {
  action: 'High' | 'Not High';
  message: string;
}

export interface Keypoint {
  x: number;
  y: number;
  visibility?: number;
  name?: string;
}

