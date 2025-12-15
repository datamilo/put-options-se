#!/usr/bin/env python3
"""
Generate Support Level Metrics for all stocks and rolling periods.

This script calculates comprehensive support level analysis metrics for each stock
across multiple rolling periods (30, 90, 180, 270, 365 days). The output is a CSV
file that can be quickly loaded by the React frontend for instant filtering/sorting.

Output: data/support_level_metrics.csv

Metrics Calculated:
- Rolling low (support level)
- Support breaks and clusters
- Days since last break
- Support stability %
- Median/max drop per break
- Max consecutive breaks in history
- Current consecutive breaks
- Stability trend (improving/stable/weakening)
- Support strength score (0-100)
- Pattern classification
- Break probability estimates
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Constants
ROLLING_PERIODS = [30, 90, 180, 270, 365]
MAX_GAP_DAYS = 30  # Maximum days between breaks to consider them in same cluster

def load_stock_data(file_path: str) -> pd.DataFrame:
    """Load stock OHLC data from CSV."""
    print(f"Loading stock data from {file_path}...")
    df = pd.read_csv(file_path, sep='|')
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['name', 'date'])
    print(f"Loaded {len(df):,} rows for {df['name'].nunique()} stocks")
    return df

def calculate_rolling_low(stock_df: pd.DataFrame, period_days: int) -> pd.DataFrame:
    """
    Calculate rolling low for a stock over specified period.
    Returns DataFrame with date, rolling_low, and last_break_date.
    """
    result = []
    stock_df = stock_df.sort_values('date').reset_index(drop=True)

    for i in range(len(stock_df)):
        current_date = stock_df.loc[i, 'date']
        lookback_date = current_date - timedelta(days=period_days)

        # Get all rows within lookback window
        window = stock_df[(stock_df['date'] >= lookback_date) & (stock_df['date'] <= current_date)]

        if len(window) > 0:
            min_low_idx = window['low'].idxmin()
            rolling_low = window.loc[min_low_idx, 'low']
            last_break_date = window.loc[min_low_idx, 'date']
        else:
            rolling_low = None
            last_break_date = None

        result.append({
            'date': current_date,
            'close': stock_df.loc[i, 'close'],
            'low': stock_df.loc[i, 'low'],
            'rolling_low': rolling_low,
            'last_break_date': last_break_date
        })

    return pd.DataFrame(result)

def analyze_support_breaks(rolling_df: pd.DataFrame) -> List[Dict]:
    """
    Detect support breaks (when rolling low decreases).
    Returns list of break records.
    """
    breaks = []

    for i in range(1, len(rolling_df)):
        prev_low = rolling_df.iloc[i-1]['rolling_low']
        curr_low = rolling_df.iloc[i]['rolling_low']

        if pd.notna(prev_low) and pd.notna(curr_low) and curr_low < prev_low:
            drop_pct = ((curr_low - prev_low) / prev_low) * 100

            # Calculate days since previous break
            days_since = None
            if len(breaks) > 0:
                days_since = (rolling_df.iloc[i]['date'] - breaks[-1]['date']).days

            breaks.append({
                'date': rolling_df.iloc[i]['date'],
                'prev_support': prev_low,
                'new_support': curr_low,
                'drop_pct': drop_pct,
                'days_since': days_since
            })

    return breaks

def cluster_consecutive_breaks(breaks: List[Dict], max_gap: int) -> List[Dict]:
    """
    Cluster breaks that occur within max_gap days of each other.
    Returns list of cluster records with statistics.
    """
    if len(breaks) == 0:
        return []

    clusters = []
    current_cluster = [breaks[0]]

    for i in range(1, len(breaks)):
        days_diff = (breaks[i]['date'] - breaks[i-1]['date']).days

        if days_diff <= max_gap:
            current_cluster.append(breaks[i])
        else:
            if len(current_cluster) > 0:
                clusters.append(create_cluster_stats(len(clusters), current_cluster))
            current_cluster = [breaks[i]]

    # Add final cluster
    if len(current_cluster) > 0:
        clusters.append(create_cluster_stats(len(clusters), current_cluster))

    return clusters

def create_cluster_stats(cluster_id: int, cluster_breaks: List[Dict]) -> Dict:
    """Calculate statistics for a break cluster."""
    gaps = []
    for i in range(1, len(cluster_breaks)):
        gap = (cluster_breaks[i]['date'] - cluster_breaks[i-1]['date']).days
        gaps.append(gap)

    drops = [b['drop_pct'] for b in cluster_breaks]
    total_drop = sum(drops)

    return {
        'id': cluster_id,
        'num_breaks': len(cluster_breaks),
        'start_date': cluster_breaks[0]['date'],
        'end_date': cluster_breaks[-1]['date'],
        'duration_days': (cluster_breaks[-1]['date'] - cluster_breaks[0]['date']).days,
        'avg_gap': np.mean(gaps) if gaps else None,
        'min_gap': min(gaps) if gaps else None,
        'max_gap': max(gaps) if gaps else None,
        'total_drop': total_drop,
        'avg_drop': total_drop / len(cluster_breaks),
        'median_drop': np.median(drops),
        'breaks': cluster_breaks
    }

def calculate_stability_trend(rolling_df: pd.DataFrame, breaks: List[Dict]) -> str:
    """
    Calculate whether stability is improving, stable, or weakening.
    Compares first half vs second half of the period.
    """
    if len(rolling_df) < 10:  # Need minimum data
        return 'stable'

    mid_idx = len(rolling_df) // 2
    first_half = rolling_df.iloc[:mid_idx]
    second_half = rolling_df.iloc[mid_idx:]

    # Count breaks in each half
    first_half_dates = set(first_half['date'])
    second_half_dates = set(second_half['date'])

    first_half_breaks = sum(1 for b in breaks if b['date'] in first_half_dates)
    second_half_breaks = sum(1 for b in breaks if b['date'] in second_half_dates)

    # Calculate stability for each half
    first_stability = ((len(first_half) - first_half_breaks) / len(first_half)) * 100
    second_stability = ((len(second_half) - second_half_breaks) / len(second_half)) * 100

    # Determine trend (using 5% threshold to avoid noise)
    diff = second_stability - first_stability
    if diff > 5:
        return 'improving'
    elif diff < -5:
        return 'weakening'
    else:
        return 'stable'

def classify_pattern(stability: float, days_since_break: Optional[int],
                     max_consecutive: int, current_consecutive: int,
                     median_drop: Optional[float], total_breaks: int) -> str:
    """
    Classify the support pattern based on historical behavior.

    Patterns:
    - never_breaks: 100% stability over long period
    - exhausted_cascade: Currently in cluster near historical max
    - shallow_breaker: Low median drop per break
    - predictable_cycles: Regular break patterns
    - volatile: Frequent breaks with large drops
    - stable: Good stability, infrequent breaks
    """
    # Never breaks (or extremely rare)
    if stability >= 99.5:
        return 'never_breaks'

    # Exhausted cascade (current consecutive breaks >= 80% of historical max)
    if max_consecutive > 0 and current_consecutive >= 0.8 * max_consecutive:
        return 'exhausted_cascade'

    # Shallow breaker (median drop < 2%)
    if median_drop is not None and median_drop > -2.0:
        return 'shallow_breaker'

    # Volatile (stability < 70% and median drop < -5%)
    if stability < 70 and median_drop is not None and median_drop < -5.0:
        return 'volatile'

    # Stable (good stability, few breaks)
    if stability >= 85 and total_breaks < 10:
        return 'stable'

    # Predictable cycles (default for patterns that don't fit above)
    return 'predictable_cycles'

def calculate_support_strength_score(stability: float, days_since_break: Optional[int],
                                     trading_days_per_break: float, drop_std: float) -> float:
    """
    Calculate composite support strength score (0-100).

    Weights:
    - Support Stability: 30%
    - Days Since Break (normalized): 25%
    - Break Frequency (trading days per break): 25%
    - Consistency (inverse of drop std dev): 20%
    """
    # Stability component (0-100)
    stability_score = stability

    # Days since break component (0-100)
    # Normalize: 0 days = 0, 365+ days = 100
    if days_since_break is None:
        days_since_score = 100  # Never broken = perfect score
    else:
        days_since_score = min(100, (days_since_break / 365) * 100)

    # Break frequency component (0-100)
    # Normalize: 1 day per break = 0, 365+ days per break = 100
    frequency_score = min(100, (trading_days_per_break / 365) * 100)

    # Consistency component (0-100)
    # Lower std dev = higher score
    # Normalize: 0% std = 100, 10%+ std = 0
    consistency_score = max(0, 100 - (drop_std * 10))

    # Weighted average
    total_score = (
        stability_score * 0.30 +
        days_since_score * 0.25 +
        frequency_score * 0.25 +
        consistency_score * 0.20
    )

    return round(total_score, 2)

def estimate_break_probability(days_since_break: Optional[int],
                               avg_days_between: Optional[float],
                               stability: float,
                               days_ahead: int = 30) -> float:
    """
    Estimate probability of support breaking within days_ahead.

    Simple probability model based on:
    - Time since last break vs average time between breaks
    - Overall stability percentage
    """
    if avg_days_between is None or avg_days_between == 0:
        # No historical breaks - use stability as proxy
        return (100 - stability) / 100

    # If never broken in period, use stability
    if days_since_break is None:
        return (100 - stability) / 100

    # Calculate expected probability based on time elapsed
    # If days_since_break approaches avg_days_between, probability increases
    time_ratio = days_since_break / avg_days_between

    # Base probability from stability
    base_prob = (100 - stability) / 100

    # Adjust based on time elapsed (exponential increase as we approach average)
    # If time_ratio = 0 (just broke): low probability
    # If time_ratio = 1 (at average): moderate probability
    # If time_ratio > 1 (overdue): high probability
    time_factor = min(2.0, time_ratio)  # Cap at 2x

    # Combine factors
    probability = min(1.0, base_prob * (1 + time_factor) / 2)

    # Scale by forecast horizon (30 days)
    # If avg_days_between is much longer than 30 days, reduce probability
    horizon_factor = min(1.0, days_ahead / avg_days_between)

    return round(probability * horizon_factor, 4)

def get_current_consecutive_breaks(clusters: List[Dict], latest_date: datetime) -> int:
    """
    Count consecutive breaks in the most recent cluster (if still active).
    A cluster is considered "current" if it ended within MAX_GAP_DAYS.
    """
    if len(clusters) == 0:
        return 0

    last_cluster = clusters[-1]
    days_since_cluster_end = (latest_date - last_cluster['end_date']).days

    # If the last cluster ended recently (within gap window), count its breaks
    if days_since_cluster_end <= MAX_GAP_DAYS:
        return last_cluster['num_breaks']

    return 0

def analyze_stock_period(stock_name: str, stock_df: pd.DataFrame,
                         period_days: int, latest_date: datetime) -> Dict:
    """
    Comprehensive analysis for a single stock and rolling period.
    Returns dictionary with all calculated metrics.
    """
    # Calculate rolling low
    rolling_df = calculate_rolling_low(stock_df, period_days)

    # Get current price and rolling low
    latest_data = rolling_df.iloc[-1]
    current_price = latest_data['close']
    current_rolling_low = latest_data['rolling_low']

    # Analyze breaks
    breaks = analyze_support_breaks(rolling_df)
    clusters = cluster_consecutive_breaks(breaks, MAX_GAP_DAYS)

    # Calculate basic statistics
    total_days = len(rolling_df)
    total_breaks = len(breaks)
    stability = ((total_days - total_breaks) / total_days * 100) if total_days > 0 else 100

    # Days since last break
    days_since_break = None
    last_break_date = None
    if total_breaks > 0:
        last_break_date = breaks[-1]['date']
        days_since_break = (latest_date - last_break_date).days

    # Drop statistics
    if total_breaks > 0:
        drops = [b['drop_pct'] for b in breaks]
        median_drop = np.median(drops)
        avg_drop = np.mean(drops)
        max_drop = min(drops)  # Most negative = biggest drop
        drop_std = np.std(drops)
    else:
        median_drop = None
        avg_drop = None
        max_drop = None
        drop_std = 0.0

    # Days between breaks
    days_between = [b['days_since'] for b in breaks if b['days_since'] is not None]
    avg_days_between = np.mean(days_between) if days_between else None
    median_days_between = np.median(days_between) if days_between else None

    # Trading days per break
    trading_days_per_break = total_days / total_breaks if total_breaks > 0 else total_days

    # Cluster statistics
    max_consecutive_breaks = max([c['num_breaks'] for c in clusters]) if clusters else 0
    current_consecutive_breaks = get_current_consecutive_breaks(clusters, latest_date)
    num_clusters = len(clusters)

    # Advanced metrics
    stability_trend = calculate_stability_trend(rolling_df, breaks)

    support_strength_score = calculate_support_strength_score(
        stability, days_since_break, trading_days_per_break, drop_std
    )

    pattern_type = classify_pattern(
        stability, days_since_break, max_consecutive_breaks,
        current_consecutive_breaks, median_drop, total_breaks
    )

    break_probability_30d = estimate_break_probability(
        days_since_break, avg_days_between, stability, days_ahead=30
    )

    break_probability_60d = estimate_break_probability(
        days_since_break, avg_days_between, stability, days_ahead=60
    )

    # Return comprehensive metrics
    return {
        'stock_name': stock_name,
        'rolling_period': period_days,
        'current_price': round(current_price, 2) if pd.notna(current_price) else None,
        'rolling_low': round(current_rolling_low, 2) if pd.notna(current_rolling_low) else None,
        'distance_to_support_pct': round(((current_rolling_low - current_price) / current_price * 100), 2)
                                   if pd.notna(current_rolling_low) and current_price > 0 else None,

        # Break statistics
        'total_breaks': total_breaks,
        'days_since_last_break': days_since_break,
        'last_break_date': last_break_date.strftime('%Y-%m-%d') if last_break_date else None,

        # Stability metrics
        'support_stability_pct': round(stability, 2),
        'stability_trend': stability_trend,

        # Drop statistics
        'median_drop_per_break_pct': round(median_drop, 2) if median_drop is not None else None,
        'avg_drop_per_break_pct': round(avg_drop, 2) if avg_drop is not None else None,
        'max_drop_pct': round(max_drop, 2) if max_drop is not None else None,
        'drop_std_dev_pct': round(drop_std, 2),

        # Frequency metrics
        'avg_days_between_breaks': round(avg_days_between, 1) if avg_days_between else None,
        'median_days_between_breaks': round(median_days_between, 1) if median_days_between else None,
        'trading_days_per_break': round(trading_days_per_break, 1),

        # Cluster statistics
        'num_clusters': num_clusters,
        'max_consecutive_breaks': max_consecutive_breaks,
        'current_consecutive_breaks': current_consecutive_breaks,

        # Advanced metrics
        'support_strength_score': support_strength_score,
        'pattern_type': pattern_type,
        'break_probability_30d': break_probability_30d,
        'break_probability_60d': break_probability_60d,

        # Metadata
        'last_calculated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'data_through_date': latest_date.strftime('%Y-%m-%d'),
    }

def main():
    """Main execution function."""
    print("=" * 80)
    print("Support Level Metrics Generator")
    print("=" * 80)

    # Setup paths
    base_dir = Path(__file__).parent
    data_dir = base_dir / 'data'
    stock_data_path = data_dir / 'stock_data.csv'
    output_path = data_dir / 'support_level_metrics.csv'

    # Load data
    stock_data = load_stock_data(stock_data_path)
    stocks = sorted(stock_data['name'].unique())
    latest_date = stock_data['date'].max()

    print(f"\nAnalyzing {len(stocks)} stocks across {len(ROLLING_PERIODS)} rolling periods...")
    print(f"Data through: {latest_date.strftime('%Y-%m-%d')}\n")

    # Calculate metrics for all stocks and periods
    all_metrics = []
    total_analyses = len(stocks) * len(ROLLING_PERIODS)
    count = 0

    for stock in stocks:
        stock_df = stock_data[stock_data['name'] == stock].copy()

        for period in ROLLING_PERIODS:
            count += 1
            print(f"[{count}/{total_analyses}] Analyzing {stock} - {period} days...", end='\r')

            metrics = analyze_stock_period(stock, stock_df, period, latest_date)
            all_metrics.append(metrics)

    print("\n\nCompleted all analyses!")

    # Convert to DataFrame and save
    metrics_df = pd.DataFrame(all_metrics)
    metrics_df.to_csv(output_path, index=False)

    print(f"\n✓ Saved metrics to: {output_path}")
    print(f"  Total rows: {len(metrics_df):,}")
    print(f"  File size: {output_path.stat().st_size / 1024:.1f} KB")

    # Print summary statistics
    print("\n" + "=" * 80)
    print("Summary Statistics")
    print("=" * 80)

    for period in ROLLING_PERIODS:
        period_df = metrics_df[metrics_df['rolling_period'] == period]
        print(f"\n{period}-day period:")
        print(f"  Avg Support Strength Score: {period_df['support_strength_score'].mean():.1f}")
        print(f"  Avg Stability: {period_df['support_stability_pct'].mean():.1f}%")
        print(f"  Stocks with 100% stability: {(period_df['support_stability_pct'] == 100).sum()}")

        # Pattern distribution
        patterns = period_df['pattern_type'].value_counts()
        print(f"  Pattern distribution:")
        for pattern, count in patterns.items():
            print(f"    - {pattern}: {count}")

    print("\n" + "=" * 80)
    print("Done!")
    print("=" * 80)

if __name__ == '__main__':
    main()
