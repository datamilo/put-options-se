# Automated Recommendations Backtest Requirements

**Purpose**: Document requirements for backtesting the Automated Recommendations scoring system to validate historical accuracy and optimize weights.

**Created**: January 15, 2026

**Backtest Approach**: Python script analyzing historical data to evaluate if composite scores predicted successful put options (expired worthless).

---

## Executive Summary

The Automated Recommendations feature scores options using 6 weighted factors (support strength, days since break, recovery advantage, historical peak, monthly seasonality, current performance). To validate and optimize this scoring:

**Goal**: Backtest the scoring system day-by-day historically to determine:
1. Did high-scoring options expire worthless more often than low-scoring options?
2. Which factors have the strongest predictive power?
3. Are current weights optimal, or should they be adjusted?
4. How do different weight configurations perform?

**Key Challenge**: **We only have 1.5 months of historical probability data** (Dec 2025 - Jan 2026), but we need years of historical options data to conduct meaningful backtesting.

---

## Current Scoring Methodology

### The 6 Factors (with default weights)

1. **Recovery Advantage (25%)** - Historical worthless rate for recovery candidates
2. **Support Strength (20%)** - Pre-calculated support robustness score (0-100)
3. **Days Since Break (15%)** - Time since support level last broken
4. **Historical Peak (15%)** - Whether option previously peaked above threshold
5. **Monthly Seasonality (15%)** - Historical % of positive months
6. **Current Performance (10%)** - Month-to-date underperformance vs average

### Composite Score Calculation

Each factor normalized to 0-100, then:
```
Composite Score = Σ(normalized_score × weight / 100)
```

Result: 0-100 score where:
- **≥70**: Strong recommendation (green)
- **50-69**: Moderate recommendation (yellow)
- **<50**: Weak recommendation (red)

---

## Data Requirements for Backtesting

### What We Need Historically (Daily Snapshots)

To backtest properly, we need **daily snapshots** of all 6 factors for every option on every trading day from option creation to expiration.

#### 1. OPTIONS DATA (Per Option, Per Day)

**Currently Available**: `data.csv` (current snapshot only)
**What We Need**: Historical daily snapshots

| Field | Purpose | Current Availability |
|-------|---------|---------------------|
| OptionName | Identifier | ✅ Current only |
| StockName | Which stock | ✅ Current only |
| StrikePrice | Option strike | ✅ Current only |
| ExpiryDate | Expiration date | ✅ Current only |
| DaysToExpiry | Days remaining | ✅ Current only (need daily) |
| Premium | Option premium | ✅ Current only (need daily) |
| Bid/Ask prices | Market prices | ✅ Current only (need daily) |
| Probability methods (5 fields) | PoW calculations | ⚠️ **LIMITED** (only Dec 2025 - Jan 2026 in `probability_history.csv`) |
| FinancialReport | Earnings flag | ✅ Current only |
| X-Day | Dividend flag | ✅ Current only |
| **OUTCOME** | Did it expire worthless? | ❌ **MISSING** (critical!) |

**Data Gap #1**: We only have probability history for Dec 2025 - Jan 2026 (104k records across 1.5 months). We need years of historical probability data.

**Data Gap #2**: We have no historical record of which options expired worthless vs in-the-money. This is the **ground truth** needed to validate scoring.

#### 2. SUPPORT LEVEL DATA (Per Stock, Per Day, Per Rolling Period)

**Currently Available**: `support_level_metrics.csv` (current snapshot only)
**What We Need**: Historical daily support metrics

| Field | Purpose | Current Availability |
|-------|---------|---------------------|
| rolling_low | Support level (30/90/180/270/365 days) | ✅ Current only (can recalculate) |
| support_strength_score | Support robustness (0-100) | ✅ Current only (can recalculate) |
| days_since_last_break | Stability measure | ✅ Current only (can recalculate) |
| trading_days_per_break | Break frequency | ✅ Current only (can recalculate) |
| pattern_type | Support pattern | ✅ Current only (can recalculate) |

**Recalculable**: ✅ YES - We have `stock_data.csv` back to **January 2020** (6 years), so we can **recalculate** all support metrics historically for any date.

#### 3. PROBABILITY HISTORY DATA (Per Option, Per Day)

