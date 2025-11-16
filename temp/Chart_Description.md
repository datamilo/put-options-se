# Understanding Your Options Analysis Charts

## Executive Overview

This guide explains two critical charts from our analysis that help you make better put option writing decisions. Both charts are based on a comprehensive study of over 934,000 expired options from 2024-2025, providing statistically reliable insights into what actually happens in the market.

---

## Chart 1: Interactive Analysis (Probability Recovery Report)

### Why This Chart Was Created

When writing put options, you want to collect premium while minimizing the chance of the option being exercised. Traditional probability calculations tell you "this option has a 70% chance of expiring worthless" based on current market conditions.

However, we discovered something important: **history matters**. Options that previously peaked at very high probability levels (90%+) but then declined actually expire worthless much more frequently than their current probability suggests. This chart visualizes this advantage.

### How to Read the Chart

The chart displays **two bars for comparison**:

- **Green Bars (Recovery Candidates)**: Options that previously reached your selected probability threshold (e.g., 80%, 90%) but have since dropped to lower levels
- **Red Bars (Baseline)**: Options that never reached the threshold you selected

**The vertical axis** shows the "Worthless Rate" - the percentage of options that expired worthless (stock stayed above the strike price for puts).

**The horizontal axis** shows days to expiry in different time ranges.

### How to Use This Chart

1. **Select Your Strategy Parameters**:
   - Choose a Historical Peak Threshold (80%, 85%, 90%, or 95%)
   - Choose a Probability Method that matches your pricing approach
   - Select your target Current Probability range (60-70%, 70-80%, etc.)
   - Optionally filter by specific stock to see individual stock performance

2. **Interpret the Results**:
   - If the green bar is significantly higher than the red bar, recovery candidates are substantially safer
   - The difference tells you exactly how much safer these options are
   - For example: Recovery Candidates at 85% worthless vs. Baseline at 60% = a 25 percentage point advantage

3. **Practical Application**:
   - **Monitor probability peaks**: Keep historical records of the highest probability each option has reached
   - **Write on the dip**: When a 90%+ probability option drops to 60-70%, consider writing it - it's much safer than a typical 60-70% option
   - **Focus on longer-dated options**: The advantage tends to be strongest with 36+ calendar days to expiration
   - **Use with stock filtering**: See which stocks show the strongest recovery candidate effect

### Key Insights from This Analysis

**Strongest Results**:
- 36+ days to expiry with current probability of 60-70%
- Historical peak at 90%+
- Advantage: Often 20-40 percentage points higher worthless rate

**What This Means**:
- Options don't just exist at one probability level - they have a history
- That history contains valuable predictive information about future outcomes
- "Recovery candidates" are statistically safer bets than similar-probability options without that history

### Important Caveats

- Historical peaks don't guarantee future performance
- Market conditions can change rapidly, affecting probability trajectories
- This is backtested historical data - future results may differ
- Always use appropriate position sizing and risk management

---

## Chart 2: Calibration Analysis (Probability Validation Report)

### Why This Chart Was Created

The Calibration Analysis answers a fundamental question: **Are the probability predictions accurate?**

When we say "an option has an 80% probability of expiring worthless," does that actually mean 80% of similar options will expire worthless? Or is the probability consistently too high or too low?

This chart measures the accuracy of five different probability calculation methods by comparing what they predicted against what actually happened.

### How to Read the Chart

The chart displays a **calibration curve** - a visual representation of prediction accuracy:

- **The black dashed diagonal line**: "Perfect Calibration" - represents what perfect accuracy looks like
- **The colored lines with dots**: Each color represents a different probability calculation method

**Reading the curves**:
- If a line lies **exactly on the black diagonal**, that method is perfectly calibrated
- If a line lies **above the diagonal**, that method's predictions are too conservative (actual outcomes are better)
- If a line lies **below the diagonal**, that method is overconfident (actual outcomes are worse)
- The **size of the dots** indicates how many predictions were in that probability bin (larger = more data)

### Understanding the Axes

- **Horizontal axis (Predicted Probability)**: What probability the method predicted (0-100%)
- **Vertical axis (Actual Rate)**: What actually happened in the market (what percentage truly expired worthless)
- Example: At 80% predicted probability, if the actual rate was also 80%, that point would be right on the perfect calibration line

### How to Use This Chart

1. **Evaluate Overall Accuracy**:
   - Look for which method stays closest to the perfect calibration line
   - This method's predictions can be trusted most accurately

2. **Stock-Specific Analysis**:
   - Use the dropdown menu to analyze calibration for individual stocks
   - Some stocks may have better calibration than others
   - Identify which stocks have the most reliable probability predictions

