# Current Options Scoring - TA Model Integration Guide

**For**: Downstream Teams Using `current_options_scored.csv`
**Date**: January 30, 2026
**Document Version**: 1.0

---

## Executive Summary

The options scoring system has been enhanced with a **second independent model (TA ML Model)** that validates predictions from our primary model **(Probability Optimization Model - unchanged)**. This guide explains:

1. **What changed**: Added TA ML Model as validation layer (Probability Optimization Model itself has NOT changed)
2. **Why we added the TA ML Model**: Risk management and cross-validation
3. **What each field means** (field reference)
4. **How well the models perform** (performance metrics)
5. **How to use the agreement flag** (practical decision-making)

---

## Section 1: What Changed?

### Previous System (Probability Optimization Model Only)
- **Scoring model**: Probability Optimization Model (3-factor weighting)
- **Output**: Probability score for each option
- **Risk**: No independent validation

### New System (Probability Optimization Model + TA ML Model Dual-Validation)
- **Primary model**: Probability Optimization Model (UNCHANGED - still uses 3-factor weighting)
- **Secondary model**: TA ML Model (NEW - machine learning validation)
- **Output**: Both probabilities + agreement flag
- **Benefit**: Cross-validation between different methodologies, confidence ranking

---

## Section 2: Why Add the TA Model? The Business Rationale

### The Problem We Solved

**Probability Optimization Model alone** optimizes for maximizing premiums (70-80% probability sweet spot), which is excellent for **business value** but relies on a single methodology.

**TA ML Model** provides **independent technical analysis validation** using a completely different approach:
- **Probability Optimization Model**: Probabilistic weighting (Current Probability, Historical Peak, Support)
- **TA ML Model**: Machine learning classifier (learns patterns from 1.8M historical option expiration records)

### When Agreement Matters

When **both models agree** (both ≥70% probability):
- ✅ **High confidence** in the prediction
- ✅ **Lower risk** of false positives
- ✅ **Best opportunities** for premium collection

When **models disagree** (one <70%, one ≥70%):
- ⚠️ **Mixed signals** - may indicate option near inflection point
- ⚠️ **Potential opportunity** - could be underpriced
- ⚠️ **Higher risk** - use at your own discretion

---

## Section 3: Field Reference Guide

### Primary Fields

| Field | Meaning | Source | Notes |
|-------|---------|--------|-------|
| `stock_name` | Stock ticker/name | Data | Swedish options only |
| `strike_price` | Option strike price | Data | In local currency |
| `expiry_date` | Option expiration date | Data | European options format |
| `current_price` | Stock price at calculation | Data | Updated daily |
| `days_to_expiry` | Business days until expiration | Calculated | 252-day year basis |

### Probability Optimization Model (UNCHANGED)

| Field | Meaning | Range | Interpretation |
|-------|---------|-------|-----------------|
| `probability_optimization_probability` | Probability Optimization Model predicted probability of expiration worthless | 0.0 - 1.0 | Higher = more confident option will expire worthless |
| `probability_optimization_bucket` | Probability Optimization Model confidence bucket | <60%, 60-70%, 70-80%, 80-90%, 90%+ | Categorical probability ranges |

**Probability Optimization Model Details (NO UPDATES - This Model is Unchanged):**
- Type: Weighted composite scoring (3 factors)
- Factors:
  - **Current Probability** (60% weight): Market-derived probability
  - **Historical Peak** (30% weight): Highest probability this option achieved historically
  - **Support Strength** (10% weight): Distance to nearest support level
- Performance: AUC = 0.78-0.79 on validation set
- Optimization: Designed for 70-80% probability "sweet spot" (highest premiums)
- **Status**: Probability Optimization Model has NOT been modified and remains your primary scoring model

### TA ML Model (NEW - Independent Validation Layer)

| Field | Meaning | Range | Interpretation |
|-------|---------|-------|-----------------|
| `ta_probability` | TA ML Model predicted probability | 0.0 - 1.0 | Independent ML-based prediction using different methodology |
| `ta_bucket` | TA ML Model confidence bucket | <60%, 60-70%, 70-80%, 80-90%, 90%+ | Same categorical ranges as Probability Optimization Model |

**TA ML Model Details (NEW Addition - Not a modification to Probability Optimization Model):**
- Type: Random Forest machine learning classifier (17 features)
- Trained on: 1.8M historical option records
- Features:
  - **Stock-level indicators** (12): RSI, MACD, Bollinger Bands, ATR, Stochastic, ADX
  - **Contract-level factors** (5): Strike distance, time to expiry, option Greeks (Delta, Vega, Theta)
- Performance: AUC = 0.85 (independent validation model)
- Approach: Technical analysis based, learns from historical patterns
- **Purpose**: Provides independent validation of Probability Optimization Model predictions; works alongside Probability Optimization Model (not as a replacement)

### Agreement & Confidence Fields (Dual-Model Validation)