**Currently Available**: `probability_history.csv` (Dec 2025 - Jan 2026 only)
**What We Need**: Years of historical probability data

| Field | Purpose | Current Availability |
|-------|---------|---------------------|
| Peak probability | Historical peak PoW | ⚠️ **LIMITED** (only 1.5 months) |
| Current probability | Today's PoW | ⚠️ **LIMITED** (only 1.5 months) |
| 5 probability methods | All PoW calculations | ⚠️ **LIMITED** (only 1.5 months) |

**Data Gap #3**: No historical probability peaks before December 2025. We cannot calculate "Historical Peak" factor accurately for periods before Dec 2025.

#### 4. RECOVERY DATA (Per Scenario)

**Currently Available**: `recovery_report_data.csv` (current analysis)
**What We Need**: Historical recovery rates

| Field | Purpose | Current Availability |
|-------|---------|---------------------|
| Recovery candidate rate | Worthless rate for recovery candidates | ✅ Based on all historical expirations |
| Baseline rate | General worthless rate | ✅ Based on all historical expirations |
| Recovery advantage | Percentage point advantage | ✅ Based on all historical expirations |

**Recalculable**: ⚠️ PARTIALLY - Recovery data is calculated from historical expirations, but it requires knowing:
- Which options were recovery candidates on each date
- Which of those expired worthless
We'd need the "OUTCOME" data (see Data Gap #2)

#### 5. MONTHLY SEASONALITY DATA (Per Stock, Per Month)

**Currently Available**: `Stocks_Monthly_Data.csv` (back to 2006)
**What We Need**: Historical monthly statistics

| Field | Purpose | Current Availability |
|-------|---------|---------------------|
| pct_pos_return_months | % of positive months | ✅ Historical data since 2006 |
| return_month_mean_pct_return_month | Average monthly return | ✅ Historical data since 2006 |
| day_low_day_of_month | Typical low day | ✅ Historical data since 2006 |
| number_of_months_available | Data count | ✅ Historical data since 2006 |
| open_to_low_max_pct_return_month | Worst drawdown | ✅ Historical data since 2006 |

**Recalculable**: ✅ YES - We have complete monthly data back to 2006, can recalculate for any historical date.

#### 6. CURRENT PERFORMANCE DATA (Per Stock, Per Day)

**Currently Available**: `stock_data.csv` (back to 2020)
**What We Need**: Daily stock prices

| Field | Purpose | Current Availability |
|-------|---------|---------------------|
| Current month performance | MTD price change | ✅ Can calculate from stock_data.csv |
| Historical average for month | Avg return for this month | ✅ Can calculate from Stocks_Monthly_Data.csv |
| Underperformance | Difference | ✅ Can calculate |

**Recalculable**: ✅ YES - We have daily stock prices back to 2020, can calculate current month performance for any date.

---

## Critical Data Gaps

### Gap #1: Limited Probability History (MAJOR)

**Problem**: `probability_history.csv` only covers Dec 2025 - Jan 2026 (1.5 months)

**Impact on Backtesting**:
- Cannot calculate "Historical Peak" factor before Dec 2025
- Cannot identify "recovery candidates" properly before Dec 2025
- Cannot calculate "Recovery Advantage" factor accurately

**Why This Matters**:
- Historical Peak (15% weight) and Recovery Advantage (25% weight) combine for **40% of total score**
- Without this data, we cannot backtest 40% of the scoring system

**Possible Solutions**:
1. **Start collecting probability data going forward** - Wait 1-2 years to accumulate data
2. **Recreate historical probability calculations** - Requires:
   - Historical options pricing data (bid/ask/IV) for every option on every day
   - Ability to recalculate Black-Scholes and calibration methods historically
   - This is complex and requires underlying options market data we may not have
3. **Backtest only the 60% we CAN calculate** - Focus on:
   - Support Strength (20%)
   - Days Since Break (15%)
   - Monthly Seasonality (15%)
   - Current Performance (10%)
   - Total: 60% of score

### Gap #2: No Historical Expiration Outcomes (CRITICAL)

**Problem**: We don't know which options expired worthless vs in-the-money historically

**Impact on Backtesting**:
- **This is the ground truth needed to validate scoring**
- Without outcomes, we cannot determine if high-scoring options actually succeeded

