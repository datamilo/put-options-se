export interface StockData {
  date: string;
  name: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  pct_change_close: number;
}

export interface StockSummary {
  name: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  priceChangePercentWeek: number;
  priceChangePercentMonth: number;
  priceChangePercentYear: number;
  volume: number;
  medianVolume: number;
  highPrice52Week: number;
  lowPrice52Week: number;
  volatility: number;
}