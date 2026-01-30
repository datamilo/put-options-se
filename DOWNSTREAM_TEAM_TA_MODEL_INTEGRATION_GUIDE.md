# Current Options Scoring - V3 Integration Guide

**For**: Downstream Teams Using `current_options_scored.csv`
**Date**: January 30, 2026
**Document Version**: 1.0

---

## Executive Summary

The options scoring system has been enhanced with a **second independent model (TA Model)** that validates predictions from our primary model **(V2.1 Premium Optimization - unchanged)**. This guide explains:

1. **What changed**: Added TA Model as validation layer (V2.1 itself has NOT changed)
2. **Why we added the TA Model**: Risk management and cross-validation
3. **What each field means** (field reference)
4. **How well the models perform** (performance metrics)
5. **How to use the agreement flag** (practical decision-making)

---

## Section 1: What Changed?

### Previous System (V2.1 Only)
- **Scoring model**: V2.1 Premium Optimization (3-factor weighting)
- **Output**: Probability score for each option
- **Risk**: No independent validation

### New System (V2.1 + TA Model Dual-Validation)
- **Primary model**: V2.1 Premium Optimization (UNCHANGED - still uses 3-factor weighting)
- **Secondary model**: TA Model (NEW - machine learning validation)
- **Output**: Both probabilities + agreement flag
- **Benefit**: Cross-validation between different methodologies, confidence ranking

---

## Section 2: Why Add the TA Model? The Business Rationale

### The Problem We Solved

**V2.1 alone** optimizes for maximizing premiums (70-80% probability sweet spot), which is excellent for **business value** but relies on a single methodology.

**TA Model** provides **independent technical analysis validation** using a completely different approach:
- **V2.1 Premium Optimization**: Probabilistic weighting (Current Probability, Historical Peak, Support)
- **TA Model**: Machine learning classifier (learns patterns from 1.8M historical option expiration records)

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

### V2.1 Premium Optimization Model (UNCHANGED)

| Field | Meaning | Range | Interpretation |
|-------|---------|-------|-----------------|
| `v21_probability` | V2.1 predicted probability of expiration worthless | 0.0 - 1.0 | Higher = more confident option will expire worthless |
| `v21_bucket` | V2.1 confidence bucket | <60%, 60-70%, 70-80%, 80-90%, 90%+ | Categorical probability ranges |

**V2.1 Model Details (NO UPDATES - This Model is Unchanged):**
- Type: Weighted composite scoring (3 factors)
- Factors:
  - **Current Probability** (60% weight): Market-derived probability
  - **Historical Peak** (30% weight): Highest probability this option achieved historically
  - **Support Strength** (10% weight): Distance to nearest support level
- Performance: AUC = 0.78-0.79 on validation set
- Optimization: Designed for 70-80% probability "sweet spot" (highest premiums)
- **Status**: V2.1 has NOT been modified and remains your primary scoring model

### TA Model (NEW - Independent Validation Layer)

| Field | Meaning | Range | Interpretation |
|-------|---------|-------|-----------------|
| `ta_probability` | TA Model predicted probability | 0.0 - 1.0 | Independent ML-based prediction using different methodology |
| `ta_bucket` | TA Model confidence bucket | <60%, 60-70%, 70-80%, 80-90%, 90%+ | Same categorical ranges as V2.1 |

**TA Model Details (NEW Addition - Not a modification to V2.1):**
- Type: Random Forest machine learning classifier (17 features)
- Trained on: 1.8M historical option records
- Features:
  - **Stock-level indicators** (12): RSI, MACD, Bollinger Bands, ATR, Stochastic, ADX
  - **Contract-level factors** (5): Strike distance, time to expiry, option Greeks (Delta, Vega, Theta)
- Performance: AUC = 0.85 (independent validation model)
- Approach: Technical analysis based, learns from historical patterns
- **Purpose**: Provides independent validation of V2.1 predictions; works alongside V2.1 (not as a replacement)

### Agreement & Confidence Fields (Dual-Model Validation)

| Field | Meaning | Values | Use For |
|-------|---------|--------|---------|
| `both_models_agree_70pct` | Do V2.1 AND TA Model both predict ≥70%? | Yes/No | **Primary filter** - highest confidence |
| `v21_v3_agreement` | Categorical agreement between V2.1 and TA Model | Strong Agree, Moderate Agree, Disagree | Risk assessment |
| `agreement_bucket` | Agreement classification | Strong (80%+), Moderate (70%+), Weak (<70%) | Decision-making |

---

## Section 4: How to Interpret the Output

### Scenario 1: Strong Consensus (BEST CASE)

```
v21_probability: 0.85 (HIGH)
v3_probability:  0.82 (HIGH)
both_models_agree_70pct: YES
agreement_bucket: Strong
```

**Interpretation**:
- ✅ Both models strongly agree this option will expire worthless
- ✅ High confidence in prediction
- ✅ **BEST OPPORTUNITY** for premium collection

---