**What We Need**:
- Historical database of all options with:
  - Option details (name, stock, strike, expiry)
  - Final stock price at expiration
  - Outcome: worthless (stock > strike) or ITM (stock ≤ strike)

**Possible Solutions**:
1. **Recreate outcomes from stock price data** - For expired options:
   - Look up stock price on expiry date in `stock_data.csv`
   - Compare to strike price
   - Determine if worthless (close > strike) or ITM (close ≤ strike)
   - This requires knowing which options existed historically
2. **Use probability validation data** - `validation_report_data.csv` might contain some historical outcome data
3. **Build outcomes database going forward** - Track new options to expiration

### Gap #3: Historical Options Universe

**Problem**: We don't know which options existed on historical dates

**Impact on Backtesting**:
- Cannot reconstruct which options were available for trading on past dates
- Cannot determine which options would have been "recommended" historically

**What We Need**:
- Historical options chain data showing:
  - All active options on each date
  - Their characteristics (strike, expiry, stock)
  - When they were created/delisted

**Possible Solutions**:
1. **Infer from probability_history.csv** - For Dec 2025 - Jan 2026:
   - Extract unique options by date
   - Build timeline of option availability
2. **Assume options existed** - For backtesting purposes:
   - Assume any option with expiry date > backtest date was available
   - This is approximate but may be sufficient

---

## Backtesting Methodology

### Proposed Approach

**Scope**: Given data limitations, start with **short-term backtest** using available probability history (Dec 2025 - Jan 2026), then design for longer-term once we collect more data.

### Phase 1: Short-Term Backtest (1.5 months available)

**Date Range**: December 1, 2025 → January 17, 2026

**Expired Options**: Only options that expired between Dec 1, 2025 and Jan 17, 2026

**Methodology**:

1. **Identify Candidate Options**
   - Options with ExpiryDate between 2025-12-01 and 2026-01-17
   - Extract from probability_history.csv

2. **For Each Backtest Date** (Dec 1 → Jan 17):
   - Calculate all 6 factors for options expiring 1-45 days out
   - Calculate composite scores
   - Rank options by score

3. **Track Options to Expiration**
   - For each option that expires in this period:
     - Record initial score when it entered the "35 days to expiry" window
     - Record score evolution daily
     - Determine outcome: worthless or ITM
     - Compare score to outcome

4. **Analyze Results**
   - Group options by score buckets (90-100, 80-90, 70-80, etc.)
   - Calculate success rate for each bucket
   - Expected: High scores → higher % worthless
   - Test statistical significance

### Phase 2: Medium-Term Backtest (with reconstructed data)

**Date Range**: January 2020 → Present (6 years)

**Prerequisites**:
- Reconstruct historical options universe
- Recreate probability calculations (or focus on 60% of factors we can calculate)
- Determine expiration outcomes from stock_data.csv

**Methodology**:

1. **Build Historical Options Database**
   - Identify all expired options (may need external data source)
   - For each option, record: stock, strike, expiry date

2. **For Each Backtest Date** (daily, 2020-01-01 → 2026-01-15):
   - Recalculate support metrics from stock_data.csv
   - Recalculate monthly seasonality from Stocks_Monthly_Data.csv
   - Recalculate current performance from stock_data.csv
   - Calculate partial composite score (60% of factors)
   - Rank options

3. **Determine Outcomes**
   - For each expired option:
     - Look up stock close price on expiry date
     - Compare to strike: worthless if close > strike
     - Record outcome

4. **Analyze Results**
   - Correlate scores with outcomes over 6 years
   - Statistical significance testing
   - Factor importance analysis
   - Weight optimization

### Phase 3: Full Backtest (with complete probability history)

**Date Range**: When we have 2+ years of probability data

**Prerequisites**:
- 2+ years of daily probability calculations
- Complete options universe
- All expiration outcomes

**Methodology**:
- Full 6-factor scoring system
- All weights adjustable
- Machine learning-based weight optimization
- Robust statistical validation

---

## Performance Metrics

### Success Metrics for Backtesting

