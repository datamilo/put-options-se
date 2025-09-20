export interface VolatilityEventData {
  date: string;
  year: number;
  month: number;
  name: string;
  type_of_event: string;
  event_value: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volume_pct_change_from_previous_day: number;
  close_price_pct_change_from_previous_day: number;
  intraday_high_low_price_diff: number;
  pct_intraday_high_low_movement: number;
  pct_intraday_open_close_movement: number;
}

export interface VolatilityStats {
  name: string;
  count: number;
  mean_change: number;
  median_change: number;
  std_dev: number;
  min_change: number;
  max_change: number;
  p05: number;
  p95: number;
  mean_abs_change: number;
  negative_count: number;
  negative_rate: number;
  se_mean: number;
  ci95_low: number;
  ci95_high: number;
  avg_volume_pct_change: number;
  avg_intraday_spread_pct: number;
  min_event_type: string;
  min_event_date: string;
  max_event_type: string;
  max_event_date: string;
}