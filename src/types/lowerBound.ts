/**
 * Lower Bound Validation Analysis Types
 * Defines data structures for the lower bound prediction analysis dashboard
 */

/**
 * Daily prediction record
 * One entry per day per stock per option expiry
 */
export interface LowerBoundDailyPrediction {
  Stock: string;
  PredictionDate: string; // ISO date string (YYYY-MM-DD)
  ExpiryDate: string; // ISO date string (YYYY-MM-DD)
  StockPrice: number; // Stock price at prediction date
  LowerBound: number; // Predicted lower bound
  StrikePrice: number; // Strike price used for calculation
}

/**
 * Aggregated statistics for a specific stock expiry date
 */
export interface LowerBoundExpiryStatistic {
  Stock: string;
  ExpiryDate: string; // ISO date string (YYYY-MM-DD)
  LowerBound_Min: number; // Minimum predicted lower bound at this expiry
  LowerBound_Max: number; // Maximum predicted lower bound at this expiry
  LowerBound_Median: number; // Median predicted lower bound
  LowerBound_Mean: number; // Mean (average) predicted lower bound
  PredictionCount: number; // Number of predictions for this stock/expiry
  BreachCount: number; // Number of breaches at this expiry
  ExpiryClosePrice: number | null; // Actual close price at expiry
}

/**
 * Monthly aggregated hit rate data
 * Grouped by stock and expiry month
 */
export interface MonthlyTrendData {
  Stock: string;
  Date: string; // YYYY-MM format
  HitRate: number; // Hit rate percentage (0-100)
  Total: number; // Number of predictions expiring in this month
}

/**
 * Processed data for a single stock
 * Contains filtered and aggregated data for visualization
 */
export interface StockLowerBoundData {
  stock: string;
  dailyPredictions: LowerBoundDailyPrediction[];
  expiryStats: LowerBoundExpiryStatistic[];
  monthlyTrends: MonthlyTrendData[];
  totalPredictions: number;
  totalBreaches: number;
  overallHitRate: number; // Hit rate percentage (0-100)
  dateRange: {
    start: string; // ISO date
    end: string; // ISO date
  };
}

/**
 * Summary metrics for dashboard header
 */
export interface LowerBoundSummaryMetrics {
  totalOptions: number;
  totalStocks: number;
  overallHitRate: number; // Percentage (0-100)
  dateRangeStart: string; // ISO date
  dateRangeEnd: string; // ISO date
  totalBreaches: number;
}

/**
 * Aggregated data for all stocks
 * Used as cache/state for the entire dashboard
 */
export interface AllLowerBoundData {
  dailyPredictions: LowerBoundDailyPrediction[];
  expiryStats: LowerBoundExpiryStatistic[];
  monthlyTrends: MonthlyTrendData[];
  stocks: string[]; // List of unique stocks
  summaryMetrics: LowerBoundSummaryMetrics;
  lastUpdated: Date;
}

/**
 * Component props for Lower Bound Analysis
 */
export interface LowerBoundAnalysisProps {
  selectedStock?: string;
  onStockChange?: (stock: string) => void;
}

/**
 * Filter options for the dashboard
 */
export interface LowerBoundFilters {
  selectedStock: string;
  dateRangeStart?: string; // ISO date
  dateRangeEnd?: string; // ISO date
  minHitRate?: number; // Percentage (0-100)
  maxHitRate?: number; // Percentage (0-100)
}
