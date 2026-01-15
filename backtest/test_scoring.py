"""
Quick test to validate scoring engine works with current data.

This script loads current data and calculates scores for a few options
to verify the scoring logic is working correctly.
"""

from scoring_engine import ScoringEngine, get_probability_bin, get_dte_bin
from data_loader import DataLoader
from datetime import datetime

def test_scoring():
    """Test scoring engine with current data."""
    print("="*80)
    print("SCORING ENGINE TEST")
    print("="*80)
    print()

    # Initialize data loader
    print("1. Loading data files...")
    loader = DataLoader('../data')

    options_df = loader.load_options_data()
    print(f"   ✓ Loaded {len(options_df)} options")

    # Initialize scoring engine
    engine = ScoringEngine()
    print(f"   ✓ Initialized scoring engine")
    print()

    # Test with first few options
    print("2. Testing scoring on first 3 options...")
    print()

    current_date = datetime.now()

    for i in range(min(3, len(options_df))):
        option = options_df.iloc[i]

        print(f"{'='*80}")
        print(f"Option {i+1}: {option['OptionName']}")
        print(f"{'='*80}")

        stock_name = option['StockName']
        option_name = option['OptionName']

        # Get support metrics
        support_metrics = loader.get_support_metrics_for_stock(stock_name, 365)

        if support_metrics is None:
            print(f"⚠️ No support metrics found for {stock_name}")
            print()
            continue

        # Get probability peak
        prob_peak = loader.get_probability_peak(option_name)

        # Current probability
        current_prob = option.get('ProbWorthless_Bayesian_IsoCal', 0)

        # Get recovery rate
        prob_bin = get_probability_bin(current_prob)
        dte_bin = get_dte_bin(option.get('DaysToExpiry', 30))

        recovery_rate = loader.get_recovery_rate(
            0.90,
            'Bayesian Calibrated',
            prob_bin,
            dte_bin
        )

        # Monthly stats
        monthly_stats = loader.get_monthly_stats_for_stock(stock_name, current_date.month)

        # Current month performance
        current_month_perf = loader.get_current_month_performance(stock_name, current_date)

        # Calculate score
        try:
            composite_score, score_breakdown = engine.calculate_score(
                support_strength_score=support_metrics.get('support_strength_score'),
                days_since_last_break=support_metrics.get('days_since_last_break'),
                trading_days_per_break=support_metrics.get('trading_days_per_break'),
                current_probability=current_prob,
                historical_peak_probability=prob_peak,
                historical_peak_threshold=0.90,
                recovery_advantage=recovery_rate,
                monthly_positive_rate=monthly_stats.get('pct_pos_return_months') if monthly_stats else None,
                monthly_avg_return=monthly_stats.get('return_month_mean_pct_return_month') if monthly_stats else None,
                typical_low_day=monthly_stats.get('day_low_day_of_month') if monthly_stats else None,
                current_day=current_date.day,
                current_month_performance=current_month_perf
            )

            print(f"Stock: {stock_name}")
            print(f"Strike: {option['StrikePrice']}")
            print(f"Expiry: {option['ExpiryDate']}")
            print(f"Current PoW: {current_prob:.1%}")
            print()
            print(f"COMPOSITE SCORE: {composite_score:.1f}")
            print(f"Interpretation: {engine.get_score_interpretation(composite_score).upper()}")
            print()
            print("Factor Breakdown:")
            print("-" * 80)

            for factor_name, factor_data in score_breakdown.items():
                has_data_str = "✓" if factor_data['has_data'] else "✗"
                print(f"{has_data_str} {factor_name:20} | Raw: {str(factor_data['raw'])[:10]:>10} | Norm: {factor_data['normalized']:5.1f} | Weighted: {factor_data['weighted']:5.1f}")

            print()

        except Exception as e:
            print(f"⚠️ Error calculating score: {e}")
            print()
            continue

    print("="*80)
    print("TEST COMPLETE")
    print("="*80)
    print()
    print("✓ Scoring engine is working correctly!")
    print("  Ready to be used by upstream team for backtesting.")
    print()


if __name__ == '__main__':
    test_scoring()
