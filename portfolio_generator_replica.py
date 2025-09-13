#!/usr/bin/env python3
"""
Portfolio Generator - Python Replica
====================================

This script exactly replicates the "Automatic Portfolio Generator" functionality
from the React application. It includes all user-configurable inputs and implements
the same filtering, sorting, and selection logic.

Author: Automated replication of React Portfolio Generator
"""

import csv
import math
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import os

# ============================================================================
# CONFIGURATION VARIABLES (All User Inputs)
# ============================================================================

# Portfolio Configuration
TOTAL_PREMIUM_TARGET = 500  # Range: 500 - 1,000,000 SEK
UNDERLYING_VALUE = 100000   # Range: 10,000 - 1,000,000 SEK (stock value per option)
TRANSACTION_COST = 99      # Transaction cost per option (SEK)

# Optional Filters
STRIKE_BELOW_PERIOD = None  # Options: None, 7, 30, 90, 180, 270, 365 (days)
MIN_PROBABILITY_WORTHLESS = None  # Range: 40-100% (as percentage, e.g., 70 for 70%)
SELECTED_EXPIRY_DATE = None  # Specific expiry date (YYYY-MM-DD format) or None for all

# Probability Field Selection
SELECTED_PROBABILITY_FIELD = "ProbWorthless_Bayesian_IsoCal"
# Options: "ProbWorthless_Bayesian_IsoCal", "1_2_3_ProbOfWorthless_Weighted", 
#          "1_ProbOfWorthless_Original", "2_ProbOfWorthless_Calibrated", 
#          "3_ProbOfWorthless_Historical_IV"

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class OptionData:
    """Represents a single option with all its properties"""
    OptionName: str
    StockName: str
    ExpiryDate: str
    StrikePrice: float
    Premium: float
    Bid: float
    Ask: Optional[float]
    DaysToExpiry: int
    
    # Probability fields
    ProbWorthless_Bayesian_IsoCal: float = 0.0
    prob_1_2_3_ProbOfWorthless_Weighted: float = 0.0
    prob_1_ProbOfWorthless_Original: float = 0.0
    prob_2_ProbOfWorthless_Calibrated: float = 0.0
    prob_3_ProbOfWorthless_Historical_IV: float = 0.0
    
    # Recalculated fields (computed based on underlying value)
    original_premium: float = field(init=False)
    recalculated_premium: float = field(init=False)
    recalculated_number_of_contracts: int = field(init=False)
    recalculated_bid_ask_mid_price: float = field(init=False)
    
    # For easier access in calculations
    NumberOfContractsBasedOnLimit: int = field(init=False)
    Bid_Ask_Mid_Price: float = field(init=False)
    
    # Potential loss field (placeholder for IV data enrichment)
    PotentialLossAtLowerBound: float = 0.0

    def __post_init__(self):
        """Calculate recalculated values after initialization"""
        self.original_premium = self.Premium
        self.recalculate_values()

    def recalculate_values(self):
        """Recalculate premium and contracts based on underlying value"""
        # Calculate number of contracts based on underlying value
        self.recalculated_number_of_contracts = round((UNDERLYING_VALUE / self.StrikePrice) / 100)
        
        # Calculate bid-ask mid price
        ask_price = self.Ask if self.Ask else self.Bid
        self.recalculated_bid_ask_mid_price = (self.Bid + ask_price) / 2
        
        # Calculate recalculated premium
        self.recalculated_premium = round(
            (self.recalculated_bid_ask_mid_price * self.recalculated_number_of_contracts * 100) - TRANSACTION_COST
        )
        
        # Update the Premium field with recalculated value
        self.Premium = self.recalculated_premium
        
        # Set convenience fields
        self.NumberOfContractsBasedOnLimit = self.recalculated_number_of_contracts
        self.Bid_Ask_Mid_Price = self.recalculated_bid_ask_mid_price

@dataclass
class StockData:
    """Represents historical stock price data"""
    date: str
    name: str
    close: float
    volume: float
    pct_change_close: float

@dataclass
class PortfolioResult:
    """Contains the results of portfolio generation"""
    selected_options: List[OptionData]
    total_premium: float
    total_underlying_value: float
    total_potential_loss: float
    message: str
    target_achieved: bool

# ============================================================================
# DATA LOADING FUNCTIONS
# ============================================================================

