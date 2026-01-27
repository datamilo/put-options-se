/**
 * Types for Scored Options page
 * Handles both CSV data and enriched website data
 */

export interface ScoredOptionData {
  // Metadata from CSV
  date: string;
  stock_name: string;
  option_name: string;
  strike_price: number;
  expiry_date: string;
  days_to_expiry: number;

  // Probability (V2.1 Model)
  current_probability: number;

  // V2.1 Model
  v21_score: number;
  v21_bucket: string;
  v21_historical_peak: number;
  v21_support_strength: number;

  // TA Model
  ta_probability: number;
  ta_bucket: string;
  RSI_14: number;
  RSI_Slope: number;
  MACD_Hist: number;
  MACD_Slope: number;
  BB_Position: number;
  Dist_SMA50: number;
  Vol_Ratio: number;
  Sigma_Distance: number;
  HV_annual: number;

  // Agreement Analysis
  models_agree: boolean;
  agreement_strength: 'Strong' | 'Moderate' | 'Weak';
  combined_score: number;

  // Enriched from website (NOT from CSV)
  // Premium comes from useEnrichedOptionsData, NOT from CSV
  premium: number;
}

export interface ScoredOptionsFilters {
  expiryDate: string;
  stockNames: string[];
  agreement: 'all' | 'agree' | 'disagree';
  minScore: number;
  minV21Score: number;
  minTAProb: number;
}

export interface ScoredOptionsSummary {
  totalOptions: number;
  bothAgreeCount: number;
  strongAgreementCount: number;
  currentlyShowing: number;
}

/**
 * Raw CSV row structure (before enrichment)
 */
export interface RawScoredOptionRow {
  date: string;
  stock_name: string;
  option_name: string;
  strike_price: string;
  expiry_date: string;
  days_to_expiry: string;
  premium: string; // IGNORED - we use website premium instead
  current_probability: string;
  v21_score: string;
  v21_bucket: string;
  v21_historical_peak: string;
  v21_support_strength: string;
  ta_probability: string;
  ta_bucket: string;
  RSI_14: string;
  RSI_Slope: string;
  MACD_Hist: string;
  MACD_Slope: string;
  BB_Position: string;
  Dist_SMA50: string;
  Vol_Ratio: string;
  Sigma_Distance: string;
  HV_annual: string;
  models_agree: string; // 'True' or 'False'
  agreement_strength: string;
  combined_score: string;
}
