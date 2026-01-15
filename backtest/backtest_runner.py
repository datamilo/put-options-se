"""
Backtest Runner for Automated Recommendations

This script runs historical backtest of the scoring system.
It calculates scores for options on historical dates and tracks outcomes.

Usage:
    python backtest_runner.py --start-date 2025-12-01 --end-date 2026-01-17

Author: Put Options SE
Date: January 2026
"""

import argparse
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple
import sys

from scoring_engine import ScoringEngine, get_probability_bin, get_dte_bin
from data_loader import DataLoader


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='Backtest Automated Recommendations scoring system'
    )

    parser.add_argument(
        '--start-date',
        type=str,
        required=True,
        help='Start date for backtest (YYYY-MM-DD)'
    )

    parser.add_argument(
        '--end-date',
        type=str,
        required=True,
        help='End date for backtest (YYYY-MM-DD)'
    )

    parser.add_argument(
        '--data-dir',
        type=str,
        default='../data',
        help='Path to data directory (default: ../data)'
    )

    parser.add_argument(
        '--output-dir',
        type=str,
        default='./results',
        help='Path to output directory (default: ./results)'
    )

    parser.add_argument(
        '--rolling-period',
        type=int,
        default=365,
        choices=[30, 90, 180, 270, 365],
        help='Rolling period for support levels (default: 365)'
    )

    parser.add_argument(
        '--min-days-since-break',
        type=int,
        default=10,
        help='Minimum days since last support break (default: 10)'
    )

    parser.add_argument(
        '--probability-method',
        type=str,
        default='ProbWorthless_Bayesian_IsoCal',
        choices=[
            'ProbWorthless_Bayesian_IsoCal',
            '1_2_3_ProbOfWorthless_Weighted',
            '1_ProbOfWorthless_Original',
            '2_ProbOfWorthless_Calibrated',
            '3_ProbOfWorthless_Historical_IV'
        ],
        help='Probability method to use (default: Bayesian Calibrated)'
    )

    parser.add_argument(
        '--historical-peak-threshold',
        type=float,
        default=0.90,
        choices=[0.80, 0.90, 0.95],
        help='Historical peak threshold (default: 0.90)'
    )

    return parser.parse_args()


def map_prob_method_to_recovery_method(field_name: str) -> str:
    """
    Map probability field name to recovery data method name.

    Args:
        field_name: Field name from options data

    Returns:
        Method name used in recovery data
    """
    method_map = {
        'ProbWorthless_Bayesian_IsoCal': 'Bayesian Calibrated',
        '1_2_3_ProbOfWorthless_Weighted': 'Weighted Average',
        '1_ProbOfWorthless_Original': 'Original Black-Scholes',
        '2_ProbOfWorthless_Calibrated': 'Bias Corrected',
        '3_ProbOfWorthless_Historical_IV': 'Historical IV'
    }
    return method_map.get(field_name, field_name)


def calculate_days_to_expiry(expiry_date: datetime, current_date: datetime) -> int:
    """
    Calculate business days to expiry.

    Note: This is a simplified version. The upstream team should implement
    proper business day calculation excluding weekends and Swedish holidays.

    Args:
        expiry_date: Option expiration date
        current_date: Current date

    Returns:
        Business days to expiry (approximate)
    """
    delta = (expiry_date - current_date).days

    # Rough approximation: 5/7 of calendar days
    # Upstream team should use proper business day calculation
    return int(delta * 5 / 7)


def determine_option_outcome(
    option_name: str,
    expiry_date: datetime,
    strike_price: float,
    stock_name: str,
    stock_data: pd.DataFrame
) -> Optional[str]:
    """
    Determine if option expired worthless or ITM.

    Args:
        option_name: Option name
        expiry_date: Expiration date
        strike_price: Strike price
        stock_name: Stock name
        stock_data: DataFrame with daily stock prices

    Returns:
        "worthless" if stock > strike at expiry, "ITM" if stock <= strike, None if data missing
    """
    # Find stock price on expiry date
    expiry_prices = stock_data[
        (stock_data['name'] == stock_name) &
        (stock_data['date'] == expiry_date)
    ]

    if len(expiry_prices) == 0:
        print(f"⚠️ Warning: No stock price found for {stock_name} on {expiry_date}")
        return None

    final_price = expiry_prices.iloc[0]['close']

    # Put option expires worthless if stock price > strike price
    if final_price > strike_price:
        return 'worthless'
    else:
        return 'ITM'