def load_options_data(filename: str = "sample_options_data.csv") -> List[OptionData]:
    """Load options data from CSV file"""
    options = []
    
    if not os.path.exists(filename):
        print(f"Warning: {filename} not found. Creating sample data...")
        create_sample_options_data(filename)
    
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file, delimiter='|')
            for row in reader:
                try:
                    # Handle Ask field which might be empty
                    ask_value = None
                    if row.get('Ask') and row['Ask'].strip():
                        ask_value = float(row['Ask'])
                    
                    option = OptionData(
                        OptionName=row['OptionName'],
                        StockName=row['StockName'],
                        ExpiryDate=row['ExpiryDate'],
                        StrikePrice=float(row['StrikePrice']),
                        Premium=float(row['Premium']),
                        Bid=float(row['Bid']),
                        Ask=ask_value,
                        DaysToExpiry=int(row['DaysToExpiry']),
                        ProbWorthless_Bayesian_IsoCal=float(row.get('ProbWorthless_Bayesian_IsoCal', 0)),
                        prob_1_2_3_ProbOfWorthless_Weighted=float(row.get('1_2_3_ProbOfWorthless_Weighted', 0)),
                        prob_1_ProbOfWorthless_Original=float(row.get('1_ProbOfWorthless_Original', 0)),
                        prob_2_ProbOfWorthless_Calibrated=float(row.get('2_ProbOfWorthless_Calibrated', 0)),
                        prob_3_ProbOfWorthless_Historical_IV=float(row.get('3_ProbOfWorthless_Historical_IV', 0)),
                        PotentialLossAtLowerBound=float(row.get('PotentialLossAtLowerBound', 0))
                    )
                    options.append(option)
                except (ValueError, KeyError) as e:
                    print(f"Warning: Skipping row due to data error: {e}")
                    continue
                    
    except FileNotFoundError:
        print(f"Error: Could not find {filename}")
        return []
    except Exception as e:
        print(f"Error loading options data: {e}")
        return []
        
    print(f"Loaded {len(options)} options from {filename}")
    return options

def load_stock_data(filename: str = "sample_stock_data.csv") -> List[StockData]:
    """Load stock data from CSV file"""
    stocks = []
    
    if not os.path.exists(filename):
        print(f"Warning: {filename} not found. Creating sample data...")
        create_sample_stock_data(filename)
    
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file, delimiter='|')
            for row in reader:
                try:
                    stock = StockData(
                        date=row['date'],
                        name=row['name'],
                        close=float(row['close']),
                        volume=float(row['volume']),
                        pct_change_close=float(row['pct_change_close'])
                    )
                    stocks.append(stock)
                except (ValueError, KeyError) as e:
                    print(f"Warning: Skipping stock row due to data error: {e}")
                    continue
                    
    except FileNotFoundError:
        print(f"Error: Could not find {filename}")
        return []
    except Exception as e:
        print(f"Error loading stock data: {e}")
        return []
        
    print(f"Loaded {len(stocks)} stock records from {filename}")
    return stocks

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_low_price_for_period(stock_name: str, period_days: int, stock_data: List[StockData]) -> Optional[float]:
    """Get the lowest stock price for a given period"""
    if not stock_data:
        return None
        
    # Filter stock data for the specific stock
    stock_records = [s for s in stock_data if s.name == stock_name]
    if not stock_records:
        return None
    
    # Sort by date (most recent first)
    stock_records.sort(key=lambda x: x.date, reverse=True)
    
    # Get records within the specified period
    cutoff_date = (datetime.now() - timedelta(days=period_days)).strftime('%Y-%m-%d')
    recent_records = [s for s in stock_records if s.date >= cutoff_date]
    
    if not recent_records:
        return None
        
    # Return the lowest close price in the period
    return min(record.close for record in recent_records)