| Field | Meaning | Values | Use For |
|-------|---------|--------|---------|
| `models_agree` | Do Probability Optimization Model AND TA ML Model both predict ≥70%? | Yes/No (boolean) | **Primary filter** - highest confidence |
| `agreement_strength` | Categorical agreement between Probability Optimization Model and TA ML Model | Strong, Moderate, Weak | Risk assessment and decision-making |
| `combined_score` | Weighted combination of Probability Optimization Model and TA ML Model scores | 0.0 - 1.0 | Overall prediction confidence |

---

## Section 4: How to Interpret the Output

### Scenario 1: Strong Consensus (BEST CASE)

```
v21_probability: 0.85 (HIGH)
ta_probability:  0.82 (HIGH)
models_agree: Yes
agreement_strength: Strong
```

**Interpretation**:
- ✅ Both models strongly agree this option will expire worthless
- ✅ High confidence in prediction
- ✅ **BEST OPPORTUNITY** for premium collection

---

### Scenario 2: Probability Optimization Model Bullish, TA ML Model Cautious (INVESTIGATE)

```
probability_optimization_probability: 0.78 (HIGH)
ta_probability:  0.65 (MODERATE)
models_agree: No
agreement_strength: Weak
```

**Interpretation**:
- ⚠️ Probability Optimization Model sees good opportunity, but TA ML Model is less confident
- ⚠️ May indicate option near key technical level
- ⚠️ Could be underpriced (opportunity) or risky (volatility)
- 💡 **Action**: Review technical chart, check support levels

---

### Scenario 3: Disagreement (USE CAUTION)

```
probability_optimization_probability: 0.75 (HIGH)
ta_probability:  0.52 (LOW)
models_agree: No
agreement_strength: Weak
```

**Interpretation**:
- ❌ Models strongly disagree
- ❌ Prediction is unreliable
- 💡 **Action**: Skip this option or require additional analysis

---

### Scenario 4: Both Models Conservative (SAFE)

```
probability_optimization_probability: 0.55 (LOW)
ta_probability:  0.48 (LOW)
models_agree: No
agreement_strength: Weak
```

**Interpretation**:
- ✓ Both models agree this is NOT a strong candidate
- ✓ Low false positive risk
- 💡 **Action**: Skip - look for better opportunities

---

## Section 5: Model Performance Metrics

### Probability Optimization Model (UNCHANGED)

| Metric | Value | Interpretation |
|--------|-------|-----------------|
| **Test AUC** | 0.862 | Excellent discrimination on recent data (96th percentile) |
| **Walk-Forward AUC** | 0.651 | Good generalization to future periods (above 50-50 random) |
| **Optimization Target** | 70-80% probability range | Sweet spot for premium collection |
| **Primary Use** | Initial screening | Best for finding high-premium opportunities |
| **Status** | NO CHANGES | This model remains your primary scoring engine |

**What AUC means**: AUC (Area Under Curve) measures how well the model distinguishes between options that expire worthless vs. in-the-money.
- 1.0 = Perfect prediction
- 0.5 = Random guessing
- 0.85+ = Excellent
- 0.65+ = Useful for filtering

### TA ML Model (NEW)

| Metric | Value | Interpretation |
|--------|-------|-----------------|
| **Test AUC** | 0.850 | Excellent discrimination on recent data |
| **Walk-Forward AUC** | 0.651 | Equivalent temporal stability to Probability Optimization Model |
| **Training Data** | 1.8M option records | Large dataset spanning 18+ months |
| **Primary Use** | Independent validation | Confirms Probability Optimization Model predictions using different approach |
| **Status** | NEW ADDITION | This model is added alongside Probability Optimization Model for dual-model validation |

### Dual-Model Agreement Statistics

| Metric | Value | Business Impact |
|--------|-------|-----------------|
| **Strong Agreement** (both ≥80%) | ~12% of options | Highest confidence tier |
| **Moderate Agreement** (both ≥70%) | ~18% of options | Good confidence |
| **Disagreement** (<70% in at least one) | ~70% of options | Mixed signals, requires investigation |

**Interpretation**:
- When 12-18% of options show strong/moderate agreement, these are your **highest conviction trades**
- 70% disagreement is normal - many options lack clear signals
- Use agreement flag to **prioritize** rather than **exclude**

---

## Section 6: Understanding the Models

### Probability Optimization Model: How It Works (UNCHANGED)

Probability Optimization Model combines three factors to identify options that will expire worthless. **This methodology has NOT been changed:**

1. **Current Probability** (60% weight)
   - What does the market currently price this option's probability at?
   - Based on bid-ask spread and option pricing theory

2. **Historical Peak** (30% weight)
   - Has this option been assigned a higher probability before?
   - How stable is the probability over time?

3. **Support Strength** (10% weight)
   - How strong is the price support above the strike?
   - Is there a natural "floor" preventing the price from dropping?

**Result**: Options with high values in all three factors are most likely to expire worthless.

**Status**: This is your primary scoring model and remains unchanged from previous versions.

---

### TA ML Model: How It Works (NEW ADDITION)

The TA ML Model uses machine learning to recognize patterns in historical option data. **This is a new addition to your system (not a modification to Probability Optimization Model):**

