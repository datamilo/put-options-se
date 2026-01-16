"""
Automated Put Option Recommendations Scoring Algorithm
Direct Python translation of src/hooks/useAutomatedRecommendations.ts

This module provides exact replication of the website's scoring logic for backtesting.
"""

import csv
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from math import floor


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class NormalizationResult:
    """Result of normalizing a single score factor"""
    normalized: float
    hasData: bool
    dataStatus: str  # 'available', 'insufficient', 'unavailable'


@dataclass
class ScoreComponent:
    """Individual factor score (raw, normalized, weighted)"""
    raw: Optional[float]
    normalized: float
    weighted: float
    hasData: bool
    dataStatus: str


@dataclass
class ScoreBreakdown:
    """Breakdown of all 6 factor scores"""
    supportStrength: ScoreComponent
    daysSinceBreak: ScoreComponent
    recoveryAdvantage: ScoreComponent
    historicalPeak: ScoreComponent
    monthlySeasonality: ScoreComponent
    currentPerformance: ScoreComponent


@dataclass
class RecommendedOption:
    """Complete scoring output for a single option"""
    rank: int
    optionName: str
    stockName: str
    strikePrice: float
    currentPrice: float
    expiryDate: str
    daysToExpiry: int
    premium: float

    # Support metrics
    rollingLow: Optional[float]
    distanceToSupportPct: Optional[float]
    daysSinceLastBreak: Optional[int]
    supportStrengthScore: Optional[float]
    patternType: Optional[str]

    # Probability metrics
    currentProbability: float
    historicalPeakProbability: Optional[float]

    # Recovery metrics
    recoveryAdvantage: Optional[float]
    currentProbBin: str
    dteBin: str

    # Monthly metrics
    monthlyPositiveRate: Optional[float]
    monthlyAvgReturn: Optional[float]
    typicalLowDay: Optional[int]
    currentMonthPerformance: Optional[float]
    monthsInHistoricalData: Optional[int]
    worstMonthDrawdown: Optional[float]

    # Scoring
    compositeScore: float
    scoreBreakdown: ScoreBreakdown


@dataclass
class RecommendationFilters:
    """User-provided filter criteria"""
    expiryDate: str
    rollingPeriod: int  # 30, 90, 180, 270, 365
    minDaysSinceBreak: int
    probabilityMethod: str
    historicalPeakThreshold: float  # 0.80, 0.90, 0.95


@dataclass
class ScoreWeights:
    """Scoring weights for each factor (will be normalized to 100%)"""
    supportStrength: float = 20
    daysSinceBreak: float = 15
    recoveryAdvantage: float = 25
    historicalPeak: float = 15
    monthlySeasonality: float = 15
    currentPerformance: float = 10

    def to_dict(self) -> Dict[str, float]:
        return {
            'supportStrength': self.supportStrength,
            'daysSinceBreak': self.daysSinceBreak,
            'recoveryAdvantage': self.recoveryAdvantage,
            'historicalPeak': self.historicalPeak,
            'monthlySeasonality': self.monthlySeasonality,
            'currentPerformance': self.currentPerformance,
        }


# ============================================================================
# BINNING FUNCTIONS
# ============================================================================