3. **Identify Systematic Bias**:
   - If a method consistently curves above the line, it under-predicts risk (conservative)
   - If it curves below, it over-estimates safety (risky)
   - A method tracking the diagonal has no systematic bias

4. **Make Informed Decisions**:
   - Use the most-calibrated method for your trading decisions
   - If a method shows consistent patterns of over- or under-estimation, adjust your confidence in its predictions accordingly

### Interpreting Your Results

The chart typically shows that certain methods are more accurate than others:

- **Best Calibrated Methods**: Their lines stay closest to the perfect diagonal across all probability ranges
- **Sample Size Matters**: Larger dots indicate more reliable data for that probability range
- **Low-Probability Options**: Calibration in the 10-30% range is crucial for survival probability
- **High-Probability Options**: Calibration in the 80-95% range ensures you're not overconfident

### Key Insights from This Analysis

**What Calibration Error Means**:
- An Expected Calibration Error of 0.32% means predictions are off by only 0.32 percentage points on average
- This is exceptional - most probability models have errors of 2-5%

**Why Calibration Matters**:
- A well-calibrated model means you can trust the probabilities for consistent trading
- Poor calibration means the probabilities are systematically misleading
- Over-optimistic probabilities lead to unexpected assignment; under-optimistic probabilities mean missed opportunities

### Advanced Features

**Days-to-Expiry Analysis**:
- Access a second calibration chart that breaks down performance by how far in advance predictions are made
- Short-term predictions (0-3 days) may have different accuracy than long-term predictions (35+ days)
- This helps you understand if certain methods work better for specific time horizons

---

## Practical Trading Recommendations

### For Put Option Writing

1. **Use the Winner Method**: The calibration analysis identifies which probability method is most accurate. Use that method for position decisions.

2. **Combine Both Insights**:
   - Check calibration accuracy first (validation report)
   - Then look for recovery candidates (probability recovery report)
   - Write options that are both accurate in probability AND have positive historical bias

3. **Time Horizon Strategy**:
   - For 36+ days to expiry: Recovery candidates show strongest advantage
   - For 15-35 days: Still positive advantage, moderate
   - For under 15 days: Advantage decreases but still present

4. **Stock Selection**:
   - Use stock filtering to find which stocks have the best recovery candidate advantage
   - Use stock filtering to see which stocks have the best probability calibration
   - Combine for highest-confidence opportunities

### Risk Management

- **Never rely solely on probability**: Always use appropriate position sizing
- **Account for tail risk**: Historical backtests don't capture unprecedented market events
- **Monitor portfolio Greeks**: Don't just watch the probability percentage
- **Diversify**: Spread positions across different stocks and time horizons
- **Review regularly**: Market conditions change, so validate assumptions periodically

---

## Frequently Asked Questions

**Q: What are "calendar days" vs. "business days"?**
A: Calendar days count every day (7 per week). Business days only count weekdays (5 per week). Our analysis uses calendar days, which is more consistent for options that expire on specific calendar dates.

**Q: Why do recovery candidates perform better?**
A: When an option drops from 90% to 70% probability, the market conditions haven't fundamentally changed - something external did. Options that have repeatedly proved safe (reaching 90%+) then dipped tend to prove safe again. This is a mean-reversion phenomenon in options pricing.

**Q: Should I only trade recovery candidates?**
A: Recovery candidates show a statistical advantage, but:
- Sample sizes vary by scenario
- The advantage diminishes with shorter time horizons
- Market conditions can change
- Use it as one factor among many in your decision-making

**Q: How often should I rerun these analyses?**
A: We recommend:
- Monthly: Review calibration to ensure methods remain accurate
- Quarterly: Update recovery candidate analysis with new expired options
- Continuously: Monitor for major market regime changes

**Q: Can I use these probabilities for other options strategies?**
A: Yes, the calibration analysis applies to any strategy using probability predictions. However:
- Call options may have different calibration patterns
- Different strike selections may show different results
- Always validate with your specific strategy parameters

---

## Summary

These two charts provide complementary insights:

1. **Probability Recovery Chart**: Shows you which options are statistically safer based on their price history
2. **Calibration Chart**: Shows you which probability prediction methods are most reliable

Together, they give you confidence in both **what to trade** (recovery candidates) and **how to price it** (calibrated probabilities). Use them as part of a comprehensive risk management approach, and remember that past performance does not guarantee future results.

For the most confident trades, look for options that satisfy both criteria: good recovery candidate advantage AND accurate probability calibration.