def run_backtest(
    start_date: datetime,
    end_date: datetime,
    data_loader: DataLoader,
    args
) -> pd.DataFrame:
    """
    Run backtest over date range.

    For each date in range:
    1. Get all active options (not yet expired)
    2. Calculate composite score for each option
    3. Record scores
    4. When options expire, record outcomes

    Args:
        start_date: Start date for backtest
        end_date: End date for backtest
        data_loader: DataLoader instance
        args: Command line arguments

    Returns:
        DataFrame with backtest results
    """
    print(f"\n{'='*80}")
    print(f"BACKTEST: {start_date.date()} to {end_date.date()}")
    print(f"{'='*80}\n")

    # Load all data
    print("Loading data files...")
    options_df = data_loader.load_options_data()
    stock_df = data_loader.load_stock_data()

    # Initialize scoring engine
    engine = ScoringEngine()

    # Results storage
    results = []

    # Get date range (all trading days)
    trading_days = stock_df['date'].unique()
    trading_days = sorted([d for d in trading_days if start_date <= d <= end_date])

    print(f"\nProcessing {len(trading_days)} trading days...\n")

    # For each trading day
    for i, current_date in enumerate(trading_days):
        current_date = pd.Timestamp(current_date)

        if (i + 1) % 10 == 0:
            print(f"Progress: {i+1}/{len(trading_days)} days ({(i+1)/len(trading_days)*100:.1f}%)")

        # Get options active on this date (expiry date >= current date)
        active_options = options_df[options_df['ExpiryDate'] >= current_date]

        # Filter by min days to expiry (e.g., only look at options 1-45 days out)
        # This can be adjusted based on your needs
        options_to_score = []

        for _, option in active_options.iterrows():
            days_to_expiry = calculate_days_to_expiry(option['ExpiryDate'], current_date)

            # Filter criteria (adjust as needed)
            if days_to_expiry < 1 or days_to_expiry > 45:
                continue

            # Get support metrics
            support_metrics = data_loader.get_support_metrics_for_stock(
                option['StockName'],
                args.rolling_period
            )

            if support_metrics is None:
                continue

            # Filter by days since break
            if support_metrics.get('days_since_last_break', 0) < args.min_days_since_break:
                continue

            # Filter by strike vs rolling low
            rolling_low = support_metrics.get('rolling_low')
            if rolling_low is None or option['StrikePrice'] > rolling_low:
                continue

            options_to_score.append(option)

        # Score each option
        for option in options_to_score:
            try:
                # Get all required data
                stock_name = option['StockName']
                option_name = option['OptionName']

                # Support metrics
                support_metrics = data_loader.get_support_metrics_for_stock(
                    stock_name,
                    args.rolling_period
                )

                # Probability peak
                probability_peak = data_loader.get_probability_peak(
                    option_name,
                    args.probability_method
                )

                # Current probability
                current_probability = option.get(args.probability_method, 0)

                # Recovery rate
                prob_bin = get_probability_bin(current_probability)
                dte_bin = get_dte_bin(calculate_days_to_expiry(option['ExpiryDate'], current_date))

                recovery_method = map_prob_method_to_recovery_method(args.probability_method)
                recovery_rate = data_loader.get_recovery_rate(
                    args.historical_peak_threshold,
                    recovery_method,
                    prob_bin,
                    dte_bin
                )

                # Monthly stats
                month = current_date.month
                monthly_stats = data_loader.get_monthly_stats_for_stock(stock_name, month)

                # Current month performance
                current_month_perf = data_loader.get_current_month_performance(
                    stock_name,
                    current_date
                )

                # Calculate score
                composite_score, score_breakdown = engine.calculate_score(
                    support_strength_score=support_metrics.get('support_strength_score'),
                    days_since_last_break=support_metrics.get('days_since_last_break'),
                    trading_days_per_break=support_metrics.get('trading_days_per_break'),
                    current_probability=current_probability,
                    historical_peak_probability=probability_peak,
                    historical_peak_threshold=args.historical_peak_threshold,
                    recovery_advantage=recovery_rate,
                    monthly_positive_rate=monthly_stats.get('pct_pos_return_months') if monthly_stats else None,
                    monthly_avg_return=monthly_stats.get('return_month_mean_pct_return_month') if monthly_stats else None,
                    typical_low_day=monthly_stats.get('day_low_day_of_month') if monthly_stats else None,
                    current_day=current_date.day,
                    current_month_performance=current_month_perf
                )

                # Determine outcome (if option has expired by end_date)
                outcome = None
                if option['ExpiryDate'] <= end_date:
                    outcome = determine_option_outcome(
                        option_name,
                        option['ExpiryDate'],
                        option['StrikePrice'],
                        stock_name,
                        stock_df
                    )

                # Store result
                results.append({
                    'date': current_date,
                    'option_name': option_name,
                    'stock_name': stock_name,
                    'strike_price': option['StrikePrice'],
                    'expiry_date': option['ExpiryDate'],
                    'days_to_expiry': calculate_days_to_expiry(option['ExpiryDate'], current_date),
                    'current_probability': current_probability,
                    'composite_score': composite_score,
                    'outcome': outcome,
                    'premium': option.get('Premium', 0),
                    **{f'score_{k}': v['weighted'] for k, v in score_breakdown.items()}
                })

            except Exception as e:
                print(f"⚠️ Error scoring {option['OptionName']}: {e}")
                continue

    print(f"\n✓ Backtest complete. Generated {len(results)} scored records.\n")

    return pd.DataFrame(results)


