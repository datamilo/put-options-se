export interface RollingLowData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rolling_low: number | null;
  last_break_date?: string | null;
}

export interface SupportBreak {
  date: string;
  prev_support: number;
  new_support: number;
  drop_pct: number;
  days_since: number | null;
}

export interface BreakCluster {
  id: number;
  breaks: SupportBreak[];
  num_breaks: number;
  start_date: string;
  end_date: string;
  duration_days: number;
  avg_gap?: number;
  min_gap?: number;
  max_gap?: number;
  total_drop: number;
  avg_drop: number;
  median_drop: number;
}

export interface BreakStatistics {
  totalBreaks: number;
  stability: number;
  avgDrop: number;
  maxDrop: number;
  avgDaysBetween: number | null;
  medianDaysBetween: number | null;
  minDaysBetween: number | null;
  maxDaysBetween: number | null;
  daysSinceLastBreak: number;
  daysBeforeFirstBreak: number;
  tradingDaysPerBreak: number;
  firstBreakDate: string;
  lastBreakDate: string;
}

export interface ConsecutiveBreaksAnalysis {
  stockName: string;
  data: RollingLowData[];
  breaks: SupportBreak[];
  clusters: BreakCluster[];
  stats: BreakStatistics | null;
}
