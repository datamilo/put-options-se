// src/types/ivAnalysis.ts

export interface IVPerStockPerDay {
  Stock_Name: string;
  Date: string;           // YYYY-MM-DD
  Stock_Price: number;
  IV_30d: number | null;  // null for 67 rows with no_data method
  N_Stocks: number | null;   // populated only for MARKET_IV rows
  N_Excluded: number | null; // populated only for MARKET_IV rows
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

export interface IVMarketSummary {
  latestDate: string;
  currentIV: number | null;
  ivRank52w: number | null;
  ivRankAllTime: number | null;
  ivChange1d: number | null;
  ivChange5d: number | null;
  nStocks: number | null;
  nExcluded: number | null;
}