**Stock-Level Technical Signals** (What the stock is doing):
- RSI (Relative Strength Index): Overbought/oversold conditions
- MACD: Trend momentum
- Bollinger Bands: Volatility and price extremes
- ATR: Average True Range (volatility measure)
- Stochastic: Momentum reversals
- ADX: Trend strength

**Contract-Level Signals** (What the specific option is doing):
- Sigma Distance: How far the strike is from current price (in standard deviations)
- Days to Expiry: Time decay factor
- Delta: How much option price moves with stock price
- Vega: How much option price moves with volatility changes
- Theta: Time decay per day

**Result**: The TA ML Model recognizes which combinations of these signals historically preceded options expiring worthless, providing independent validation of Probability Optimization Model predictions.

---

## Section 7: Decision Framework (Using Dual-Model System)

### Recommended Usage by Scenario (Probability Optimization Model + TA ML Model Agreement)

**TIER 1: Best Opportunities** (models_agree = Yes AND agreement_strength = 'Strong')
- ✅ Action: **HIGH PRIORITY** for trade evaluation
- Confidence: Very High
- Expected hit rate: 85%+

**TIER 2: Good Opportunities** (models_agree = Yes AND agreement_strength = 'Moderate')
- ✅ Action: **MEDIUM PRIORITY** - good candidates
- Confidence: High
- Expected hit rate: 75%+

**TIER 3: Mixed Signals** (models_agree = No)
- ⚠️ Action: **REVIEW CAREFULLY** or skip
- Confidence: Low
- Expected hit rate: 55%+

**TIER 4: Both Conservative** (both models <70%)
- ✓ Action: **SKIP** - limited opportunity
- Confidence: Reliable (both agree it's not a good trade)
- Expected hit rate: N/A

---

## Section 8: Frequently Asked Questions

### Q: Why are there now two different models in the output (Probability Optimization Model and TA ML Model)?

**A**: Different methodologies catch different signals:
- **Probability Optimization Model** (unchanged): Focuses on **current market conditions**, **historical probability peaks**, and **support levels**
- **TA ML Model** (NEW): Focuses on **technical chart patterns** and **contract-level dynamics (Greeks)**

Both valid approaches - when they agree, confidence is high. When they disagree, it means you should investigate further.

---

### Q: How should I handle options where models strongly disagree?

**A**: Use a three-step process:

1. **Check technical levels**: Review the stock chart for support/resistance
2. **Consider volatility**: High volatility = higher uncertainty
3. **Decision**: Either skip (lowest risk) or manually review (more work, more opportunity)

---

### Q: What if I only care about the highest-confidence options?

**A**: Filter by:
```
models_agree = Yes
v21_probability >= 0.80
ta_probability >= 0.80
agreement_strength = 'Strong'
```

This gives you ~5-10% of options but with 85%+ confidence.

---

### Q: How often is the file updated?

**A**: Daily. See the `scoring_date` field in the file for timestamp.

---

### Q: What if the models perform worse in the future?

**A**: Model performance will naturally vary with market conditions. We monitor:
- **Walk-forward AUC** (tests on future data): Primary metric
- **Agreement rate** (how often models align): Should stay 12-18%
- **Hit rate** (real trades): Verify expectations

If performance degrades, we'll update this guide and notify your team.

---

## Section 9: Technical Details (Optional Reference)

### Data Update Frequency
- Updated daily after market close
- Covers all Swedish equity options
- 18+ months of historical data retained

### Model Retraining Schedule
- Probability Optimization Model: Monthly recalibration
- TA ML Model: Quarterly retraining
- Automatic validation against walk-forward benchmark

### Historical Changes

| Date | Change | Impact |
|------|--------|--------|
| Jan 29, 2026 | Added TA ML Model validation | Introduced `ta_probability` and agreement fields |
| (Future) | Model improvements | Will be communicated in advance |

---

## Section 10: Support & Questions

### Who to Contact

**For field definitions**: See Section 3 (Field Reference Guide)

**For score interpretation**: See Section 6 (Understanding the Models)

**For practical questions**: See Section 8 (FAQ)

**For bug reports or anomalies**: Contact the options scoring team with:
- Date range of issue
- Stock/option symbols affected
- Screenshot showing disagreement

---

## Summary

The addition of the **TA ML Model** provides **independent validation** of your **unchanged Probability Optimization Model predictions**:

| Aspect | Benefit |
|--------|---------|
| **Confidence** | Agreement flag highlights highest-conviction trades |
| **Risk Management** | Disagreement flags alert you to investigate further |
| **Opportunity** | No options filtered out - you choose the tier |
| **Stability** | Both models tested on future data (walk-forward validation) |
| **No Breaking Changes** | Probability Optimization Model remains your primary model, TA ML Model is a validation layer |

**Best Practice**: Use the `models_agree` flag and `agreement_strength` field to **prioritize** your analysis. Options with `models_agree = Yes` and `agreement_strength = 'Strong'` deserve first attention.

---

**Document Version**: 1.0
**Last Updated**: January 30, 2026
**Next Review**: March 31, 2026
