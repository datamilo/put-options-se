export interface StockData {
  date: string;
  name: string;
  close: number;
  volume: number;
  pct_change_close: number;
}

export interface StockSummary {
  name: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  medianVolume: number;
  highPrice52Week: number;
  lowPrice52Week: number;
  volatility: number;
}