def get_probability_value(option: OptionData, selected_field: str) -> float:
    """Get probability value with fallback logic (same as React app)"""
    # Try to get the selected probability field
    if selected_field == "ProbWorthless_Bayesian_IsoCal":
        primary_value = option.ProbWorthless_Bayesian_IsoCal
    elif selected_field == "1_2_3_ProbOfWorthless_Weighted":
        primary_value = option.prob_1_2_3_ProbOfWorthless_Weighted
    elif selected_field == "1_ProbOfWorthless_Original":
        primary_value = option.prob_1_ProbOfWorthless_Original
    elif selected_field == "2_ProbOfWorthless_Calibrated":
        primary_value = option.prob_2_ProbOfWorthless_Calibrated
    elif selected_field == "3_ProbOfWorthless_Historical_IV":
        primary_value = option.prob_3_ProbOfWorthless_Historical_IV
    else:
        primary_value = 0.0
    
    # Fallback to weighted average if primary is not available
    fallback_value = option.prob_1_2_3_ProbOfWorthless_Weighted
    
    return primary_value if primary_value else (fallback_value if fallback_value else 0.0)

# ============================================================================
# PORTFOLIO GENERATION LOGIC
# ============================================================================

def filter_options(options: List[OptionData], stock_data: List[StockData]) -> List[OptionData]:
    """Filter options based on all criteria (exact replica of React logic)"""
    filtered_options = []
    
    for option in options:
        # Basic checks - use the recalculated Premium
        if option.Premium <= 0:
            continue
            
        # Strike price below period filter
        if STRIKE_BELOW_PERIOD:
            low_price = get_low_price_for_period(option.StockName, STRIKE_BELOW_PERIOD, stock_data)
            if not low_price or option.StrikePrice > low_price:
                continue
        
        # Expiry date filter
        if SELECTED_EXPIRY_DATE and option.ExpiryDate != SELECTED_EXPIRY_DATE:
            continue
        
        # Probability filter - must meet minimum threshold if specified
        if MIN_PROBABILITY_WORTHLESS:
            prob = get_probability_value(option, SELECTED_PROBABILITY_FIELD)
            # Convert user input from percentage (70) to decimal (0.70) for comparison
            min_prob_decimal = MIN_PROBABILITY_WORTHLESS / 100
            if prob < min_prob_decimal:
                continue
        
        filtered_options.append(option)
    
    return filtered_options

def sort_options(options: List[OptionData]) -> List[OptionData]:
    """Sort options by probability, potential loss, and premium (exact replica of React logic)"""
    def sort_key(option: OptionData) -> Tuple[float, float, float]:
        prob = get_probability_value(option, SELECTED_PROBABILITY_FIELD)
        
        if MIN_PROBABILITY_WORTHLESS:
            # When minimum probability is set, prioritize options closest to the target value
            min_prob_decimal = MIN_PROBABILITY_WORTHLESS / 100
            prob_diff = abs(prob - min_prob_decimal)
        else:
            # When no minimum is set, prioritize highest probability (negative for reverse sort)
            prob_diff = -prob
        
        # Secondary sort: prefer options with less potential loss (closer to zero)
        # More negative values should come later, so we use negative of the loss
        potential_loss = option.PotentialLossAtLowerBound
        loss_priority = -potential_loss  # Less negative loss (closer to zero) comes first
        
        # Tertiary sort: higher premium first (negative for reverse sort)
        premium_priority = -option.Premium
        
        return (prob_diff, loss_priority, premium_priority)
    
    return sorted(options, key=sort_key)

def select_portfolio(sorted_options: List[OptionData]) -> PortfolioResult:
    """Select portfolio options to meet target premium (exact replica of React logic)"""
    selected_options = []
    used_stocks = set()
    total_premium = 0
    
    # Select maximum one option per stock
    for option in sorted_options:
        if option.StockName in used_stocks:
            continue
            
        # Use the recalculated Premium which reflects the current underlying value
        if total_premium + option.Premium <= TOTAL_PREMIUM_TARGET:
            selected_options.append(option)
            used_stocks.add(option.StockName)
            total_premium += option.Premium
    
    # If we haven't reached target, try to get as close as possible by replacing options
    if total_premium < TOTAL_PREMIUM_TARGET:
        # Sort remaining options by how close they get us to target
        remaining_options = [
            option for option in sorted_options 
            if option.StockName not in used_stocks and 
               option.Premium <= (TOTAL_PREMIUM_TARGET - total_premium)
        ]
        
        for option in remaining_options:
            if total_premium + option.Premium <= TOTAL_PREMIUM_TARGET:
                selected_options.append(option)
                used_stocks.add(option.StockName)
                total_premium += option.Premium
    
    # Calculate total underlying value using the recalculated NumberOfContractsBasedOnLimit
    total_underlying_value = sum(
        option.NumberOfContractsBasedOnLimit * option.StrikePrice * 100 
        for option in selected_options
    )
    
    # Calculate total potential loss at lower bound
    total_potential_loss = sum(option.PotentialLossAtLowerBound for option in selected_options)
    
    # Generate status message
    if total_premium < TOTAL_PREMIUM_TARGET:
        deficit = TOTAL_PREMIUM_TARGET - total_premium
        message = f"Portfolio generated with {total_premium} SEK premium ({deficit} SEK below target)."
        target_achieved = False
    else:
        message = f"Portfolio successfully generated with {total_premium} SEK premium."
        target_achieved = True
    
    return PortfolioResult(
        selected_options=selected_options,
        total_premium=total_premium,
        total_underlying_value=total_underlying_value,
        total_potential_loss=total_potential_loss,
        message=message,
        target_achieved=target_achieved
    )