def analyze_results(results_df: pd.DataFrame) -> Dict:
    """
    Analyze backtest results.

    Calculate:
    - Hit rates by score bucket
    - Factor importance
    - Statistical metrics

    Args:
        results_df: DataFrame with backtest results

    Returns:
        Dict with analysis results
    """
    print(f"\n{'='*80}")
    print("ANALYSIS")
    print(f"{'='*80}\n")

    # Filter to options with known outcomes
    with_outcomes = results_df[results_df['outcome'].notna()]

    if len(with_outcomes) == 0:
        print("⚠️ No options with outcomes found. Cannot analyze.")
        return {}

    print(f"Total options with outcomes: {len(with_outcomes)}")
    print(f"  - Expired worthless: {(with_outcomes['outcome'] == 'worthless').sum()}")
    print(f"  - Expired ITM: {(with_outcomes['outcome'] == 'ITM').sum()}")

    # Hit rates by score bucket
    print(f"\n{'='*80}")
    print("HIT RATES BY SCORE BUCKET")
    print(f"{'='*80}\n")

    score_buckets = [
        (90, 100, "90-100"),
        (80, 90, "80-90"),
        (70, 80, "70-80"),
        (60, 70, "60-70"),
        (50, 60, "50-60"),
        (0, 50, "<50")
    ]

    hit_rate_results = []

    for min_score, max_score, label in score_buckets:
        bucket_options = with_outcomes[
            (with_outcomes['composite_score'] >= min_score) &
            (with_outcomes['composite_score'] < max_score)
        ]

        if len(bucket_options) == 0:
            continue

        worthless_count = (bucket_options['outcome'] == 'worthless').sum()
        hit_rate = worthless_count / len(bucket_options) * 100

        print(f"Score {label:>8}: {hit_rate:5.1f}% worthless (n={len(bucket_options):4})")

        hit_rate_results.append({
            'score_bucket': label,
            'min_score': min_score,
            'max_score': max_score,
            'n': len(bucket_options),
            'worthless_count': worthless_count,
            'hit_rate_pct': hit_rate
        })

    # Overall statistics
    print(f"\n{'='*80}")
    print("OVERALL STATISTICS")
    print(f"{'='*80}\n")

    overall_hit_rate = (with_outcomes['outcome'] == 'worthless').sum() / len(with_outcomes) * 100
    print(f"Overall hit rate: {overall_hit_rate:.1f}%")

    avg_score = with_outcomes['composite_score'].mean()
    print(f"Average composite score: {avg_score:.1f}")

    # Top vs bottom quartile comparison
    top_quartile_threshold = with_outcomes['composite_score'].quantile(0.75)
    bottom_quartile_threshold = with_outcomes['composite_score'].quantile(0.25)

    top_quartile = with_outcomes[with_outcomes['composite_score'] >= top_quartile_threshold]
    bottom_quartile = with_outcomes[with_outcomes['composite_score'] <= bottom_quartile_threshold]

    top_hit_rate = (top_quartile['outcome'] == 'worthless').sum() / len(top_quartile) * 100
    bottom_hit_rate = (bottom_quartile['outcome'] == 'worthless').sum() / len(bottom_quartile) * 100

    print(f"\nTop 25% of scores: {top_hit_rate:.1f}% worthless (n={len(top_quartile)})")
    print(f"Bottom 25% of scores: {bottom_hit_rate:.1f}% worthless (n={len(bottom_quartile)})")
    print(f"Difference: {top_hit_rate - bottom_hit_rate:+.1f} percentage points")

    return {
        'hit_rates': hit_rate_results,
        'overall_hit_rate': overall_hit_rate,
        'avg_score': avg_score,
        'top_quartile_hit_rate': top_hit_rate,
        'bottom_quartile_hit_rate': bottom_hit_rate,
        'score_spread': top_hit_rate - bottom_hit_rate
    }


def main():
    """Main entry point."""
    args = parse_args()

    # Parse dates
    try:
        start_date = datetime.strptime(args.start_date, '%Y-%m-%d')
        end_date = datetime.strptime(args.end_date, '%Y-%m-%d')
    except ValueError as e:
        print(f"Error parsing dates: {e}")
        sys.exit(1)

    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True, parents=True)

    # Initialize data loader
    data_loader = DataLoader(args.data_dir)

    # Run backtest
    results_df = run_backtest(start_date, end_date, data_loader, args)

    # Save raw results
    results_file = output_dir / f"backtest_results_{args.start_date}_{args.end_date}.csv"
    results_df.to_csv(results_file, index=False)
    print(f"✓ Saved results to: {results_file}")

    # Analyze results
    analysis = analyze_results(results_df)

    # Save analysis
    if analysis:
        hit_rates_df = pd.DataFrame(analysis['hit_rates'])
        hit_rates_file = output_dir / f"hit_rates_{args.start_date}_{args.end_date}.csv"
        hit_rates_df.to_csv(hit_rates_file, index=False)
        print(f"✓ Saved hit rate analysis to: {hit_rates_file}")

    print(f"\n{'='*80}")
    print("BACKTEST COMPLETE")
    print(f"{'='*80}\n")


if __name__ == '__main__':
    main()