1. **Hit Rate by Score Bucket**
   - % of options that expired worthless in each score range
   - Expected: Higher scores → higher hit rate

   Example:
   ```
   Score 90-100: 87% expired worthless (n=145)
   Score 80-90:  81% expired worthless (n=332)
   Score 70-80:  73% expired worthless (n=521)
   Score 60-70:  64% expired worthless (n=412)
   Score 50-60:  58% expired worthless (n=298)
   Score <50:    49% expired worthless (n=187)
   ```

2. **Score Discrimination**
   - Statistical test: Do score differences predict outcome differences?
   - Use logistic regression: P(worthless) ~ composite_score
   - R² and AUC-ROC metrics

3. **Factor Importance**
   - Correlation between each factor and outcomes
   - Which factors are most predictive?
   - Univariate analysis (each factor alone)
   - Multivariate analysis (controlling for other factors)

4. **Weight Optimization**
   - Grid search across weight combinations
   - Find weights that maximize discrimination
   - Compare to current default weights
   - Validation: Split data into train/test sets

5. **Premium Capture**
   - Average premium of high-scoring options
   - Risk-adjusted returns
   - Sharpe ratio simulation

6. **Portfolio Performance**
   - Simulate portfolios using top N scored options
   - Track wins/losses
   - Calculate total return
   - Risk metrics (max drawdown, volatility)

---

## Implementation Plan

### Immediate Actions (Week 1-2)

1. ✅ **Document current state** (this document)
2. **Analyze probability_history.csv in detail**
   - Which options have complete histories?
   - Which expired in the 1.5 month window?
   - Can we find outcomes for these?
3. **Check validation_report_data.csv**
   - Does it contain historical outcomes?
   - What date range?
   - Can we use it for backtesting?

### Short-Term (Month 1)

1. **Build Phase 1 Backtest Script**
   - Python script using available 1.5 months of data
   - Calculate composite scores daily
   - Track to expiration
   - Analyze hit rates

2. **Reconstruct Historical Outcomes**
   - For expired options in probability_history.csv
   - Look up stock prices on expiry dates
   - Determine worthless vs ITM
   - Build outcomes database

3. **Run Initial Backtest**
   - Limited dataset (1.5 months)
   - Proof of concept
   - Initial insights on factor importance

### Medium-Term (Months 2-6)

1. **Research Historical Options Data**
   - Investigate external data sources
   - Nasdaq Stockholm historical options
   - Bloomberg/Reuters data access
   - Cost-benefit analysis

2. **Recreate Probability Calculations**
   - If we get historical options prices
   - Implement Black-Scholes historically
   - Validate against known values
   - Build complete probability history

3. **Build Phase 2 Backtest**
   - Partial scoring (60% of factors)
   - 6 years of data
   - Robust statistical analysis
   - Weight optimization

### Long-Term (6-12 months)

1. **Accumulate Real-Time Data**
   - Continue collecting daily probabilities
   - Track options to expiration
   - Build outcomes database organically

2. **Build Phase 3 Backtest**
   - Full 6-factor system
   - Multiple years of data
   - Machine learning optimization
   - Production-ready weight recommendations

---

## Python Script Architecture

### Proposed Script Structure

```
backtest/
├── data/
│   ├── probability_history.csv         # Input: historical probabilities
│   ├── stock_data.csv                  # Input: stock prices
│   ├── support_level_metrics.csv       # Input: current support metrics
│   ├── recovery_report_data.csv        # Input: recovery rates
│   ├── Stocks_Monthly_Data.csv         # Input: monthly statistics
│   └── historical_options_outcomes.csv # Generated: expiration outcomes
│
├── scripts/
│   ├── 01_build_options_universe.py    # Identify all historical options
│   ├── 02_calculate_outcomes.py        # Determine worthless vs ITM
│   ├── 03_recalculate_support.py       # Daily support metrics historically
│   ├── 04_calculate_scores.py          # Daily composite scores
│   ├── 05_backtest_analysis.py         # Analyze score vs outcome
│   └── 06_optimize_weights.py          # Find optimal weights
│
├── utils/
│   ├── scoring.py                      # Scoring logic (matches frontend)
│   ├── support_calculation.py          # Support level calculations
│   ├── data_loading.py                 # CSV loading utilities
│   └── metrics.py                      # Performance metrics
│
└── results/
    ├── backtest_results.csv            # Daily scores and outcomes
    ├── hit_rate_analysis.csv           # Success rates by score bucket
    ├── factor_importance.csv           # Factor correlation analysis
    ├── weight_optimization.csv         # Optimal weight configurations
    └── backtest_report.pdf             # Final analysis report
```