def get_probability_bin(prob: float) -> str:
    """
    Bin probability values (0-1 scale) for recovery data lookup.
    Uses strict < (less than) comparisons.

    Args:
        prob: Probability in 0-1 scale (e.g., 0.75 = 75%)

    Returns:
        Bin name: '<50%', '50-60%', '60-70%', '70-80%', '80-90%', '90%+'
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
    Bin calendar days to expiry for recovery data lookup.
    Uses <= (less than or equal) comparisons.

    CRITICAL: These are CALENDAR DAYS, not business days.

    Args:
        days_to_expiry: Number of calendar days until expiration

    Returns:
        Bin name: '0-7', '8-14', '15-21', '22-28', '29-35', '36+'
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
# PROBABILITY METHOD MAPPING
# ============================================================================

def map_probability_method(field_name: str) -> str:
    """
    Map CSV field names to recovery data method names.

    Args:
        field_name: Field name from data.csv

    Returns:
        Method name for recovery data lookup
    """
    method_map = {
        'ProbWorthless_Bayesian_IsoCal': 'Bayesian Calibrated',
        '1_2_3_ProbOfWorthless_Weighted': 'Weighted Average',
        '1_ProbOfWorthless_Original': 'Original Black-Scholes',
        '2_ProbOfWorthless_Calibrated': 'Bias Corrected',
        '3_ProbOfWorthless_Historical_IV': 'Historical IV',
    }
    return method_map.get(field_name, field_name)


# ============================================================================
# NORMALIZATION FUNCTIONS
# ============================================================================

def normalize_support_strength(score: Optional[float]) -> NormalizationResult:
    """
    Normalize support strength score (0-100 scale).
    Already normalized - just clamp to range.
    """
    if score is None:
        return NormalizationResult(0, False, 'unavailable')

    normalized = min(100, max(0, score))
    return NormalizationResult(normalized, True, 'available')


def normalize_days_since_break(
    days: Optional[int],
    avg_days_between: Optional[int]
) -> NormalizationResult:
    """
    Normalize days since support was last broken.
    Formula: min(100, max(0, (days / avgGap) * 50))
    """
    if days is None:
        return NormalizationResult(0, False, 'unavailable')

    avg_gap = avg_days_between or 30  # Default 30 if not provided
    ratio = days / avg_gap
    normalized = min(100, max(0, ratio * 50))
    return NormalizationResult(normalized, True, 'available')


def normalize_recovery_advantage(recovery_rate: Optional[float]) -> NormalizationResult:
    """
    Normalize recovery advantage (0-1 scale to 0-100).
    Formula: min(100, max(0, recoveryRate * 100))

    recoveryRate is 0-1 (e.g., 0.785 = 78.5%)
    """
    if recovery_rate is None:
        return NormalizationResult(0, False, 'unavailable')

    normalized = min(100, max(0, recovery_rate * 100))
    return NormalizationResult(normalized, True, 'available')


def normalize_historical_peak(
    current_prob: float,
    peak_prob: Optional[float],
    threshold: float,
    weight: float
) -> NormalizationResult:
    """
    Normalize historical peak probability.

    Formula:
    - If weight == 0: return 0 (factor disabled)
    - If peak < threshold: return 30 (penalty)
    - Else: min(100, 50 + (drop * 200))

    Args:
        current_prob: Current probability (0-1)
        peak_prob: Historical peak probability (0-1)
        threshold: Historical peak threshold (0-1)
        weight: Weight of this factor (0-100)
    """
    # If weight is 0%, the factor is disabled
    if weight == 0:
        return NormalizationResult(0, False, 'unavailable')

    if peak_prob is None:
        return NormalizationResult(0, False, 'unavailable')

    # Score higher if peak was >= threshold
    if peak_prob < threshold:
        return NormalizationResult(30, True, 'available')

    drop = peak_prob - current_prob
    normalized = min(100, 50 + drop * 200)
    return NormalizationResult(normalized, True, 'available')


def normalize_seasonality(
    positive_rate: Optional[float],
    current_day: int,
    typical_low_day: Optional[int]
) -> NormalizationResult:
    """
    Normalize monthly seasonality.

    Formula:
    - Base: positive_rate (0-100%)
    - Bonus: +10 if current day is within 3 days of typical low day
    - Cap at 100
    """
    if positive_rate is None:
        return NormalizationResult(0, False, 'unavailable')

    score = positive_rate

    # Bonus if current day is near typical low day
    if typical_low_day is not None:
        day_diff = abs(current_day - typical_low_day)
        if day_diff <= 3:
            score += 10

    normalized = min(100, score)
    return NormalizationResult(normalized, True, 'available')


def normalize_current_performance(
    current_month_pct: Optional[float],
    avg_month_pct: Optional[float]
) -> NormalizationResult:
    """
    Normalize current month performance vs historical average.

    Formula:
    - Underperformance = avg_month_pct - current_month_pct
    - normalized = min(100, max(0, 50 + (underperformance * 10)))

    Args:
        current_month_pct: Current month performance (percentage, e.g., 2.5)
        avg_month_pct: Historical average for this month (percentage, e.g., 3.0)
    """
    if current_month_pct is None or avg_month_pct is None:
        return NormalizationResult(0, False, 'unavailable')

    underperformance = avg_month_pct - current_month_pct
    normalized = min(100, max(0, 50 + underperformance * 10))
    return NormalizationResult(normalized, True, 'available')


# ============================================================================
# WEIGHT NORMALIZATION
# ============================================================================

def normalize_weights(weights: Dict[str, float]) -> Dict[str, float]:
    """
    Auto-normalize weights to sum to 100%.

    If user provides weights that don't sum to 100, scale them proportionally.
    This allows users to set relative importance without manual balancing.

    Args:
        weights: Dict of weights (any values)

    Returns:
        Dict of weights scaled to sum to 100%
    """
    total_weight = sum(weights.values())

    if total_weight == 0:
        # Edge case: all weights are 0
        return weights

    return {key: (value / total_weight) * 100 for key, value in weights.items()}


# ============================================================================
# DATA LOADING
# ============================================================================

class DataLoader:
    """Load and organize data from CSV files"""

    def __init__(self):
        self.options_data: List[Dict[str, Any]] = []
        self.support_metrics: List[Dict[str, Any]] = []
        self.probability_history: List[Dict[str, Any]] = []
        self.recovery_data: List[Dict[str, Any]] = []
        self.monthly_stats: List[Dict[str, Any]] = []
        self.stock_data: List[Dict[str, Any]] = []

    def load_csv(self, filepath: str, delimiter: str = ',') -> List[Dict[str, Any]]:
        """Load CSV file and return list of dicts"""
        print(f"📥 Loading {filepath}...")
        data = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f, delimiter=delimiter)
                for row in reader:
                    if row:
                        data.append(row)
            print(f"✅ Loaded {len(data)} records from {filepath}")
            return data
        except FileNotFoundError:
            print(f"❌ File not found: {filepath}")
            return []

    def load_all_data(self, data_dir: str = './data') -> None:
        """Load all required CSV files"""
        print("\n🔍 Loading all data sources...\n")

        # Load data.csv (options data)
        self.options_data = self.load_csv(f'{data_dir}/data.csv', delimiter='|')

        # Load support_level_metrics.csv
        self.support_metrics = self.load_csv(
            f'{data_dir}/support_level_metrics.csv',
            delimiter='|'
        )

        # Load probability_history.csv
        self.probability_history = self.load_csv(
            f'{data_dir}/probability_history.csv',
            delimiter='|'
        )

        # Load recovery_report_data.csv
        self.recovery_data = self.load_csv(
            f'{data_dir}/recovery_report_data.csv',
            delimiter='|'
        )

        # Load Stocks_Monthly_Data.csv
        self.monthly_stats = self.load_csv(
            f'{data_dir}/Stocks_Monthly_Data.csv',
            delimiter='|'
        )

        # Load stock_data.csv
        self.stock_data = self.load_csv(
            f'{data_dir}/stock_data.csv',
            delimiter='|'
        )

        print("✅ All data loaded successfully\n")


# ============================================================================
# DATA STRUCTURE BUILDERS
# ============================================================================

class DataStructureBuilder:
    """Build optimized lookup structures from raw CSV data"""

    @staticmethod
    def build_probability_peaks_map(probability_history: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Build map of option name -> maximum Bayesian probability.

        CRITICAL: Always uses ProbWorthless_Bayesian_IsoCal field,
        keeps the MAXIMUM value across all history.
        """
        print("🔍 Building probability peaks map...")
        peaks_map = {}

        for row in probability_history:
            option_name = row.get('OptionName', '').strip()
            if not option_name:
                continue

            # ALWAYS use Bayesian probability
            bayesian_str = row.get('ProbWorthless_Bayesian_IsoCal', '0')
            try:
                bayesian_value = float(bayesian_str)
            except (ValueError, TypeError):
                bayesian_value = 0

            # Keep the maximum
            if option_name not in peaks_map or bayesian_value > peaks_map[option_name]:
                peaks_map[option_name] = bayesian_value

        print(f"✅ Built peaks map with {len(peaks_map)} entries\n")
        return peaks_map

    @staticmethod
    def build_recovery_data_structure(
        recovery_data: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Dict[str, Dict[str, Dict[str, float]]]]]:
        """
        Build hierarchical recovery data structure.

        CRITICAL: Uses AGGREGATED data only (DataType='scenario' or Stock='')
        Structure: threshold -> method -> probBin -> dteBin -> data
        """
        print("🔍 Building recovery data structure...")
        aggregated_chart = {}

        for row in recovery_data:
            # Filter: Only use aggregated data (DataType='scenario' or Stock='')
            data_type = row.get('DataType', '').strip()
            stock = row.get('Stock', '').strip()

            if data_type != 'scenario' and stock != '':
                # Skip stock-specific data - only use aggregated
                continue

            threshold = row.get('HistoricalPeakThreshold', '0.90').strip()
            # Format threshold as string with 2 decimals
            try:
                threshold = f"{float(threshold):.2f}"
            except (ValueError, TypeError):
                threshold = '0.90'

            method = row.get('ProbMethod', '').strip()
            prob_bin = row.get('CurrentProb_Bin', '').strip()
            dte_bin = row.get('DTE_Bin', '').strip()

            # Convert percentage (0-100) to decimal (0-1)
            try:
                recovery_rate_pct = float(row.get('RecoveryCandidate_WorthlessRate_pct', '0'))
                recovery_rate = recovery_rate_pct / 100
            except (ValueError, TypeError):
                recovery_rate = 0

            try:
                recovery_n = int(row.get('RecoveryCandidate_N', '0'))
            except (ValueError, TypeError):
                recovery_n = 0

            try:
                baseline_n = int(row.get('AllOptions_N', '0'))
            except (ValueError, TypeError):
                baseline_n = 0

            # Build hierarchical structure
            if threshold not in aggregated_chart:
                aggregated_chart[threshold] = {}
            if method not in aggregated_chart[threshold]:
                aggregated_chart[threshold][method] = {}
            if prob_bin not in aggregated_chart[threshold][method]:
                aggregated_chart[threshold][method][prob_bin] = {}

            aggregated_chart[threshold][method][prob_bin][dte_bin] = {
                'recovery_candidate_n': recovery_n,
                'recovery_candidate_rate': recovery_rate,
                'baseline_n': baseline_n,
            }

        print(f"✅ Built recovery data structure\n")
        return aggregated_chart

    @staticmethod
    def build_monthly_stats_map(
        monthly_stats: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Build map of stock name -> monthly stats for current month.

        CRITICAL: Only includes data for CURRENT CALENDAR MONTH.
        """
        print("🔍 Building monthly stats map...")
        current_month = datetime.now().month  # 1-12
        stats_map = {}

        for row in monthly_stats:
            stock_name = row.get('name', '').strip()
            if not stock_name:
                continue

            try:
                month = int(row.get('month', 0))
            except (ValueError, TypeError):
                month = 0

            # Only include current month data
            if month != current_month:
                continue

            # Convert string values to floats
            try:
                pct_pos = float(row.get('pct_pos_return_months', 0))
            except (ValueError, TypeError):
                pct_pos = 0

            try:
                avg_return = float(row.get('return_month_mean_pct_return_month', 0))
            except (ValueError, TypeError):
                avg_return = 0

            try:
                typical_low_day = int(row.get('day_low_day_of_month', 0))
            except (ValueError, TypeError):
                typical_low_day = None

            try:
                months_available = int(row.get('number_of_months_available', 0))
            except (ValueError, TypeError):
                months_available = None

            try:
                worst_drawdown = float(row.get('open_to_low_max_pct_return_month', 0))
            except (ValueError, TypeError):
                worst_drawdown = None

            stats_map[stock_name] = {
                'pct_pos_return_months': pct_pos,
                'return_month_mean_pct_return_month': avg_return,
                'day_low_day_of_month': typical_low_day if typical_low_day else None,
                'number_of_months_available': months_available,
                'open_to_low_max_pct_return_month': worst_drawdown,
            }

        print(f"✅ Built monthly stats map with {len(stats_map)} stocks\n")
        return stats_map

    @staticmethod
    def build_stock_performance_map(stock_data: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """
        Build map of stock name -> current performance metrics.

        Calculates:
        - priceChangePercentMonth: change from last trading day of previous month
        """
        print("🔍 Building stock performance map...")
        perf_map = {}

        # Group by stock name
        by_stock = {}
        for row in stock_data:
            stock_name = row.get('name', '').strip()
            if not stock_name:
                continue
            if stock_name not in by_stock:
                by_stock[stock_name] = []
            by_stock[stock_name].append(row)

        # Sort each stock's data by date
        for stock_name in by_stock:
            by_stock[stock_name].sort(key=lambda x: x.get('date', ''))

        # Calculate metrics for each stock
        today = datetime.now()
        start_of_current_month = datetime(today.year, today.month, 1)

        for stock_name, data in by_stock.items():
            if not data:
                continue

            try:
                latest_close = float(data[-1].get('close', 0))
            except (ValueError, TypeError):
                latest_close = 0

            # Find last trading day of previous month
            previous_month_close = None
            for row in reversed(data):
                row_date = datetime.strptime(row.get('date', ''), '%Y-%m-%d')
                if row_date < start_of_current_month:
                    try:
                        previous_month_close = float(row.get('close', 0))
                    except (ValueError, TypeError):
                        previous_month_close = 0
                    break

            # Calculate month-to-date performance
            price_change_pct_month = 0
            if previous_month_close and previous_month_close > 0:
                price_change_pct_month = (
                    (latest_close - previous_month_close) / previous_month_close
                ) * 100

            perf_map[stock_name] = {
                'priceChangePercentMonth': price_change_pct_month,
            }

        print(f"✅ Built stock performance map with {len(perf_map)} stocks\n")
        return perf_map

    @staticmethod
    def build_support_metrics_map(
        support_metrics: List[Dict[str, Any]]
    ) -> Dict[Tuple[str, int], Dict[str, Any]]:
        """
        Build map of (stock_name, rolling_period) -> support metrics.
        """
        print("🔍 Building support metrics map...")
        metrics_map = {}

        for row in support_metrics:
            stock_name = row.get('stock_name', '').strip()
            try:
                rolling_period = int(row.get('rolling_period', 0))
            except (ValueError, TypeError):
                rolling_period = 0

            if not stock_name or rolling_period == 0:
                continue

            # Convert numeric fields
            try:
                current_price = float(row.get('current_price', 0))
            except (ValueError, TypeError):
                current_price = 0

            try:
                rolling_low = float(row.get('rolling_low', 0)) if row.get('rolling_low') else None
            except (ValueError, TypeError):
                rolling_low = None

            try:
                days_since_break = int(row.get('days_since_last_break', 0))
            except (ValueError, TypeError):
                days_since_break = None

            try:
                support_strength = float(row.get('support_strength_score', 0))
            except (ValueError, TypeError):
                support_strength = 0

            try:
                trading_days_per_break = float(row.get('trading_days_per_break', 30))
            except (ValueError, TypeError):
                trading_days_per_break = 30

            metrics_map[(stock_name, rolling_period)] = {
                'stock_name': stock_name,
                'rolling_period': rolling_period,
                'current_price': current_price,
                'rolling_low': rolling_low,
                'days_since_last_break': days_since_break,
                'support_strength_score': support_strength,
                'trading_days_per_break': trading_days_per_break,
                'pattern_type': row.get('pattern_type', None),
            }

        print(f"✅ Built support metrics map with {len(metrics_map)} entries\n")
        return metrics_map


# ============================================================================
# MAIN SCORING ENGINE
# ============================================================================

class OptionScoringEngine:
    """
    Main scoring engine that replicates the website's algorithm.
    """

    # Probability method field name to recovery method name mapping
    PROBABILITY_METHOD_MAP = {
        'ProbWorthless_Bayesian_IsoCal': 'Bayesian Calibrated',
        '1_2_3_ProbOfWorthless_Weighted': 'Weighted Average',
        '1_ProbOfWorthless_Original': 'Original Black-Scholes',
        '2_ProbOfWorthless_Calibrated': 'Bias Corrected',
        '3_ProbOfWorthless_Historical_IV': 'Historical IV',
    }

    def __init__(self):
        self.options_data: List[Dict[str, Any]] = []
        self.probability_peaks_map: Dict[str, float] = {}
        self.recovery_data_structure: Dict = {}
        self.monthly_stats_map: Dict[str, Dict[str, Any]] = {}
        self.stock_performance_map: Dict[str, Dict[str, Any]] = {}
        self.support_metrics_map: Dict[Tuple[str, int], Dict[str, Any]] = {}

    def load_data(self, loader: DataLoader) -> None:
        """Load and build all data structures from raw CSV data"""
        print("\n" + "="*70)
        print("LOADING AND BUILDING DATA STRUCTURES")
        print("="*70 + "\n")

        self.options_data = loader.options_data

        # Build data structures
        self.probability_peaks_map = DataStructureBuilder.build_probability_peaks_map(
            loader.probability_history
        )
        self.recovery_data_structure = DataStructureBuilder.build_recovery_data_structure(
            loader.recovery_data
        )
        self.monthly_stats_map = DataStructureBuilder.build_monthly_stats_map(
            loader.monthly_stats
        )
        self.stock_performance_map = DataStructureBuilder.build_stock_performance_map(
            loader.stock_data
        )
        self.support_metrics_map = DataStructureBuilder.build_support_metrics_map(
            loader.support_metrics
        )

    def _get_support_metric(
        self,
        stock_name: str,
        rolling_period: int
    ) -> Optional[Dict[str, Any]]:
        """Get support metrics for a specific stock and rolling period"""
        return self.support_metrics_map.get((stock_name, rolling_period))

    def _filter_options(
        self,
        filters: RecommendationFilters
    ) -> List[Dict[str, Any]]:
        """
        Filter options based on user criteria.

        Order of filters:
        1. Expiry date matches exactly
        2. Support metrics exist for stock + rolling period
        3. Strike price <= rolling low
        4. Days since break >= minimum
        """
        print("📋 Filtering options...")
        filtered = []

        for option in self.options_data:
            # Filter 1: Expiry date
            if option.get('ExpiryDate', '').strip() != filters.expiryDate.strip():
                continue

            # Filter 2: Get support metrics
            stock_name = option.get('StockName', '').strip()
            support_metric = self._get_support_metric(stock_name, filters.rollingPeriod)
            if not support_metric:
                continue

            # Filter 3: Strike <= rolling low
            rolling_low = support_metric.get('rolling_low')
            if rolling_low is not None:
                try:
                    strike = float(option.get('StrikePrice', 0))
                except (ValueError, TypeError):
                    strike = 0

                if strike > rolling_low:
                    continue

            # Filter 4: Days since break >= minimum
            days_since_break = support_metric.get('days_since_last_break')
            if days_since_break is not None and days_since_break < filters.minDaysSinceBreak:
                continue

            filtered.append(option)

        print(f"✅ Filtered to {len(filtered)} options\n")
        return filtered

    def analyze_options(
        self,
        filters: RecommendationFilters,
        weights: ScoreWeights
    ) -> List[RecommendedOption]:
        """
        Main scoring function. Exact replication of website algorithm.

        Steps:
        1. Normalize weights to 100%
        2. Filter options
        3. For each option:
           a. Calculate days to expiry
           b. Get current probability
           c. Get historical peak
           d. Look up recovery advantage
           e. Get monthly stats
           f. Get stock performance
           g. Normalize all 6 scores
           h. Calculate weighted scores
           i. Calculate composite score
        4. Sort by composite score (descending)
        5. Assign ranks
        """
        print("\n" + "="*70)
        print("ANALYZING OPTIONS")
        print("="*70 + "\n")

        # Normalize weights
        weights_dict = weights.to_dict()
        normalized_weights = normalize_weights(weights_dict)
        print(f"📊 Normalized weights:")
        for key, value in normalized_weights.items():
            print(f"  {key}: {value:.2f}%")
        print()

        # Filter options
        filtered_options = self._filter_options(filters)

        results = []
        current_day = datetime.now().day

        for idx, option in enumerate(filtered_options):
            stock_name = option.get('StockName', '').strip()
            support_metric = self._get_support_metric(stock_name, filters.rollingPeriod)

            if not support_metric:
                continue

            # Calculate days to expiry (CALENDAR DAYS)
            expiry_date_str = option.get('ExpiryDate', '').strip()
            try:
                expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%d')
                days_to_expiry = floor(
                    (expiry_date - datetime.now()).total_seconds() / (1000 * 60 * 60 * 24)
                )
            except (ValueError, TypeError):
                days_to_expiry = 0

            # Get current probability (from selected method field)
            current_probability_str = option.get(filters.probabilityMethod, '0')
            try:
                current_probability = float(current_probability_str)
            except (ValueError, TypeError):
                current_probability = 0

            if not isinstance(current_probability, (int, float)):
                continue

            # Get historical peak (ALWAYS Bayesian)
            option_name = option.get('OptionName', '').strip()
            historical_peak_probability = self.probability_peaks_map.get(option_name)

            # Get recovery advantage (aggregated, not stock-specific)
            prob_bin = get_probability_bin(current_probability)
            dte_bin = get_dte_bin(days_to_expiry)

            recovery_advantage = None
            try:
                threshold_key = f"{filters.historicalPeakThreshold:.2f}"
                recovery_method = map_probability_method(filters.probabilityMethod)

                recovery_point = (
                    self.recovery_data_structure
                    .get(threshold_key, {})
                    .get(recovery_method, {})
                    .get(prob_bin, {})
                    .get(dte_bin)
                )

                if recovery_point:
                    recovery_advantage = recovery_point.get('recovery_candidate_rate')
            except Exception as e:
                print(f"⚠️  Error looking up recovery data: {e}")

            # Get monthly stats (current month only)
            monthly_stats = self.monthly_stats_map.get(stock_name)
            monthly_positive_rate = monthly_stats.get('pct_pos_return_months') if monthly_stats else None
            monthly_avg_return = monthly_stats.get('return_month_mean_pct_return_month') if monthly_stats else None
            typical_low_day = monthly_stats.get('day_low_day_of_month') if monthly_stats else None
            months_in_historical = monthly_stats.get('number_of_months_available') if monthly_stats else None
            worst_month_drawdown = monthly_stats.get('open_to_low_max_pct_return_month') if monthly_stats else None

            # Get stock performance (previous month)
            stock_perf = self.stock_performance_map.get(stock_name)
            current_month_performance = stock_perf.get('priceChangePercentMonth') if stock_perf else None

            # NORMALIZE ALL 6 SCORES
            support_strength_result = normalize_support_strength(
                support_metric.get('support_strength_score')
            )
            days_since_break_result = normalize_days_since_break(
                support_metric.get('days_since_last_break'),
                support_metric.get('trading_days_per_break')
            )
            recovery_advantage_result = normalize_recovery_advantage(recovery_advantage)
            historical_peak_result = normalize_historical_peak(
                current_probability,
                historical_peak_probability,
                filters.historicalPeakThreshold,
                normalized_weights['historicalPeak']  # PASS WEIGHT
            )
            seasonality_result = normalize_seasonality(
                monthly_positive_rate,
                current_day,
                typical_low_day
            )
            current_perf_result = normalize_current_performance(
                current_month_performance,
                monthly_avg_return
            )

            # BUILD SCORE BREAKDOWN (with weighted values)
            score_breakdown = ScoreBreakdown(
                supportStrength=ScoreComponent(
                    raw=support_metric.get('support_strength_score'),
                    normalized=support_strength_result.normalized,
                    weighted=support_strength_result.normalized * (normalized_weights['supportStrength'] / 100),
                    hasData=support_strength_result.hasData,
                    dataStatus=support_strength_result.dataStatus,
                ),
                daysSinceBreak=ScoreComponent(
                    raw=support_metric.get('days_since_last_break'),
                    normalized=days_since_break_result.normalized,
                    weighted=days_since_break_result.normalized * (normalized_weights['daysSinceBreak'] / 100),
                    hasData=days_since_break_result.hasData,
                    dataStatus=days_since_break_result.dataStatus,
                ),
                recoveryAdvantage=ScoreComponent(
                    raw=recovery_advantage,
                    normalized=recovery_advantage_result.normalized,
                    weighted=recovery_advantage_result.normalized * (normalized_weights['recoveryAdvantage'] / 100),
                    hasData=recovery_advantage_result.hasData,
                    dataStatus=recovery_advantage_result.dataStatus,
                ),
                historicalPeak=ScoreComponent(
                    raw=historical_peak_probability,
                    normalized=historical_peak_result.normalized,
                    weighted=historical_peak_result.normalized * (normalized_weights['historicalPeak'] / 100),
                    hasData=historical_peak_result.hasData,
                    dataStatus=historical_peak_result.dataStatus,
                ),
                monthlySeasonality=ScoreComponent(
                    raw=monthly_positive_rate,
                    normalized=seasonality_result.normalized,
                    weighted=seasonality_result.normalized * (normalized_weights['monthlySeasonality'] / 100),
                    hasData=seasonality_result.hasData,
                    dataStatus=seasonality_result.dataStatus,
                ),
                currentPerformance=ScoreComponent(
                    raw=current_month_performance,
                    normalized=current_perf_result.normalized,
                    weighted=current_perf_result.normalized * (normalized_weights['currentPerformance'] / 100),
                    hasData=current_perf_result.hasData,
                    dataStatus=current_perf_result.dataStatus,
                ),
            )

            # CALCULATE COMPOSITE SCORE (simple sum of weighted values)
            composite_score = (
                score_breakdown.supportStrength.weighted +
                score_breakdown.daysSinceBreak.weighted +
                score_breakdown.recoveryAdvantage.weighted +
                score_breakdown.historicalPeak.weighted +
                score_breakdown.monthlySeasonality.weighted +
                score_breakdown.currentPerformance.weighted
            )

            # Calculate distance to support
            rolling_low = support_metric.get('rolling_low')
            current_price = support_metric.get('current_price', 0)
            distance_to_support_pct = None
            if current_price > 0 and rolling_low:
                distance_to_support_pct = (
                    (rolling_low - current_price) / current_price
                ) * 100

            # Create result
            try:
                premium = float(option.get('Premium', 0))
            except (ValueError, TypeError):
                premium = 0

            try:
                strike = float(option.get('StrikePrice', 0))
            except (ValueError, TypeError):
                strike = 0

            result = RecommendedOption(
                rank=0,  # Will be assigned after sorting
                optionName=option_name,
                stockName=stock_name,
                strikePrice=strike,
                currentPrice=current_price,
                expiryDate=expiry_date_str,
                daysToExpiry=days_to_expiry,
                premium=premium,
                rollingLow=rolling_low,
                distanceToSupportPct=distance_to_support_pct,
                daysSinceLastBreak=support_metric.get('days_since_last_break'),
                supportStrengthScore=support_metric.get('support_strength_score'),
                patternType=support_metric.get('pattern_type'),
                currentProbability=current_probability,
                historicalPeakProbability=historical_peak_probability,
                recoveryAdvantage=recovery_advantage,
                currentProbBin=prob_bin,
                dteBin=dte_bin,
                monthlyPositiveRate=monthly_positive_rate,
                monthlyAvgReturn=monthly_avg_return,
                typicalLowDay=typical_low_day,
                currentMonthPerformance=current_month_performance,
                monthsInHistoricalData=months_in_historical,
                worstMonthDrawdown=worst_month_drawdown,
                compositeScore=composite_score,
                scoreBreakdown=score_breakdown,
            )

            results.append(result)

        # SORT BY COMPOSITE SCORE (descending)
        results.sort(key=lambda x: x.compositeScore, reverse=True)

        # ASSIGN RANKS
        for idx, result in enumerate(results):
            result.rank = idx + 1

        print(f"✅ Scored {len(results)} options\n")
        return results

    def get_results_summary(self, results: List[RecommendedOption]) -> None:
        """Print summary of results"""
        if not results:
            print("No results")
            return

        print("\n" + "="*70)
        print("RESULTS SUMMARY")
        print("="*70 + "\n")

        print(f"Total recommendations: {len(results)}")
        print(f"Average score: {sum(r.compositeScore for r in results) / len(results):.2f}")
        print(f"Top score: {results[0].compositeScore:.2f}")
        print(f"Bottom score: {results[-1].compositeScore:.2f}")
        print()

        print("Top 10 recommendations:")
        for result in results[:10]:
            print(
                f"  {result.rank}. {result.optionName} ({result.stockName}) "
                f"- Score: {result.compositeScore:.2f}"
            )


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == '__main__':
    # Initialize
    engine = OptionScoringEngine()
    loader = DataLoader()

    # Load data from CSV files in ./data directory
    # Adjust the path if your data is in a different location
    loader.load_all_data(data_dir='./data')

    # Build data structures
    engine.load_data(loader)

    # Define filters
    filters = RecommendationFilters(
        expiryDate='2025-01-17',
        rollingPeriod=365,
        minDaysSinceBreak=10,
        probabilityMethod='ProbWorthless_Bayesian_IsoCal',
        historicalPeakThreshold=0.90
    )

    # Define weights (will be normalized to 100%)
    weights = ScoreWeights(
        supportStrength=20,
        daysSinceBreak=15,
        recoveryAdvantage=25,
        historicalPeak=15,
        monthlySeasonality=15,
        currentPerformance=10,
    )

    # Analyze
    results = engine.analyze_options(filters, weights)

    # Display results
    engine.get_results_summary(results)

    # Access individual results
    if results:
        top_result = results[0]
        print("\n" + "="*70)
        print(f"TOP RECOMMENDATION: {top_result.optionName}")
        print("="*70)
        print(f"Stock: {top_result.stockName}")
        print(f"Strike: {top_result.strikePrice}")
        print(f"Expiry: {top_result.expiryDate}")
        print(f"Premium: {top_result.premium}")
        print(f"Composite Score: {top_result.compositeScore:.2f}")
        print()
        print("Score Breakdown:")
        print(f"  Support Strength: {top_result.scoreBreakdown.supportStrength.normalized:.2f} (weight: {top_result.scoreBreakdown.supportStrength.weighted:.2f})")
        print(f"  Days Since Break: {top_result.scoreBreakdown.daysSinceBreak.normalized:.2f} (weight: {top_result.scoreBreakdown.daysSinceBreak.weighted:.2f})")
        print(f"  Recovery Advantage: {top_result.scoreBreakdown.recoveryAdvantage.normalized:.2f} (weight: {top_result.scoreBreakdown.recoveryAdvantage.weighted:.2f})")
        print(f"  Historical Peak: {top_result.scoreBreakdown.historicalPeak.normalized:.2f} (weight: {top_result.scoreBreakdown.historicalPeak.weighted:.2f})")
        print(f"  Monthly Seasonality: {top_result.scoreBreakdown.monthlySeasonality.normalized:.2f} (weight: {top_result.scoreBreakdown.monthlySeasonality.weighted:.2f})")
        print(f"  Current Performance: {top_result.scoreBreakdown.currentPerformance.normalized:.2f} (weight: {top_result.scoreBreakdown.currentPerformance.weighted:.2f})")
