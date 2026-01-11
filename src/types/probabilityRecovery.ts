export interface ProbabilityRecoveryData {
  DataType: 'scenario' | 'stock';
  Stock: string;
  HistoricalPeakThreshold: number;
  ProbMethod: string;
  CurrentProb_Bin: string;
  DTE_Bin: string;
  RecoveryCandidate_N: number;
  RecoveryCandidate_WorthlessCount: number;
  RecoveryCandidate_WorthlessRate_pct: number;
  AllOptions_N: number;
  AllOptions_WorthlessCount: number;
  AllOptions_WorthlessRate_pct: number;
  RecoveryAdvantage_pp: number;
}

export interface RecoveryScenario extends ProbabilityRecoveryData {
  DataType: 'scenario';
}

export interface RecoveryStockData extends ProbabilityRecoveryData {
  DataType: 'stock';
}

export interface RecoveryMetrics {
  bestAdvantage: number;
  recoveryCandidates: number;
  baselineN: number;
  averagePremiumAdvantage: number;
}
