"""
Automated Recommendations Scoring Engine

This module replicates the exact scoring logic from the Put Options SE website's
Automated Recommendations feature (useAutomatedRecommendations.ts).

The scoring system evaluates options using 6 weighted factors:
1. Recovery Advantage (25%) - Historical worthless rate for recovery candidates
2. Support Strength (20%) - Pre-calculated support level robustness
3. Days Since Break (15%) - Time since support was last broken
4. Historical Peak (15%) - Whether option previously peaked above threshold
5. Monthly Seasonality (15%) - Historical % of positive months
6. Current Performance (10%) - Month-to-date underperformance vs average

Each factor is normalized to 0-100, then weighted to produce a composite score (0-100).

Author: Generated from Put Options SE frontend code
Date: January 2026
"""

from typing import Dict, Optional, Tuple
from datetime import datetime
import math


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_probability_bin(prob: float) -> str:
    """
    Categorize probability into bins for recovery data lookup.

    Args:
        prob: Probability value (0-1 range)

    Returns:
        Bin name (e.g., "50-60%", "70-80%")
    """
    if prob < 0.5:
        return '<50%'
    elif prob < 0.6:
        return '50-60%'
    elif prob < 0.7:
        return '60-70%'
    elif prob < 0.8:
        return '70-80%'
    elif prob < 0.9:
        return '80-90%'
    else:
        return '90%+'


def get_dte_bin(days_to_expiry: int) -> str:
    """
    Categorize days to expiry into bins for recovery data lookup.

    Args:
        days_to_expiry: Business days until expiration

    Returns:
        Bin name (e.g., "15-21", "36+")
    """
    if days_to_expiry <= 7:
        return '0-7'
    elif days_to_expiry <= 14:
        return '8-14'
    elif days_to_expiry <= 21:
        return '15-21'
    elif days_to_expiry <= 28:
        return '22-28'
    elif days_to_expiry <= 35:
        return '29-35'
    else:
        return '36+'


# ============================================================================
# NORMALIZATION FUNCTIONS
# ============================================================================

class NormalizationResult:
    """Result of normalizing a factor."""
    def __init__(self, normalized: float, has_data: bool, data_status: str):
        self.normalized = normalized
        self.has_data = has_data
        self.data_status = data_status  # 'available', 'insufficient', 'unavailable'


def normalize_support_strength(score: Optional[float]) -> NormalizationResult:
    """
    Support Strength Score (0-100 scale).

    Pre-calculated composite metric from support_level_metrics.csv measuring
    how reliably the support level has held historically.

    NO TRANSFORMATION NEEDED: Already 0-100 scale from CSV.

    Args:
        score: Support strength score (0-100) or None

    Returns:
        NormalizationResult with normalized score
    """
    if score is None:
        return NormalizationResult(0, False, 'unavailable')

    return NormalizationResult(
        min(100, max(0, score)),
        True,
        'available'
    )


def normalize_days_since_break(
    days: Optional[int],
    avg_days_between: Optional[float]
) -> NormalizationResult:
    """
    Normalize days since last support break.

    Formula: min(100, max(0, (days / avgGap) * 50))

    Args:
        days: Days since last break
        avg_days_between: Average days between breaks (default 30 if None)

    Returns:
        NormalizationResult with normalized score
    """
    if days is None:
        return NormalizationResult(0, False, 'unavailable')

    avg_gap = avg_days_between if avg_days_between is not None else 30
    ratio = days / avg_gap

    return NormalizationResult(
        min(100, max(0, ratio * 50)),
        True,
        'available'
    )


def normalize_recovery_advantage(recovery_rate: Optional[float]) -> NormalizationResult:
    """
    Normalize recovery advantage (historical worthless rate).

    Recovery rate is 0-1 (e.g., 0.785 = 78.5% worthless rate).
    Higher worthless rate = better recovery candidate = higher score.

    Formula: min(100, max(0, recovery_rate * 100))

    Args:
        recovery_rate: Recovery candidate worthless rate (0-1)

    Returns:
        NormalizationResult with normalized score
    """
    if recovery_rate is None:
        return NormalizationResult(0, False, 'unavailable')

    return NormalizationResult(
        min(100, max(0, recovery_rate * 100)),
        True,
        'available'
    )


def normalize_historical_peak(
    current_prob: float,
    peak_prob: Optional[float],
    threshold: float,
    weight: float
) -> NormalizationResult:
    """
    Normalize historical peak probability factor.

    Score higher if peak was >= threshold AND current is notably lower.

    Formula:
    - If weight is 0%: return 0 (disabled)
    - If peak < threshold: return 30 (penalty)
    - Otherwise: min(100, 50 + (drop * 200))

    Args:
        current_prob: Current probability of worthlessness
        peak_prob: Historical peak probability or None
        threshold: Historical peak threshold (e.g., 0.90)
        weight: Weight for this factor (if 0, disabled)

    Returns:
        NormalizationResult with normalized score
    """
    if weight == 0:
        return NormalizationResult(0, False, 'unavailable')

    if peak_prob is None:
        return NormalizationResult(0, False, 'unavailable')

    # Score higher if peak was >= threshold AND current is notably lower
    if peak_prob < threshold:
        return NormalizationResult(30, True, 'available')

    drop = peak_prob - current_prob
    # If drop is 10%+ from a 90%+ peak, good recovery candidate
    return NormalizationResult(
        min(100, 50 + drop * 200),
        True,
        'available'
    )


