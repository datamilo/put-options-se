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

  // Probability Optimization Model
  current_probability: number;

  // Probability Optimization Model
  v21_score: number | null;
  v21_bucket: string;
  v21_historical_peak: number | null;
  v21_support_strength: number | null;

  // TA Model
  ta_probability: number | null;
  ta_bucket: string;
  // Stock-level technical indicators
  RSI_14: number | null;
  RSI_Slope: number | null;
  MACD_Hist: number | null;
  MACD_Slope: number | null;
  BB_Position: number | null;
  Dist_SMA50: number | null;
  Vol_Ratio: number | null;
  ADX_14: number | null;
  ADX_Slope: number | null;
  ATR_14: number | null;
  Stochastic_K: number | null;
  Stochastic_D: number | null;
  // Contract-level indicators
  Sigma_Distance: number | null;
  Greeks_Delta: number | null;
  Greeks_Vega: number | null;
  Greeks_Theta: number | null;

  // Agreement Analysis
  models_agree: boolean;
  agreement_strength: 'Strong' | 'Moderate' | 'Weak';
  combined_score: number | null;

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
  ADX_14: string;
  ADX_Slope: string;
  ATR_14: string;
  Stochastic_K: string;
  Stochastic_D: string;
  Sigma_Distance: string;
  Days_To_Expiry: string;
  Greeks_Delta: string;
  Greeks_Vega: string;
  Greeks_Theta: string;
  models_agree: string; // 'True' or 'False'
  agreement_strength: string;
  combined_score: string;
}
