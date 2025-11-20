# Portfolio Generator - Python Replica

This Python script exactly replicates the "Automatic Portfolio Generator" functionality from the React application.

## Overview

The script implements the same logic as the web application's Portfolio Generator, including:
- Option data recalculation based on underlying value
- Multiple filtering criteria
- Probability-based sorting algorithm
- Portfolio selection with one option per stock maximum
- Comprehensive statistics calculation

## Configuration Variables

All user inputs from the web application are available as configuration variables at the top of the script:

### Required Settings
- `TOTAL_PREMIUM_TARGET`: Target premium amount (500 - 1,000,000 SEK)
- `UNDERLYING_VALUE`: Stock value per option (10,000 - 1,000,000 SEK)
- `TRANSACTION_COST`: Transaction cost per option (default: 99 SEK)

### Optional Filters
- `STRIKE_BELOW_PERIOD`: Filter options with strike below historical low (None, 7, 30, 90, 180, 270, or 365 days)
- `MIN_PROBABILITY_WORTHLESS`: Minimum probability threshold (40-100% or None)
- `SELECTED_EXPIRY_DATE`: Specific expiry date filter ('YYYY-MM-DD' or None for all dates)

### Probability Field Selection
- `SELECTED_PROBABILITY_FIELD`: Which probability field to use for calculations
  - "ProbWorthless_Bayesian_IsoCal" (default)
  - "1_2_3_ProbOfWorthless_Weighted"
  - "1_ProbOfWorthless_Original"
  - "2_ProbOfWorthless_Calibrated"
  - "3_ProbOfWorthless_Historical_IV"

## Data Files

The script uses two CSV files:

### sample_options_data.csv
Contains option data with the following columns:
- OptionName, StockName, ExpiryDate, StrikePrice, Premium
- Bid, Ask, DaysToExpiry
- Various probability fields
- PotentialLossAtLowerBound

### sample_stock_data.csv
Contains historical stock price data:
- date, name, close, volume, pct_change_close

## Usage

1. **Basic execution with default settings:**
   ```bash
   python portfolio_generator_replica.py
   ```

2. **Customize settings by editing the configuration variables:**
   ```python
   TOTAL_PREMIUM_TARGET = 1000  # Change target premium
   UNDERLYING_VALUE = 150000    # Change underlying value
   STRIKE_BELOW_PERIOD = 30     # Enable 30-day low filter
   MIN_PROBABILITY_WORTHLESS = 70  # Require 70% minimum probability
   ```

3. **Use your own data files:**
   - Replace `sample_options_data.csv` and `sample_stock_data.csv` with your data
   - Ensure the same column structure and pipe (|) delimiter

## Algorithm Details

The script follows the exact same logic as the React application:

### 1. Data Recalculation
- Calculates number of contracts: `round((UNDERLYING_VALUE / StrikePrice) / 100)`
- Calculates bid-ask mid price: `(Bid + Ask) / 2`
- Recalculates premium: `(mid_price * contracts * 100) - TRANSACTION_COST`

### 2. Filtering
- Removes options with premium ≤ 0
- Strike price below historical low (if enabled)
- Expiry date matching (if specified)
- Minimum probability threshold (if specified)

### 3. Risk Metrics Calculation
- **Expected Value**: `Premium - (1 - ProbOfWorthless) × PotentialLoss`
- **Expected Value per Capital**: `Expected Value / (Strike Price × Contracts × 100)`
- **Risk-Adjusted Score**: `(Premium / PotentialLoss) × ProbOfWorthless`

### 4. Sorting Priority
1. **Risk-Adjusted Score**: Highest score first (balances premium efficiency, probability, and loss)
2. **Expected Value per Capital**: Highest return on investment first
3. **Premium**: Higher premium preferred as tiebreaker

### 4. Portfolio Selection
- Maximum one option per stock
- Selects options until target premium is reached
- Fills remaining capacity with best available options

### 5. Statistics Calculation
- Total premium achieved
- Total underlying value: `sum(contracts * strike_price * 100)`
- Total potential loss at lower bound
- Success message and target achievement status

## Output

The script provides detailed output including:
- Configuration summary
- Data loading status
- Filtering and sorting results
- Complete portfolio breakdown
- Performance statistics

## Sample Output

```
PORTFOLIO GENERATOR CONFIGURATION
================================================================================
Total Premium Target:      500 SEK
Underlying Value:          100,000 SEK
Transaction Cost:          99 SEK
Strike Below Period:       None days
Min Probability Worthless: None%
Selected Expiry Date:      All dates
Probability Field:         ProbWorthless_Bayesian_IsoCal

PORTFOLIO RESULTS
================================================================================
Status: Portfolio successfully generated with 489 SEK premium.
Target Achieved: ✓
Total Premium: 489 SEK
Total Underlying Value: 2,844,000 SEK
Total Potential Loss: -12,456.78 SEK
Number of Options: 8

SELECTED OPTIONS:
--------------------------------------------------------------------------------
Option Name     Stock                Strike   Premium  Contracts  Probability
--------------------------------------------------------------------------------
ALFA5U426       Alfa Laval AB        426      13       2          0.980
ASSAB5U330      ASSA ABLOY AB ser. B 330      8        3          0.799
ABB5U640        ABB Ltd              640      10       2          0.860
...
```

## Requirements

- Python 3.6+
- No external dependencies (uses only standard library)

## Notes

- The script automatically creates sample data files if they don't exist
- All calculations match the React application exactly
- Error handling and data validation included
- Comprehensive logging and status output
- Ready to run immediately with sample data