export interface ProbabilityRecoveryData {
  DataType: 'scenario' | 'stock';
  Stock: string;
  HistoricalPeakThreshold: number;
  ProbMethod: string;
  CurrentProb_Bin: string;
  DTE_Bin: string;
  RecoveryCandidate_N: number;
  RecoveryCandidate_WorthlessRate: number;
  RecoveryCandidate_AvgCurrentProb: number;
  RecoveryCandidate_AvgPeakProb: number;
  RecoveryCandidate_Premium_pp: number;
  Baseline_N: number;
  Baseline_WorthlessRate: number;
  Baseline_AvgCurrentProb: number;
  Baseline_AvgPeakProb: number;
  Baseline_Premium_pp: number;
  Advantage_pp: number;
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