### Key Script Components

#### 1. `calculate_scores.py` - Core Scoring Logic

```python
def calculate_composite_score(option, date, weights):
    """
    Calculate composite score for an option on a specific date.
    Matches frontend logic exactly.
    """
    factors = {
        'support_strength': calculate_support_strength(option, date),
        'days_since_break': calculate_days_since_break(option, date),
        'recovery_advantage': calculate_recovery_advantage(option, date),
        'historical_peak': calculate_historical_peak(option, date),
        'monthly_seasonality': calculate_monthly_seasonality(option, date),
        'current_performance': calculate_current_performance(option, date)
    }

    # Normalize each factor to 0-100
    normalized = {k: normalize(v) for k, v in factors.items()}

    # Apply weights
    composite = sum(normalized[k] * weights[k] / 100 for k in factors.keys())

    return composite, factors, normalized
```

#### 2. `backtest_analysis.py` - Analysis Logic

```python
def analyze_backtest_results(scores_df, outcomes_df):
    """
    Analyze correlation between scores and outcomes.
    """
    # Merge scores with outcomes
    results = scores_df.merge(outcomes_df, on=['OptionName', 'ExpiryDate'])

    # Calculate hit rates by score bucket
    hit_rates = calculate_hit_rates_by_bucket(results)

    # Statistical significance testing
    logistic_regression_analysis(results)

    # Factor importance
    factor_correlations = analyze_factor_importance(results)

    # Portfolio simulation
    portfolio_returns = simulate_portfolio(results, top_n=20)

    return {
        'hit_rates': hit_rates,
        'factor_importance': factor_correlations,
        'portfolio_performance': portfolio_returns
    }
```

#### 3. `optimize_weights.py` - Weight Optimization

```python
def optimize_weights(results_df, objective='max_discrimination'):
    """
    Find optimal weights using grid search.
    """
    weight_ranges = {
        'support_strength': range(0, 51, 5),
        'days_since_break': range(0, 51, 5),
        'recovery_advantage': range(0, 51, 5),
        'historical_peak': range(0, 51, 5),
        'monthly_seasonality': range(0, 51, 5),
        'current_performance': range(0, 51, 5)
    }

    best_weights = None
    best_score = -inf

    for weights in generate_weight_combinations(weight_ranges):
        # Recalculate all composite scores with new weights
        scores = recalculate_scores(results_df, weights)

        # Evaluate performance
        performance = evaluate_performance(scores, objective)

        if performance > best_score:
            best_score = performance
            best_weights = weights

    return best_weights, best_score
```

---

## Data Collection Recommendations

### Immediate: Start Collecting Now

To enable future comprehensive backtesting, begin collecting:

1. **Daily Probability Snapshots**
   - Continue current probability_history.csv collection
   - Ensure all 5 probability methods captured
   - Daily updates (not sporadic)

2. **Options Universe Tracking**
   - Log all active options daily
   - Track new option listings
   - Track option delistings/expirations
   - Fields: OptionName, StockName, Strike, Expiry, FirstSeen, LastSeen

3. **Expiration Outcomes Database**
   - When options expire, record:
     - OptionName
     - ExpiryDate
     - FinalStockPrice (close on expiry date)
     - StrikePrice
     - Outcome: "worthless" or "ITM"
     - Premium (final bid price before expiry)
   - Essential for validation

4. **Daily Composite Scores**
   - Run current scoring algorithm daily
   - Save scores to database
   - Track score evolution over time
   - Compare to eventual outcomes

### Data Quality Checklist

- [ ] Probability data collected **every trading day** (no gaps)
- [ ] All active options tracked (complete universe)
- [ ] Expiration outcomes recorded within 24 hours of expiry
- [ ] Data validation: no missing fields, correct formats
- [ ] Regular backups and version control
- [ ] Documentation of data schema changes

---

## Challenges and Risks

### Technical Challenges

