"""
Data Loader for Automated Recommendations Scoring

This module loads CSV data files in the same format as used by the Put Options SE website.
All CSV files use pipe (|) delimiter and are located in the ../data/ directory.

Author: Generated from Put Options SE data structure
Date: January 2026
"""

import pandas as pd
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime


class DataLoader:
    """
    Loads and manages CSV data files for scoring engine.

    All data files use pipe (|) delimiter.
    Paths are relative to the backtest/ directory.
    """

    def __init__(self, data_dir: str = '../data'):
        """
        Initialize data loader.

        Args:
            data_dir: Path to data directory (default: ../data)
        """
        self.data_dir = Path(data_dir)
        if not self.data_dir.exists():
            raise FileNotFoundError(f"Data directory not found: {self.data_dir}")

        # Cache for loaded data
        self._options_data = None
        self._support_data = None
        self._probability_history = None
        self._recovery_data = None
        self._monthly_data = None
        self._stock_data = None

    def load_options_data(self, file_name: str = 'data.csv') -> pd.DataFrame:
        """
        Load options data from data.csv.

        Fields include: OptionName, StockName, StrikePrice, ExpiryDate, Premium,
        probability methods, FinancialReport, X-Day, etc.

        Args:
            file_name: CSV file name (default: data.csv)

        Returns:
            DataFrame with options data
        """
        if self._options_data is None:
            file_path = self.data_dir / file_name
            print(f"Loading options data from {file_path}...")

            self._options_data = pd.read_csv(
                file_path,
                delimiter='|',
                parse_dates=['ExpiryDate']
            )

            print(f"✓ Loaded {len(self._options_data)} options")

        return self._options_data

    def load_support_metrics(self, file_name: str = 'support_level_metrics.csv') -> pd.DataFrame:
        """
        Load support level metrics from support_level_metrics.csv.

        Fields include: stock_name, rolling_period, support_strength_score,
        days_since_last_break, trading_days_per_break, pattern_type, etc.

        Args:
            file_name: CSV file name (default: support_level_metrics.csv)

        Returns:
            DataFrame with support metrics
        """
        if self._support_data is None:
            file_path = self.data_dir / file_name
            print(f"Loading support metrics from {file_path}...")

            self._support_data = pd.read_csv(
                file_path,
                delimiter=',',  # Note: support_level_metrics uses comma delimiter
                parse_dates=['last_break_date', 'last_calculated', 'data_through_date']
            )

            print(f"✓ Loaded {len(self._support_data)} support metric records")

        return self._support_data

    def load_probability_history(self, file_name: str = 'probability_history.csv') -> pd.DataFrame:
        """
        Load probability history from probability_history.csv.

        Fields include: OptionName, Update_date, probability methods.

        Args:
            file_name: CSV file name (default: probability_history.csv)

        Returns:
            DataFrame with probability history
        """
        if self._probability_history is None:
            file_path = self.data_dir / file_name
            print(f"Loading probability history from {file_path}...")

            self._probability_history = pd.read_csv(
                file_path,
                delimiter='|',
                parse_dates=['Update_date']
            )

            print(f"✓ Loaded {len(self._probability_history)} probability records")

        return self._probability_history

    def load_recovery_data(self, file_name: str = 'recovery_report_data.csv') -> pd.DataFrame:
        """
        Load recovery report data from recovery_report_data.csv.

        Fields include: DataType, Stock, HistoricalPeakThreshold, ProbMethod,
        CurrentProb_Bin, DTE_Bin, RecoveryCandidate_WorthlessRate_pct, etc.

        Args:
            file_name: CSV file name (default: recovery_report_data.csv)

        Returns:
            DataFrame with recovery data
        """
        if self._recovery_data is None:
            file_path = self.data_dir / file_name
            print(f"Loading recovery data from {file_path}...")

            self._recovery_data = pd.read_csv(
                file_path,
                delimiter='|'
            )

            print(f"✓ Loaded {len(self._recovery_data)} recovery records")

        return self._recovery_data

    def load_monthly_stock_data(self, file_name: str = 'Stocks_Monthly_Data.csv') -> pd.DataFrame:
        """
        Load monthly stock data from Stocks_Monthly_Data.csv.

        Fields include: name, month, year, pct_return_month, day_low_day_of_month,
        pct_pos_return_months (calculated), etc.

        Args:
            file_name: CSV file name (default: Stocks_Monthly_Data.csv)

        Returns:
            DataFrame with monthly stock statistics
        """
        if self._monthly_data is None:
            file_path = self.data_dir / file_name
            print(f"Loading monthly stock data from {file_path}...")

            self._monthly_data = pd.read_csv(
                file_path,
                delimiter='|'
            )

            print(f"✓ Loaded {len(self._monthly_data)} monthly records")

        return self._monthly_data

    def load_stock_data(self, file_name: str = 'stock_data.csv') -> pd.DataFrame:
        """
        Load daily stock price data from stock_data.csv.

        Fields include: date, name, open, high, low, close, volume, pct_change_close.

        Args:
            file_name: CSV file name (default: stock_data.csv)

        Returns:
            DataFrame with daily stock prices
        """
        if self._stock_data is None:
            file_path = self.data_dir / file_name
            print(f"Loading stock data from {file_path}...")

            self._stock_data = pd.read_csv(
                file_path,
                delimiter='|',
                parse_dates=['date']
            )

            print(f"✓ Loaded {len(self._stock_data)} stock price records")

        return self._stock_data

    def get_support_metrics_for_stock(
        self,
        stock_name: str,
        rolling_period: int
    ) -> Optional[Dict]:
        """
        Get support metrics for a specific stock and rolling period.

        Args:
            stock_name: Stock name (e.g., "ERIC B")
            rolling_period: Rolling period (30, 90, 180, 270, or 365)

        Returns:
            Dict with support metrics or None if not found
        """
        support_df = self.load_support_metrics()

        matching = support_df[
            (support_df['stock_name'] == stock_name) &
            (support_df['rolling_period'] == rolling_period)
        ]

        if len(matching) == 0:
            return None

        return matching.iloc[0].to_dict()

    def get_probability_peak(
        self,
        option_name: str,
        probability_method: str = 'ProbWorthless_Bayesian_IsoCal'
    ) -> Optional[float]:
        """
        Get historical peak probability for an option.

        Args:
            option_name: Option name (e.g., "ERICB6U45")
            probability_method: Probability field name (default: Bayesian)

        Returns:
            Peak probability (0-1) or None if no history
        """
        prob_history = self.load_probability_history()

        option_history = prob_history[prob_history['OptionName'] == option_name]

        if len(option_history) == 0:
            return None

        return option_history[probability_method].max()

    def get_recovery_rate(
        self,
        threshold: float,
        prob_method: str,
        prob_bin: str,
        dte_bin: str,
        stock: Optional[str] = None
    ) -> Optional[float]:
        """
        Get recovery candidate worthless rate from recovery data.

        Args:
            threshold: Historical peak threshold (e.g., 0.90)
            prob_method: Probability method (e.g., "Bayesian Calibrated")
            prob_bin: Probability bin (e.g., "70-80%")
            dte_bin: DTE bin (e.g., "15-21")
            stock: Optional stock name (if None, uses aggregated scenario data)

        Returns:
            Recovery rate (0-1) or None if not found
        """
        recovery_df = self.load_recovery_data()

        # Filter by data type
        if stock is None:
            filtered = recovery_df[recovery_df['DataType'] == 'scenario']
        else:
            filtered = recovery_df[
                (recovery_df['DataType'] == 'stock') &
                (recovery_df['Stock'] == stock)
            ]

        # Filter by criteria
        matching = filtered[
            (filtered['HistoricalPeakThreshold'] == threshold) &
            (filtered['ProbMethod'] == prob_method) &
            (filtered['CurrentProb_Bin'] == prob_bin) &
            (filtered['DTE_Bin'] == dte_bin)
        ]

        if len(matching) == 0:
            return None

        # Return recovery candidate rate as decimal (0-1)
        return matching.iloc[0]['RecoveryCandidate_WorthlessRate_pct'] / 100

    def get_monthly_stats_for_stock(
        self,
        stock_name: str,
        month: int
    ) -> Optional[Dict]:
        """
        Get monthly statistics for a stock and calendar month.

        Args:
            stock_name: Stock name (e.g., "ERIC B")
            month: Calendar month (1-12)

        Returns:
            Dict with monthly stats or None if not found
        """
        monthly_df = self.load_monthly_stock_data()

        matching = monthly_df[
            (monthly_df['name'] == stock_name) &
            (monthly_df['month'] == month)
        ]

        if len(matching) == 0:
            return None

        # Calculate percentage of positive months
        stock_month_data = monthly_df[
            (monthly_df['name'] == stock_name) &
            (monthly_df['month'] == month)
        ]

        positive_count = (stock_month_data['pct_return_month'] > 0).sum()
        total_count = len(stock_month_data)

        stats = matching.iloc[0].to_dict()
        stats['pct_pos_return_months'] = (positive_count / total_count * 100) if total_count > 0 else None
        stats['number_of_months_available'] = total_count

        # Average return for this month
        stats['return_month_mean_pct_return_month'] = stock_month_data['pct_return_month'].mean()

        # Worst intra-month drawdown
        stats['open_to_low_max_pct_return_month'] = stock_month_data['pct_open_to_low'].min()

        return stats

    def get_current_month_performance(
        self,
        stock_name: str,
        current_date: datetime
    ) -> Optional[float]:
        """
        Calculate current month performance for a stock.

        Current month performance = price change from last day of previous month
        to current date.

        Args:
            stock_name: Stock name (e.g., "ERIC B")
            current_date: Current date

        Returns:
            Current month performance (%) or None if data not available
        """
        stock_df = self.load_stock_data()

        # Get stock data
        stock_prices = stock_df[stock_df['name'] == stock_name].sort_values('date')

        if len(stock_prices) == 0:
            return None

        # Find last trading day of previous month
        previous_month = current_date.replace(day=1) - pd.Timedelta(days=1)
        previous_month_data = stock_prices[
            (stock_prices['date'].dt.year == previous_month.year) &
            (stock_prices['date'].dt.month == previous_month.month)
        ]

        if len(previous_month_data) == 0:
            return None

        previous_month_close = previous_month_data.iloc[-1]['close']

        # Get current price (most recent date <= current_date)
        current_data = stock_prices[stock_prices['date'] <= current_date]

        if len(current_data) == 0:
            return None

        current_price = current_data.iloc[-1]['close']

        # Calculate performance
        return ((current_price - previous_month_close) / previous_month_close) * 100

    def clear_cache(self):
        """Clear cached data to free memory."""
        self._options_data = None
        self._support_data = None
        self._probability_history = None
        self._recovery_data = None
        self._monthly_data = None
        self._stock_data = None
        print("✓ Data cache cleared")
