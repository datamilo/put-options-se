export interface ProbabilityValidationData {
  DataType: 'metrics' | 'calibration_aggregated' | 'calibration_by_dte' | 'calibration_by_stock';
  Stock: string;
  DTE_Bin: string;
  ProbMethod: string;
  Bin: string;
  PredictedProb: number;
  ActualRate: number;
  Count: number;
  CalibrationError: number;
  Brier_Score: number;
  AUC_ROC: number;
  Log_Loss: number;
  Expected_Calibration_Error: number;
}

export interface ValidationMetrics extends ProbabilityValidationData {
  DataType: 'metrics';
}

export interface CalibrationData extends ProbabilityValidationData {
  DataType: 'calibration_aggregated' | 'calibration_by_dte' | 'calibration_by_stock';
}

export interface MethodPerformance {
  method: string;
  brierScore: number;
  aucRoc: number;
  logLoss: number;
  calibrationError: number;
  sampleSize: number;
}

export interface CalibrationPoint {
  predicted: number;
  actual: number;
  count: number;
  method: string;
}
