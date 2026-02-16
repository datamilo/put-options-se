// src/types/ivAnalysis.ts

export interface IVPerStockPerDay {
  Stock_Name: string;
  Date: string;           // YYYY-MM-DD
  Stock_Price: number;
  IV_30d: number | null;  // null for 67 rows with no_data method
}

export interface IVStockSummary {
  stockName: string;
  latestDate: string;
  currentIV: number | null;
  currentStockPrice: number;
  ivRank52w: number | null;   // 0-100
  ivRankAllTime: number | null; // 0-100
  ivChange1d: number | null;  // absolute pp difference
  ivChange5d: number | null;  // absolute pp difference
}