1. **Computational Complexity**
   - Recalculating support metrics for 50+ stocks × 5 rolling periods × 1500+ trading days = 375,000+ calculations
   - Need efficient Python implementation
   - Consider pandas vectorization

2. **Data Volume**
   - 6 years × 250 trading days × ~500 active options × 70+ fields = massive dataset
   - Storage and memory management
   - Database vs CSV performance

3. **Probability Recreation**
   - If we attempt to recreate historical probabilities:
   - Requires historical IV, stock prices, interest rates
   - Black-Scholes calibration complexity
   - Validation against known values

### Methodological Challenges

1. **Survivorship Bias**
   - We only have data for stocks that still exist
   - Delisted/bankrupted companies missing
   - May overstate strategy performance

2. **Look-Ahead Bias**
   - Must use only data available on each backtest date
   - Cannot use future information in calculations
   - Careful timestamp management

3. **Overfitting Risk**
   - With weight optimization on limited data
   - Need train/test/validation splits
   - Cross-validation essential

4. **Correlation vs Causation**
   - High scores may correlate with success
   - But does scoring *cause* better selection?
   - Or do both reflect underlying market conditions?

### Data Challenges

1. **Limited Historical Depth**
   - Only 1.5 months of probability data currently
   - May miss rare events (crashes, volatility spikes)
   - Seasonal patterns may not appear

2. **Incomplete Options Universe**
   - We don't know all historical options
   - May miss some expired options
   - Universe reconstruction is approximate

3. **Market Regime Changes**
   - 2020-2026 includes COVID crash, recovery, inflation
   - Strategy may work differently in different regimes
   - Need regime-conditional analysis

---

## Success Criteria

### What Would Make This Backtest Successful?

1. **Statistical Validation**
   - ✅ High scores correlate with worthless outcomes (p < 0.05)
   - ✅ Score discrimination is statistically significant
   - ✅ Each factor independently predicts outcomes

2. **Practical Performance**
   - ✅ Top 20% of scored options have >15% higher success rate than bottom 20%
   - ✅ Top-scored portfolios outperform random selection
   - ✅ Risk-adjusted returns are positive

3. **Factor Insights**
   - ✅ Identify which factors matter most
   - ✅ Discover optimal weight combinations
   - ✅ Understand when scoring works vs doesn't

4. **Actionable Recommendations**
   - ✅ Propose updated weights based on data
   - ✅ Identify factors to exclude (if any)
   - ✅ Suggest new factors to add
   - ✅ Define when to use scoring (market conditions)

---

## Next Steps

### Recommended Sequence

1. **Immediate** (This Week)
   - Review this document with stakeholders
   - Decide on backtest scope (Phase 1 vs Phase 2 first)
   - Inventory existing data thoroughly
   - Check if validation_report_data.csv has outcomes

2. **Week 1-2**
   - Write Python script to reconstruct expiration outcomes
   - Build Phase 1 backtest using 1.5 months of probability data
   - Run initial analysis
   - Report preliminary findings

3. **Month 1**
   - If Phase 1 shows promise, invest in Phase 2
   - Research historical options data sources
   - Begin collecting comprehensive daily data going forward

4. **Months 2-6**
   - Build Phase 2 backtest (partial scoring over 6 years)
   - Analyze results
   - Optimize weights
   - Update production scoring if improvements found

5. **Ongoing**
   - Continue daily data collection
   - Track new options to expiration
   - Accumulate data for future Phase 3 backtest
   - Iterate and improve

---

## Conclusion

**Backtesting the Automated Recommendations scoring is feasible but requires addressing critical data gaps**, particularly:

1. **Limited probability history** (only 1.5 months available)
2. **No historical expiration outcomes** (need to reconstruct or collect)
3. **Incomplete historical options universe** (need to identify all past options)

**Recommended Path Forward**:
- Start with **Phase 1** (short-term, 1.5 months) to validate methodology
- Simultaneously begin **collecting comprehensive daily data** for future backtesting
- Invest in **Phase 2** (medium-term, 6 years with partial scoring) if Phase 1 shows promise
- Build toward **Phase 3** (full 6-factor backtest) as data accumulates over time

The insights from backtesting will be invaluable for validating and improving the scoring system, potentially leading to better recommendations and higher success rates for put option sellers.