def normalize_seasonality(
    positive_rate: Optional[float],
    current_day: int,
    typical_low_day: Optional[int]
) -> NormalizationResult:
    """
    Normalize monthly seasonality factor.

    Base score from positive rate (0-100 already in %).
    Bonus if current day is near typical low day.

    Formula:
    - Base: positive_rate (0-100)
    - Bonus: +10 if within 3 days of typical low day
    - Cap: 100

    Args:
        positive_rate: % of positive months (0-100)
        current_day: Current day of month (1-31)
        typical_low_day: Typical low day of month or None

    Returns:
        NormalizationResult with normalized score
    """
    if positive_rate is None:
        return NormalizationResult(0, False, 'unavailable')

    score = positive_rate

    # Bonus if current day is near typical low day
    if typical_low_day is not None:
        day_diff = abs(current_day - typical_low_day)
        if day_diff <= 3:
            score += 10

    return NormalizationResult(
        min(100, score),
        True,
        'available'
    )


def normalize_current_performance(
    current_month_pct: Optional[float],
    avg_month_pct: Optional[float]
) -> NormalizationResult:
    """
    Normalize current month performance relative to historical averages.

    Rationale: Stocks underperforming their seasonal average may offer better
    put writing opportunities due to mean reversion potential.

    Formula: min(100, max(0, 50 + (underperformance * 10)))

    Examples:
    - 5%+ underperformance → Score = 100 (best)
    - 0% underperformance → Score = 50 (neutral)
    - 5%+ overperformance → Score = 0 (worst)

    Args:
        current_month_pct: Current month performance (%)
        avg_month_pct: Historical average for this month (%)

    Returns:
        NormalizationResult with normalized score
    """
    if current_month_pct is None or avg_month_pct is None:
        return NormalizationResult(0, False, 'unavailable')

    underperformance = avg_month_pct - current_month_pct

    return NormalizationResult(
        min(100, max(0, 50 + underperformance * 10)),
        True,
        'available'
    )


# ============================================================================
# MAIN SCORING CLASS
# ============================================================================