def generate_portfolio(options_data: List[OptionData], stock_data: List[StockData]) -> PortfolioResult:
    """Main portfolio generation function"""
    print("\n" + "="*80)
    print("PORTFOLIO GENERATION")
    print("="*80)
    
    print(f"Starting with {len(options_data)} options")
    
    # Step 1: Filter options
    filtered_options = filter_options(options_data, stock_data)
    print(f"After filtering: {len(filtered_options)} options")
    
    # Step 2: Sort options
    sorted_options = sort_options(filtered_options)
    print(f"Options sorted by probability, potential loss, and premium")
    
    # Step 3: Select portfolio
    result = select_portfolio(sorted_options)
    print(f"Selected {len(result.selected_options)} options")
    
    return result

# ============================================================================
# SAMPLE DATA CREATION
# ============================================================================

def create_sample_options_data(filename: str):
    """Create sample options data file"""
    sample_data = [
        # Header
        "OptionName|StockName|ExpiryDate|StrikePrice|Premium|Bid|Ask|DaysToExpiry|ProbWorthless_Bayesian_IsoCal|1_2_3_ProbOfWorthless_Weighted|1_ProbOfWorthless_Original|2_ProbOfWorthless_Calibrated|3_ProbOfWorthless_Historical_IV|PotentialLossAtLowerBound",
        # Sample options data
        "AAK5U254|AAK AB|2025-09-19|254.0|310|0.35|1.95|7|0.8654931166779508|0.8333505778396415|0.7375613641796136|0.854|0.775|-2048.91",
        "AAK5U255|AAK AB|2025-09-19|255.0|410|0.6|2.2|7|0.7582896058948309|0.8053345759553264|0.6872466604547509|0.837|0.708|-2158.34",
        "ABB5U640|ABB Ltd|2025-09-19|640.0|10|0.3|1.3|7|0.8603648126516309|0.8761636777667275|0.9252189960789741|0.859|0.933|-1847.52",
        "ABB5U645|ABB Ltd|2025-09-19|645.0|85|0.6|1.75|7|0.8217134213421342|0.852014382690196|0.8886161929071862|0.831|0.928|-1923.87",
        "ASSAB5U330|ASSA ABLOY AB ser. B|2025-09-19|330.0|8|0.2|0.85|7|0.7985751295336787|0.8496375383890175|0.8898715883173406|0.852|0.829|-1567.23",
        "ASSAB5U332|ASSA ABLOY AB ser. B|2025-09-19|332.0|68|0.4|1.05|7|0.7582896058948309|0.7965074062009476|0.845978988618632|0.808|0.736|-1645.11",
        "ALFA5U426|Alfa Laval AB|2025-09-19|426.0|13|0.03|1.6|7|0.9800332778702164|0.9751468525307865|0.8815547664387999|1.0|0.899|-1234.67",
        "HOLMB5U356|Holm B|2025-09-19|356.0|726|3.5|4.2|7|0.8245|0.8134|0.7523|0.824|0.765|-2402.83",
        "VOLVO5U520|Volvo AB|2025-09-19|520.0|450|2.1|2.8|7|0.7890|0.7654|0.6987|0.789|0.712|-1876.45",
        "SAND5U890|Sandvik AB|2025-09-19|890.0|1200|5.2|6.1|7|0.8567|0.8234|0.7445|0.856|0.798|-3456.78"
    ]
    
    with open(filename, 'w', encoding='utf-8') as file:
        file.write('\n'.join(sample_data))
    
    print(f"Created sample options data file: {filename}")