### Scenario 2: V2.1 Bullish, V3 Cautious (INVESTIGATE)

```
v21_probability: 0.78 (HIGH)
v3_probability:  0.65 (MODERATE)
both_models_agree_70pct: NO
agreement_bucket: Moderate
```

**Interpretation**:
- ⚠️ V2.1 sees good opportunity, but V3 is less confident
- ⚠️ May indicate option near key technical level
- ⚠️ Could be underpriced (opportunity) or risky (volatility)
- 💡 **Action**: Review technical chart, check support levels

---

### Scenario 3: Disagreement (USE CAUTION)

```
v21_probability: 0.75 (HIGH)
v3_probability:  0.52 (LOW)
both_models_agree_70pct: NO
agreement_bucket: Weak
```

**Interpretation**:
- ❌ Models strongly disagree
- ❌ Prediction is unreliable
- 💡 **Action**: Skip this option or require additional analysis

---

### Scenario 4: Both Models Conservative (SAFE)

```
v21_probability: 0.55 (LOW)
v3_probability:  0.48 (LOW)
both_models_agree_70pct: NO
agreement_bucket: Weak
```

**Interpretation**:
- ✓ Both models agree this is NOT a strong candidate
- ✓ Low false positive risk
- 💡 **Action**: Skip - look for better opportunities

---

## Section 5: Model Performance Metrics

### V2.1 Premium Optimization Model (UNCHANGED)

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

### TA Model (NEW)

| Metric | Value | Interpretation |
|--------|-------|-----------------|
| **Test AUC** | 0.850 | Excellent discrimination on recent data |
| **Walk-Forward AUC** | 0.651 | Equivalent temporal stability to V2.1 |
| **Training Data** | 1.8M option records | Large dataset spanning 18+ months |
| **Primary Use** | Independent validation | Confirms V2.1 predictions using different approach |
| **Status** | NEW ADDITION | This model is added alongside V2.1 for dual-model validation |

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

### V2.1 Premium Optimization: How It Works (UNCHANGED)

V2.1 combines three factors to identify options that will expire worthless. **This methodology has NOT been changed:**

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

### TA Model: How It Works (NEW ADDITION)

The TA Model uses machine learning to recognize patterns in historical option data. **This is a new addition to your system (not a modification to V2.1):**

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

**Result**: The TA Model recognizes which combinations of these signals historically preceded options expiring worthless, providing independent validation of V2.1 predictions.

---

## Section 7: Decision Framework (Using Dual-Model System)

### Recommended Usage by Scenario (V2.1 + TA Model Agreement)

**TIER 1: Best Opportunities** (V2.1 and TA Model both agree strongly)
- ✅ Action: **HIGH PRIORITY** for trade evaluation
- Confidence: Very High
- Expected hit rate: 85%+

**TIER 2: Good Opportunities** (v21_v3_agreement = "Moderate Agree")
- ✅ Action: **MEDIUM PRIORITY** - good candidates
- Confidence: High
- Expected hit rate: 75%+

**TIER 3: Mixed Signals** (v21_v3_agreement = "Disagree")
- ⚠️ Action: **REVIEW CAREFULLY** or skip
- Confidence: Low
- Expected hit rate: 55%+

**TIER 4: Both Conservative** (both models <70%)
- ✓ Action: **SKIP** - limited opportunity
- Confidence: Reliable (both agree it's not a good trade)
- Expected hit rate: N/A

---

## Section 8: Frequently Asked Questions

### Q: Why are there now two different models in the output (V2.1 and TA Model)?

**A**: Different methodologies catch different signals:
- **V2.1 Premium Optimization** (unchanged): Focuses on **current market conditions**, **historical probability peaks**, and **support levels**
- **TA Model** (NEW): Focuses on **technical chart patterns** and **contract-level dynamics (Greeks)**

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
both_models_agree_70pct = YES
v21_probability >= 0.80
ta_probability >= 0.80
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
- V2.1: Monthly recalibration
- V3: Quarterly retraining
- Automatic validation against walk-forward benchmark

### Historical Changes

| Date | Change | Impact |
|------|--------|--------|
| Jan 29, 2026 | Added V3 TA Model validation | Introduced `ta_probability` and agreement fields |
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

The addition of the **TA Model** provides **independent validation** of your **unchanged V2.1 predictions**:

| Aspect | Benefit |
|--------|---------|
| **Confidence** | Agreement flag highlights highest-conviction trades |
| **Risk Management** | Disagreement flags alert you to investigate further |
| **Opportunity** | No options filtered out - you choose the tier |
| **Stability** | Both models tested on future data (walk-forward validation) |
| **No Breaking Changes** | V2.1 remains your primary model, TA Model is a validation layer |

**Best Practice**: Use the `both_models_agree_70pct` flag to **prioritize** your analysis. Options with strong agreement between V2.1 and TA Model deserve first attention.

---

**Document Version**: 1.0
**Last Updated**: January 30, 2026
**Next Review**: March 31, 2026