class ScoringEngine:
    """
    Main scoring engine that calculates composite scores for options.

    This class encapsulates all scoring logic and matches the frontend
    implementation exactly.
    """

    DEFAULT_WEIGHTS = {
        'support_strength': 20,
        'days_since_break': 15,
        'recovery_advantage': 25,
        'historical_peak': 15,
        'monthly_seasonality': 15,
        'current_performance': 10
    }

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        """
        Initialize scoring engine with optional custom weights.

        Args:
            weights: Optional dict of factor weights. If not provided, uses defaults.
                     Weights will be automatically normalized to sum to 100.
        """
        if weights is None:
            self.weights = self.DEFAULT_WEIGHTS.copy()
        else:
            # Auto-normalize weights to sum to 100
            total = sum(weights.values())
            if total > 0:
                self.weights = {k: (v / total) * 100 for k, v in weights.items()}
            else:
                self.weights = self.DEFAULT_WEIGHTS.copy()

    def calculate_score(
        self,
        # Support metrics
        support_strength_score: Optional[float],
        days_since_last_break: Optional[int],
        trading_days_per_break: Optional[float],

        # Probability metrics
        current_probability: float,
        historical_peak_probability: Optional[float],
        historical_peak_threshold: float,

        # Recovery metrics
        recovery_advantage: Optional[float],

        # Monthly metrics
        monthly_positive_rate: Optional[float],
        monthly_avg_return: Optional[float],
        typical_low_day: Optional[int],
        current_day: int,

        # Current performance
        current_month_performance: Optional[float]
    ) -> Tuple[float, Dict[str, Dict[str, any]]]:
        """
        Calculate composite score for an option.

        This method replicates the exact scoring logic from useAutomatedRecommendations.ts.

        Args:
            support_strength_score: Support level robustness (0-100) or None
            days_since_last_break: Days since support last broken or None
            trading_days_per_break: Average days between breaks or None
            current_probability: Current probability of worthlessness (0-1)
            historical_peak_probability: Historical peak probability or None
            historical_peak_threshold: Threshold for recovery candidates (e.g., 0.90)
            recovery_advantage: Historical worthless rate for recovery candidates (0-1) or None
            monthly_positive_rate: % of positive months (0-100) or None
            monthly_avg_return: Average return for this month (%) or None
            typical_low_day: Typical low day of month (1-31) or None
            current_day: Current day of month (1-31)
            current_month_performance: Current month performance (%) or None

        Returns:
            Tuple of (composite_score, score_breakdown)
            - composite_score: float (0-100)
            - score_breakdown: dict with details for each factor
        """
        # Calculate normalized scores for each factor
        support_strength_result = normalize_support_strength(support_strength_score)

        days_since_break_result = normalize_days_since_break(
            days_since_last_break,
            trading_days_per_break
        )

        recovery_advantage_result = normalize_recovery_advantage(recovery_advantage)

        historical_peak_result = normalize_historical_peak(
            current_probability,
            historical_peak_probability,
            historical_peak_threshold,
            self.weights['historical_peak']
        )

        seasonality_result = normalize_seasonality(
            monthly_positive_rate,
            current_day,
            typical_low_day
        )

        current_performance_result = normalize_current_performance(
            current_month_performance,
            monthly_avg_return
        )

        # Calculate weighted scores
        score_breakdown = {
            'support_strength': {
                'raw': support_strength_score,
                'normalized': support_strength_result.normalized,
                'weighted': support_strength_result.normalized * (self.weights['support_strength'] / 100),
                'has_data': support_strength_result.has_data,
                'data_status': support_strength_result.data_status
            },
            'days_since_break': {
                'raw': days_since_last_break,
                'normalized': days_since_break_result.normalized,
                'weighted': days_since_break_result.normalized * (self.weights['days_since_break'] / 100),
                'has_data': days_since_break_result.has_data,
                'data_status': days_since_break_result.data_status
            },
            'recovery_advantage': {
                'raw': recovery_advantage,
                'normalized': recovery_advantage_result.normalized,
                'weighted': recovery_advantage_result.normalized * (self.weights['recovery_advantage'] / 100),
                'has_data': recovery_advantage_result.has_data,
                'data_status': recovery_advantage_result.data_status
            },
            'historical_peak': {
                'raw': historical_peak_probability,
                'normalized': historical_peak_result.normalized,
                'weighted': historical_peak_result.normalized * (self.weights['historical_peak'] / 100),
                'has_data': historical_peak_result.has_data,
                'data_status': historical_peak_result.data_status
            },
            'monthly_seasonality': {
                'raw': monthly_positive_rate,
                'normalized': seasonality_result.normalized,
                'weighted': seasonality_result.normalized * (self.weights['monthly_seasonality'] / 100),
                'has_data': seasonality_result.has_data,
                'data_status': seasonality_result.data_status
            },
            'current_performance': {
                'raw': current_month_performance,
                'normalized': current_performance_result.normalized,
                'weighted': current_performance_result.normalized * (self.weights['current_performance'] / 100),
                'has_data': current_performance_result.has_data,
                'data_status': current_performance_result.data_status
            }
        }

        # Calculate composite score (sum of weighted scores)
        composite_score = sum(factor['weighted'] for factor in score_breakdown.values())

        return composite_score, score_breakdown

    def get_score_interpretation(self, score: float) -> str:
        """
        Get interpretation of composite score.

        Args:
            score: Composite score (0-100)

        Returns:
            Interpretation string: "strong", "moderate", or "weak"
        """
        if score >= 70:
            return 'strong'
        elif score >= 50:
            return 'moderate'
        else:
            return 'weak'


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def calculate_option_score(
    option_data: Dict,
    support_data: Dict,
    probability_peak: Optional[float],
    recovery_rate: Optional[float],
    monthly_stats: Dict,
    current_stock_performance: Optional[float],
    current_date: datetime,
    historical_peak_threshold: float = 0.90,
    weights: Optional[Dict[str, float]] = None
) -> Tuple[float, Dict]:
    """
    Convenience function to calculate score for a single option.

    Args:
        option_data: Dict with option fields (OptionName, StrikePrice, etc.)
        support_data: Dict with support metrics
        probability_peak: Historical peak probability or None
        recovery_rate: Recovery candidate worthless rate or None
        monthly_stats: Dict with monthly statistics
        current_stock_performance: Current month performance % or None
        current_date: datetime object for current date
        historical_peak_threshold: Threshold for recovery candidates (default 0.90)
        weights: Optional custom weights dict

    Returns:
        Tuple of (composite_score, score_breakdown)
    """
    engine = ScoringEngine(weights)

    # Extract current day of month
    current_day = current_date.day

    # Calculate score
    return engine.calculate_score(
        support_strength_score=support_data.get('support_strength_score'),
        days_since_last_break=support_data.get('days_since_last_break'),
        trading_days_per_break=support_data.get('trading_days_per_break'),
        current_probability=option_data.get('current_probability', 0),
        historical_peak_probability=probability_peak,
        historical_peak_threshold=historical_peak_threshold,
        recovery_advantage=recovery_rate,
        monthly_positive_rate=monthly_stats.get('pct_pos_return_months'),
        monthly_avg_return=monthly_stats.get('return_month_mean_pct_return_month'),
        typical_low_day=monthly_stats.get('day_low_day_of_month'),
        current_day=current_day,
        current_month_performance=current_stock_performance
    )