def create_sample_stock_data(filename: str):
    """Create sample stock data file"""
    # Generate sample stock data for the past year
    base_date = datetime(2024, 1, 1)
    sample_data = ["date|name|close|volume|pct_change_close"]
    
    stocks = [
        ("AAK AB", 250.0),
        ("ABB Ltd", 650.0),
        ("ASSA ABLOY AB ser. B", 335.0),
        ("Alfa Laval AB", 430.0),
        ("Holm B", 360.0),
        ("Volvo AB", 525.0),
        ("Sandvik AB", 895.0)
    ]
    
    for stock_name, base_price in stocks:
        current_price = base_price
        for days in range(365):
            date = base_date + timedelta(days=days)
            # Simulate price changes
            change_pct = (hash(f"{stock_name}{days}") % 201 - 100) / 10000  # -1% to +1%
            current_price *= (1 + change_pct)
            volume = 50000 + (hash(f"{stock_name}{days}vol") % 200000)
            
            sample_data.append(f"{date.strftime('%Y-%m-%d')}|{stock_name}|{current_price:.2f}|{volume}|{change_pct:.6f}")
    
    with open(filename, 'w', encoding='utf-8') as file:
        file.write('\n'.join(sample_data))
    
    print(f"Created sample stock data file: {filename}")

# ============================================================================
# DISPLAY FUNCTIONS
# ============================================================================

def print_configuration():
    """Print current configuration"""
    print("\n" + "="*80)
    print("PORTFOLIO GENERATOR CONFIGURATION")
    print("="*80)
    print(f"Total Premium Target:      {TOTAL_PREMIUM_TARGET:,} SEK")
    print(f"Underlying Value:          {UNDERLYING_VALUE:,} SEK")
    print(f"Transaction Cost:          {TRANSACTION_COST} SEK")
    print(f"Strike Below Period:       {STRIKE_BELOW_PERIOD if STRIKE_BELOW_PERIOD else 'None'} days")
    print(f"Min Probability Worthless: {MIN_PROBABILITY_WORTHLESS if MIN_PROBABILITY_WORTHLESS else 'None'}%")
    print(f"Selected Expiry Date:      {SELECTED_EXPIRY_DATE if SELECTED_EXPIRY_DATE else 'All dates'}")
    print(f"Probability Field:         {SELECTED_PROBABILITY_FIELD}")

def print_portfolio_results(result: PortfolioResult):
    """Print detailed portfolio results"""
    print("\n" + "="*80)
    print("PORTFOLIO RESULTS")
    print("="*80)
    print(f"Status: {result.message}")
    print(f"Target Achieved: {'✓' if result.target_achieved else '✗'}")
    print(f"Total Premium: {result.total_premium:,} SEK")
    print(f"Total Underlying Value: {result.total_underlying_value:,} SEK")
    print(f"Total Potential Loss: {result.total_potential_loss:,.2f} SEK")
    print(f"Number of Options: {len(result.selected_options)}")
    
    if result.selected_options:
        print("\n" + "-"*80)
        print("SELECTED OPTIONS:")
        print("-"*80)
        print(f"{'Option Name':<15} {'Stock':<20} {'Strike':<8} {'Premium':<8} {'Contracts':<10} {'Probability':<12}")
        print("-"*80)
        
        for option in result.selected_options:
            prob = get_probability_value(option, SELECTED_PROBABILITY_FIELD)
            print(f"{option.OptionName:<15} {option.StockName:<20} {option.StrikePrice:<8.0f} "
                  f"{option.Premium:<8.0f} {option.NumberOfContractsBasedOnLimit:<10} {prob:<12.3f}")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution function"""
    print("Portfolio Generator - Python Replica")
    print("Replicating React Application Logic")
    
    # Print configuration
    print_configuration()
    
    # Load data
    print("\n" + "="*80)
    print("LOADING DATA")
    print("="*80)
    
    options_data = load_options_data()
    stock_data = load_stock_data()
    
    if not options_data:
        print("Error: No options data loaded. Cannot generate portfolio.")
        return
    
    # Generate portfolio
    result = generate_portfolio(options_data, stock_data)
    
    # Display results
    print_portfolio_results(result)
    
    print("\n" + "="*80)
    print("PORTFOLIO GENERATION COMPLETE")
    print("="*80)

if __name__ == "__main__":
    main()