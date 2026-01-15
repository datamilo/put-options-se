export interface RecommendationFilters {
  expiryDate: string;
  rollingPeriod: number; // 30, 90, 180, 270, 365
  minDaysSinceBreak: number; // default: 10
  probabilityMethod: string; // default: 'ProbWorthless_Bayesian_IsoCal'
  historicalPeakThreshold: number; // 0.80, 0.90, 0.95
}

export interface ScoreWeights {
  supportStrength: number; // default: 20
  daysSinceBreak: number; // default: 15
  recoveryAdvantage: number; // default: 25
  historicalPeak: number; // default: 15
  monthlySeasonality: number; // default: 15
  currentPerformance: number; // default: 10
}

export interface ScoreComponent {
  raw: number | null;
  normalized: number;
  weighted: number;
  hasData: boolean;
  dataStatus: 'available' | 'insufficient' | 'unavailable'; // Track severity of data issue
}

export interface ScoreBreakdown {
  supportStrength: ScoreComponent;
  daysSinceBreak: ScoreComponent;
  recoveryAdvantage: ScoreComponent;
  historicalPeak: ScoreComponent;
  monthlySeasonality: ScoreComponent;
  currentPerformance: ScoreComponent;
}

export interface RecommendedOption {
  rank: number;
  optionName: string;
  stockName: string;
  strikePrice: number;
  currentPrice: number;
  expiryDate: string;
  daysToExpiry: number;
  premium: number;

  // Support metrics
  rollingLow: number | null;
  distanceToSupportPct: number | null;
  daysSinceLastBreak: number | null;
  supportStrengthScore: number | null;
  patternType: string | null;

  // Probability metrics
  currentProbability: number;
  historicalPeakProbability: number | null;

  // Recovery metrics
  recoveryAdvantage: number | null;
  currentProbBin: string | null;
  dteBin: string | null;

  // Monthly metrics
  monthlyPositiveRate: number | null;
  monthlyAvgReturn: number | null;
  typicalLowDay: number | null;
  currentMonthPerformance: number | null;
  monthsInHistoricalData: number | null;        // Number of historical months for this stock-month combo
  worstMonthDrawdown: number | null;            // Worst historical intra-month drawdown (open-to-low)

  // Event flags
  financialReport: string | null;               // 'Y' if financial report before expiry
  xDay: string | null;                          // 'Y' if ex-dividend date before expiry

  // Scoring
  compositeScore: number;
  scoreBreakdown: ScoreBreakdown;
}

export const DEFAULT_FILTERS: RecommendationFilters = {
  expiryDate: '',
  rollingPeriod: 365,
  minDaysSinceBreak: 10,
  probabilityMethod: 'ProbWorthless_Bayesian_IsoCal',
  historicalPeakThreshold: 0.90,
};

export const DEFAULT_WEIGHTS: ScoreWeights = {
  supportStrength: 20,
  daysSinceBreak: 15,
  recoveryAdvantage: 25,
  historicalPeak: 15,
  monthlySeasonality: 15,
  currentPerformance: 10,
};
