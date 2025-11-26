
export enum AccessStatus {
  LOCKED = 'LOCKED',
  PENDING = 'PENDING',
  GRANTED = 'GRANTED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED'
}

export interface PredictionResult {
  period: string;
  number: number;
  result: 'BIG' | 'SMALL';
  colors: string[];
  colorName: string;
  confidence: number;
}

export interface TimerState {
  countdown: number;
  prediction: PredictionResult | null;
}

export interface UserData {
  deviceId: string;
  status: AccessStatus;
  activationCode?: string;
  requestTime: number;
}

export interface AppSettings {
  gameUrl: string;
  appName: string;
  adminPassword?: string;
}
