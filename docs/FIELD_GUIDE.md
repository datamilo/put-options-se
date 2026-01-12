# Put Options Analysis - Field Guide for Investors

**Last Updated**: January 5, 2026
**Purpose**: Business-focused explanation of all 80+ fields (67 from `data.csv` + 13 margin fields from `margin_requirements.csv`)

This guide explains what each field means for your investment decisions, without technical jargon.

**Note**: On the website, probability fields are displayed with "PoW - " prefix (e.g., "PoW - Weighted Average") to clarify that PoW = Probability of Worthless. Margin fields include a disclaimer that these are estimates, not exact institutional requirements.

---

## Quick Field Categories

| Category | Fields | Purpose |
|----------|---------|---------|
| **[Identification](#identification-fields)** | 1-3, 51-52 | Which option and company |
| **[Pricing](#pricing-fields)** | 4, 28-31, 53 | What you pay and market prices |
| **[Probabilities](#probability-fields)** | 5-11, 15-21 | Chance option expires worthless (you keep premium) |
| **[Risk Protection](#risk-protection-fields)** | 12, 25-27, 49-50 | How low can the stock go before you lose money |
| **[Loss Scenarios](#loss-scenario-fields)** | 13-14, 22-23, 33, 41-42, 54-55, 60-67 | What you could lose in market downturns |
| **[Profit Ratios](#profit-ratios)** | 32, 43-45 | Premium earned vs potential loss |
| **[Margin & Capital](#margin--capital-requirements-fields)** | Est. Total Margin, ROM %, SRI, Event Buffer, etc. | Estimated margin requirements and capital efficiency |
| **[Volatility](#volatility-fields)** | 34, 46-48, 56 | How much the stock price swings |
| **[Position Sizing](#position-sizing)** | 30, 38-40, 57-59 | How many contracts for 100k SEK |
| **[Market Timing](#timing-fields)** | 2-3, 24, 36 | Important dates and prediction accuracy |
| **[Technical](#technical-fields)** | 29, 37 | Advanced trading metrics |

---

## Identification Fields

### 1. OptionName
**What it is**: Unique code identifying this specific put option contract
**Example**: `ERICB6U45` (Ericsson B-share, expiry code 6U, strike 45 SEK)
**Why it matters**: Use this to place orders or track specific options

### 51. StockName
**What it is**: Company name (Swedish convention, e.g., "ERIC B" for Ericsson B-shares)
**Why it matters**: Identifies which stock you're protecting

### 52. ExpiryDate
**What it is**: Last day the option is valid
**Format**: YYYY-MM-DD
**Why it matters**: After this date, option expires. Earlier dates = less time = lower premiums but faster profit

### 2. FinancialReport
**What it is**: 'Y' if company releases quarterly/annual report before expiry, empty otherwise
**Why it matters**: Reports can cause big price swings. 'Y' means higher risk but potentially higher reward

### 3. X-Day
**What it is**: 'Y' if ex-dividend date falls before expiry, empty otherwise
**Why it matters**: Stock price drops by dividend amount on ex-dividend date. Our calculations already adjust for this

---

## Pricing Fields

### 4. Premium
**What it is**: Total money you receive for selling this put option position
**Unit**: SEK (for the full position sized to ~100,000 SEK)
**Example**: Premium = 5,000 SEK means you get 5,000 SEK immediately
**Why it matters**: This is your profit if stock stays above strike price

### 28. Bid_Ask_Mid_Price
**What it is**: Average between what buyers offer (bid) and what sellers ask
**Unit**: SEK per option contract (1 contract = 100 shares)
**Why it matters**: Fair market price for one option. Used to calculate Premium field

### 29. Option_Price_Min
**What it is**: Minimum price per option to break even (accounting for transaction costs)
**Unit**: SEK per option
**Why it matters**: Only sell if market price is above this break-even point

### 30. NumberOfContractsBasedOnLimit
**What it is**: How many option contracts you'd sell for a 100,000 SEK position
**Why it matters**: All loss/premium calculations assume this position size

### 31. Bid
**What it is**: Highest price buyers are offering right now
**Unit**: SEK per option
**Why it matters**: You can sell immediately at this price (real market price)

### 53. Ask
**What it is**: Lowest price sellers are offering right now
**Unit**: SEK per option
**Why it matters**: Shows other side of market. Gap between Bid and Ask shows liquidity

### 37. AskBidSpread
**What it is**: Difference between Ask and Bid prices
**Unit**: SEK
**Why it matters**: Narrow spread (<1 SEK) = liquid, easy to trade. Wide spread (>5 SEK) = harder to get fair price

---

## Probability Fields

**Key Concept**: Higher probability = more likely option expires worthless = you keep the premium

### 7. 1_2_3_ProbOfWorthless_Weighted
**What it is**: **Main probability estimate** - combines 3 methods (Black-Scholes, Calibrated, Historical)
**Range**: 0.0 to 1.0 (0% to 100%)
**Example**: 0.85 = 85% chance you keep the premium
**Why it matters**: **Use this as your primary probability estimate**. Higher is safer but lower premium

### 9. 1_ProbOfWorthless_Original
**What it is**: Black-Scholes mathematical model probability
**Range**: 0.0 to 1.0
**Why it matters**: Pure mathematical calculation. Part of weighted probability but may over/underestimate

### 10. 2_ProbOfWorthless_Calibrated
**What it is**: Black-Scholes adjusted with historical accuracy for this stock
**Range**: 0.0 to 1.0
**Why it matters**: Corrects for consistent over/underestimation. More accurate than raw Black-Scholes

### 11. 3_ProbOfWorthless_Historical_IV
**What it is**: Probability based on how accurate implied volatility has been historically
**Range**: 0.0 to 1.0
**Why it matters**: Uses real market data to estimate probability

### 8. ProbWorthless_Bayesian_IsoCal
**What it is**: Sophisticated statistical adjustment based on similar past options
**Range**: 0.0 to 1.0
**Why it matters**: Groups similar options (by probability bucket and time to expiry) and learns from outcomes

### 5. PoW_Simulation_Mean_Earnings
**What it is**: Average profit/loss from 1,000 Monte Carlo simulations
**Unit**: SEK
**Why it matters**: Simulated long-term average outcome. Positive = profitable strategy over many trades

### 15-21. PoW_Stats_*
**What these are**: Historical statistics from past options with similar high probabilities (>80%)
**Fields included**:
- **MedianLossPct** (#15): Typical loss percentage when things go wrong
- **WorstLossPct** (#16): Worst historical loss percentage
- **MedianLoss** (#17): Typical loss amount (SEK)
- **WorstLoss** (#18): Worst historical loss amount (SEK)
- **MedianProbOfWorthless** (#19): Typical probability value
- **MinProbOfWorthless** (#20): Lowest probability in this group
- **MaxProbOfWorthless** (#21): Highest probability in this group

**Why they matter**: Shows what actually happened to similar options in the past. Reality check on estimates

---

## Risk Protection Fields

**Key Concept**: Lower bounds show how far stock can fall before you start losing money

### 12. Lower_Bound_at_Accuracy
**What it is**: **Key risk metric** - stock price level with 80% historical accuracy
**Unit**: SEK
**How to use**: If current stock price is 100 SEK and lower bound is 85 SEK, stock can drop 15% before reaching this level
**Why it matters**: **Strike price below this = extra safety margin**. Field #50 flags these safe options

### 25. Lower_Bound_HistMedianIV_at_Accuracy
**What it is**: Lower bound using historical median implied volatility (at 80% accuracy)
**Unit**: SEK
**Why it matters**: Alternative calculation using longer-term volatility average. More conservative estimate

### 26. Lower_Bound
**What it is**: Basic lower bound calculation using current implied volatility
**Unit**: SEK
**Why it matters**: Simplest estimate. Compare with other lower bounds for full picture

### 27. Lower_Bound_HistMedianIV
**What it is**: Lower bound using historical median implied volatility (without accuracy adjustment)
**Unit**: SEK
**Why it matters**: Shows typical volatility range without accuracy weighting

### 49. ExpiryDate_Lower_Bound_Minus_Pct_Based_on_Accuracy
**What it is**: Percentage adjustment used in lower bound calculations
**Unit**: Decimal (0.35 = 35%)
**Why it matters**: Technical field showing how much volatility buffer is applied

### 50. StrikeBelowLowerAtAcc
**What it is**: 'Y' if strike price is below Lower_Bound_at_Accuracy AND spread is reasonable (≤10 SEK)
**Why it matters**: **Quick safety filter**. 'Y' = extra protection against losses. Good for conservative strategies

---

## Loss Scenario Fields

**Key Concept**: Negative numbers = losses you'd face if stock dropped like it did in past crises

### 13. LossAtBadDecline
**What it is**: Your loss if stock experiences a "bad" historical decline (around 10th-20th worst)
**Unit**: SEK (negative = loss)
**Example**: -15,000 = you lose 15,000 SEK
**Why it matters**: Realistic worst-case for typical market stress. Not catastrophic, but uncomfortable

### 14. LossAtWorstDecline
**What it is**: Your loss if stock experiences its single worst historical decline
**Unit**: SEK (negative = loss)
**Why it matters**: Absolute worst case seen in this stock's history. Very rare but possible

### 22. LossAt100DayWorstDecline
**What it is**: Loss if stock drops like its worst 100-day period ever
**Unit**: SEK (negative = loss)
**Why it matters**: Time-matched risk (if option has ~100 days, shows relevant historical comparison)

### 23. LossAt_2008_100DayWorstDecline
**What it is**: Loss if stock drops like it did during 2008 financial crisis (100-day window)
**Unit**: SEK (negative = loss)
**Why it matters**: Stress test against global financial crisis. Extreme but has happened

### 41. LossAt50DayWorstDecline
**What it is**: Loss if stock drops like its worst 50-day period ever
**Unit**: SEK (negative = loss)
**Why it matters**: For shorter-term options (~50 days to expiry)

### 42. LossAt_2008_50DayWorstDecline
**What it is**: Loss if stock drops like it did during 2008 crisis (50-day window)
**Unit**: SEK (negative = loss)
**Why it matters**: Shorter-term 2008 crisis stress test

### 33. Loss_Least_Bad
**What it is**: The smallest loss among Bad, Worst, and 100Day scenarios
**Unit**: SEK (negative = loss)
**Why it matters**: Most optimistic of the realistic bad scenarios

### 54. WorstHistoricalDecline
**What it is**: Percentage the stock dropped during its worst historical period
**Unit**: Decimal (0.45 = 45% decline)
**Why it matters**: Shows the stock's maximum pain point

### 55. BadHistoricalDecline
**What it is**: Percentage the stock dropped during "bad" historical period
**Unit**: Decimal (0.25 = 25% decline)
**Why it matters**: Typical significant decline for this stock

### 60. 100DayMaxPrice
**What it is**: Highest stock price in last 100 days
**Unit**: SEK
**Why it matters**: Shows recent peak. Current price vs this = how much stock has already fallen

### 61. 100DayMaxPriceDate
**What it is**: Date when stock hit its 100-day maximum
**Format**: YYYY-MM-DD
**Why it matters**: Recent peak timing. If yesterday = near highs, if 95 days ago = already declined

### 62. 50DayMaxPrice
**What it is**: Highest stock price in last 50 days
**Unit**: SEK
**Why it matters**: Shorter-term peak reference

### 63. 50DayMaxPriceDate
**What it is**: Date when stock hit its 50-day maximum
**Format**: YYYY-MM-DD
**Why it matters**: Recent trend indicator

### 64. Historical100DaysWorstDecline
**What it is**: Worst decline percentage over any 100-day period in stock's history
**Unit**: Decimal (negative, e.g., -0.45 = -45%)
**Why it matters**: Historical volatility reference for 100-day timeframe

### 65. Historical50DaysWorstDecline
**What it is**: Worst decline percentage over any 50-day period in stock's history
**Unit**: Decimal (negative)
**Why it matters**: Historical volatility reference for 50-day timeframe

### 66. 2008_100DaysWorstDecline
**What it is**: Worst 100-day decline during 2008 financial crisis
**Unit**: Decimal (negative)
**Why it matters**: Crisis benchmark for 100-day timeframe

### 67. 2008_50DaysWorstDecline
**What it is**: Worst 50-day decline during 2008 financial crisis
**Unit**: Decimal (negative)
**Why it matters**: Crisis benchmark for 50-day timeframe

---

## Profit Ratios

**Key Concept**: Higher ratio = more premium relative to risk. But also means lower probability.

### 32. ProfitLossPctLeastBad
**What it is**: Premium ÷ Loss_Least_Bad (smallest of the bad scenarios)
**Example**: 0.25 = premium is 25% of potential loss
**Why it matters**: **Risk/reward ratio for most optimistic bad scenario**. Higher = better payoff

### 43. ProfitLossPctBad
**What it is**: Premium ÷ LossAtBadDecline
**Example**: 0.20 = you get 20% of potential loss as premium
**Why it matters**: Typical bad scenario risk/reward

### 44. ProfitLossPctWorst
**What it is**: Premium ÷ LossAtWorstDecline
**Example**: 0.10 = premium is 10% of worst-case loss
**Why it matters**: Absolute worst-case risk/reward. Very low = scary losses possible

### 45. ProfitLossPct100DayWorst
**What it is**: Premium ÷ LossAt100DayWorstDecline
**Why it matters**: Time-matched risk/reward for 100-day scenarios

---

## Volatility Fields

**Key Concept**: Volatility = how much stock price jumps around. Higher volatility = higher premiums but riskier.

### 46. ImpliedVolatility
**What it is**: Market's expectation of future stock volatility (annualized)
**Unit**: Decimal (0.30 = 30% annualized volatility)
**Example**: 0.30 means market expects stock to move ±30% over a year
**Why it matters**: **Key pricing input**. Higher IV = higher premiums but more risk

### 56. ImpliedVolatilityUntilExpiry
**What it is**: ImpliedVolatility scaled to actual time until expiry
**Unit**: Decimal
**Why it matters**: More accurate volatility for shorter time periods

### 47. TodayStockMedianIV_Maximum100DaysToExp
**What it is**: Today's median implied volatility across all options for this stock (≤100 days to expiry)
**Unit**: Decimal
**Why it matters**: Shows today's overall volatility level for this stock

### 48. AllMedianIV_Maximum100DaysToExp
**What it is**: Historical median implied volatility for this stock (all-time, ≤100 days to expiry)
**Unit**: Decimal
**Why it matters**: Baseline volatility. Current IV above this = elevated premiums

### 34. IV_AllMedianIV_Maximum100DaysToExp_Ratio
**What it is**: Current IV ÷ Historical median IV
**Example**: 1.5 = current volatility is 50% higher than usual
**Why it matters**: **Volatility indicator**. >1.2 = high volatility (good premiums), <0.8 = low volatility (poor premiums)

---

## Position Sizing

### 35. StockPrice
**What it is**: Current stock price (adjusted for dividends if X-Day = 'Y')
**Unit**: SEK
**Why it matters**: Reference price for strike comparison and lower bounds

### 39. StrikePrice
**What it is**: Price at which you must buy the stock if option is exercised
**Unit**: SEK
**Example**: Strike = 100 SEK means you buy stock at 100 if it falls below that
**Why it matters**: **Key decision point**. Stock must fall below strike before you lose money

### 38. Underlying_Value
**What it is**: Total value of stocks you'd have to buy if exercised
**Unit**: SEK
**Calculation**: StrikePrice × NumberOfContracts × 100
**Why it matters**: Shows capital requirement if you get assigned

### 40. StockPrice_After_2008_100DayWorstDecline
**What it is**: Where stock would be after a 2008-style 100-day crash
**Unit**: SEK
**Why it matters**: Concrete price level for worst-case scenario

### 57. StockPrice_After_100DayWorstDecline
**What it is**: Where stock would be after its worst historical 100-day decline
**Unit**: SEK
**Why it matters**: Historical worst-case price level

### 58. StockPrice_After_50DayWorstDecline
**What it is**: Where stock would be after its worst historical 50-day decline
**Unit**: SEK
**Why it matters**: Shorter-term worst-case price level

### 59. StockPrice_After_2008_50DayWorstDecline
**What it is**: Where stock would be after a 2008-style 50-day crash
**Unit**: SEK
**Why it matters**: Shorter-term 2008 crisis price level

---

## Timing Fields

### 36. DaysToExpiry
**What it is**: Business days (weekdays only, excluding weekends and Swedish holidays) until option expires. Calculated between Update_date and ExpiryDate from the data.csv file.
**Why it matters**: More days = more premium but more time for things to go wrong. Sweet spot often 30-90 business days (≈ 50-150 calendar days). Note: 8 business days ≈ 14 calendar days.
**Example**: If DaysToExpiry shows "5", that's 5 trading days (likely 1 calendar week)

### 24. Mean_Accuracy
**What it is**: Historical accuracy of implied volatility predictions for this stock/timeframe
**Range**: 0.0 to 1.0 (0% to 100%)
**Example**: 0.80 = implied volatility was accurate 80% of the time historically
**Why it matters**: **Confidence indicator**. Higher = more reliable probability estimates

### 6. 100k_Invested_Loss_Mean
**What it is**: Average loss for 100k SEK positions with similar probability/expiry, based on historical outcomes
**Unit**: SEK
**Why it matters**: Real-world results from similar past trades. Reality check on your estimates

---

## How to Use This Data for Decisions

### Conservative Strategy (High Safety)
Look for:
- **StrikeBelowLowerAtAcc** = 'Y' (strike below safe threshold)
- **1_2_3_ProbOfWorthless_Weighted** > 0.85 (>85% success probability)
- **ProfitLossPctWorst** > 0.15 (premium at least 15% of worst loss)
- **Mean_Accuracy** > 0.75 (reliable predictions)

### Balanced Strategy (Moderate Risk/Reward)
Look for:
- **1_2_3_ProbOfWorthless_Weighted** = 0.75-0.85 (75-85% probability)
- **StrikePrice** close to **Lower_Bound_at_Accuracy** (some buffer)
- **ProfitLossPctLeastBad** > 0.25 (good risk/reward)
- **FinancialReport** = empty (avoid earnings uncertainty)

### Aggressive Strategy (Higher Premiums)
Look for:
- **IV_AllMedianIV_Maximum100DaysToExp_Ratio** > 1.3 (elevated volatility)
- **1_2_3_ProbOfWorthless_Weighted** = 0.65-0.75 (still reasonable probability)
- **Premium** high relative to position size
- Accept higher **LossAtBadDecline** for better premiums

### Quick Screening
1. Start with **1_2_3_ProbOfWorthless_Weighted** (main probability)
2. Check **StrikeBelowLowerAtAcc** (safety flag)
3. Review **LossAtBadDecline** (realistic worst case)
4. Compare **Premium** vs **Loss_Least_Bad** (risk/reward)
5. Verify **AskBidSpread** < 5 SEK (liquidity)

---

## Important Concepts

### All Dollar Amounts Are for ~100,000 SEK Position
- Premium, losses, and underlying values assume you're sizing position to ~100k SEK
- NumberOfContractsBasedOnLimit shows how many contracts this means
- Scale up/down proportionally for different position sizes

### Negative Numbers = Losses
- All "Loss" fields are negative numbers
- More negative = bigger loss
- Example: -20,000 = you lose 20,000 SEK

### Transaction Costs Included
- 150 SEK courtage (brokerage fee) is already deducted from all loss calculations
- Premium and losses are net of fees

### Probabilities Are Estimates
- Based on mathematical models and historical data
- Not guarantees
- Use Mean_Accuracy field to gauge reliability

### Historical Scenarios
- Past performance doesn't guarantee future results
- But shows what's possible
- 2008 scenarios = extreme stress test

---

## Margin & Capital Requirements Fields

⚠️ **IMPORTANT DISCLAIMER**: All margin fields are **ESTIMATES ONLY** using Synthetic Risk Interval (SRI) methodology. These are **NOT** the exact margin requirements that Nasdaq Stockholm or your broker will demand. Your actual margin requirements may be different. Always check with your broker for exact requirements.

### Est. Total Margin
**What it is**: Estimated total margin capital you must have available to hold this put option position
**Calculation**: Est. Margin per Contract (SEK) × Number of Contracts
**Unit**: SEK
**Example**: "50,000 SEK" estimate means you need ~50,000 SEK in buying power
**Why it matters**:
- Shows how much capital is "tied up" in this position
- Higher margin = less capital efficiency
- Use ROM (Return on Margin) to evaluate if premium justifies the capital requirement

### Est. Margin per Contract (SEK)
**What it is**: Estimated margin requirement for a single option contract (100 shares) based on SRI calculation
**Unit**: SEK per contract
**Calculation basis**: Combines OTM buffer, volatility (2SD and historical), and event risk
**Why it matters**: Understanding margin per contract helps scale positions appropriately

### Annualized Return on Margin (ROM %)
**What it is**: What your premium would annualize to as a percentage of the margin requirement
**Calculation**: Premium / Est. Total Margin × ~252 trading days / Days to Expiry (where Days to Expiry is in business days)
**Example**: "25%" means if you repeated this trade 4 times per year (every ~60 business days), you'd earn ~100% annual return on the margin (theoretical, assumes consistent results)
**Why it matters**:
- Key metric for capital efficiency
- Higher ROM = better use of your capital
- Compare across different options to find best capital allocation
- Note: Uses business days (~252/year) not calendar days (365/year) for accurate trading day annualization

### Premium After Costs
**What it is**: Premium minus transaction costs (brokerage fees, bid-ask spread, commissions)
**Unit**: SEK
**Why it matters**:
- Your actual profit if the option expires worthless
- More realistic than gross premium
- Use this for ROI calculations instead of raw premium

### Risk Metrics (SRI, 2SD Decline, Historical Worst)
**What it is**: Components of the margin calculation showing different risk approaches
**SRI Components**:
- **SRI Base**: Starting risk index (higher of 2SD and historical worst decline)
- **Event Buffer**: Extra margin if earnings/dividend occurs before expiry
- **Final SRI**: Total risk index (SRI Base + Event Buffer)

**Decline Metrics**:
- **2SD Decline %**: Statistical probability of decline (from implied volatility)
- **Historical Worst %**: Actual worst decline from this stock's history

**Why it matters**: Understanding what goes into margin helps you manage risk
- Higher decline estimates = more conservative margin = safer but more capital needed
- Event buffer increases if earnings coming = temporary margin increase

### OTM Amount
**What it is**: How far out-of-the-money is the strike (Stock Price - Strike Price)
**Unit**: SEK
**Example**: Stock 100, Strike 90 = 10 SEK OTM
**Why it matters**:
- Larger OTM = more safety buffer = may reduce margin requirements
- But also lower probability of profit if stock rallies too much

---

## Field Priorities by Experience Level

### Beginner (Start Here)
1. **1_2_3_ProbOfWorthless_Weighted** - Main probability
2. **Premium** - What you earn
3. **LossAtBadDecline** - Realistic worst case
4. **StrikeBelowLowerAtAcc** - Safety flag
5. **DaysToExpiry** - Time horizon

### Intermediate (Add These)
6. **Est. Total Margin** - Capital requirement for position
7. **Annualized ROM %** - Capital efficiency metric
8. **ProfitLossPctLeastBad** - Risk/reward ratio
9. **Mean_Accuracy** - Prediction reliability
10. **Lower_Bound_at_Accuracy** - Safety threshold
11. **ImpliedVolatility** - Market sentiment
12. **FinancialReport** & **X-Day** - Event risks

### Advanced (Full Picture)
13. **Est. Margin per Contract** - Per-unit margin analysis
14. **Premium After Costs** - True profit potential
15. **SRI Components** (Base, Event Buffer, Final SRI) - Margin calculation deep dive
16. **2SD Decline & Historical Worst** - Risk assessment methods
17. **PoW_Stats_*** - Historical outcomes
18. **Multiple loss scenarios** - Stress testing
19. **IV_AllMedianIV_*_Ratio** - Relative volatility
20. **Lower bound variations** - Different methodologies
21. **All probability variations** - Model comparison

---

**For technical implementation details, see `FIELD_DOCUMENTATION.md` in the docs folder.**

**Last Updated**: January 5, 2026 (Added Margin Requirements fields)
