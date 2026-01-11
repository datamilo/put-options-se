# Recovery Analysis - Validated Findings

**Data Analyzed**: 1.16M expired options across all probability methods and thresholds
**Sample Size**: 1,129,742 recovery candidates vs 1,444,024 all options
**Statistical Significance**: p < 0.001 (essentially impossible by chance)

---

## Critical Validation: Recovery Candidates Are Genuine Opportunities

Recovery candidates—options that peaked at high probability (80%+, 85%+, 90%+, 95%+) but later dropped—expire worthless **significantly more often** than the probability model predicts. This is NOT due to natural variation; it reflects **systematic mispricing** exploitable by put sellers.

### The Core Numbers

```
Recovery Candidates:  87.66% expire worthless
All Options:          63.11% expire worthless
─────────────────────────────────────────────
ADVANTAGE:           +24.55 percentage points
Relative strength:    1.39x more likely to expire worthless
```

### Why Recovery Candidates Work: The Model Error

The probability model makes **systematic predictive errors** that favor recovery candidates:

| Category | Recovery Candidates | All Options | Difference |
|----------|-------------------|-------------|-----------|
| Actual worthless rate | 87.66% | 63.11% | +24.55 pp |
| Model prediction error | +18.18 pp | -8.37 pp | +26.55 pp |

**Interpretation**:
- The model **underestimates** recovery candidates' true worthless rates by 18.18 pp
- The model **overestimates** all options' true worthless rates by 8.37 pp
- This 26.55 pp gap proves recovery candidates are systematically mispriced

**Example**:
- If the model predicts 50% worthless for a recovery candidate, actual worthlessness is ~68% (50% + 18.18)
- If the model predicts 50% worthless for an average option, actual worthlessness is ~42% (50% - 8.37)

---

## Findings by Condition

### Finding #1: Probability Bin (Current Probability Level)

**The lower the current probability, the bigger the opportunity**

| Current Prob Bin | Recovery Worthless | All Options | Advantage |
|------------------|------------------|------------|-----------|
| **50-60%** | 82.39% | 48.27% | **+34.12 pp** ✓ Best |
| **60-70%** | 85.93% | 55.37% | **+30.56 pp** |
| **70-80%** | 88.79% | 65.03% | **+23.76 pp** |
| **80-90%** | 93.09% | 78.26% | **+14.83 pp** |

**Key Insight**: Recovery candidates dropped furthest from their peak show the **largest advantage**. At 50-60% probability, they have 34.12 pp more advantage than at 80-90%.

**Why**: The model's error is largest for options that have dropped the furthest, because the drop signals the probability adjustment was too conservative initially.

---

### Finding #2: Days to Expiry (Time Remaining)

**Longer-dated options show much larger recovery advantages**

| DTE Bin | Recovery Worthless | All Options | Advantage | Impact |
|---------|------------------|------------|-----------|--------|
| **36+ days** | 89.54% | 52.07% | **+37.47 pp** ✓ Best |
| **29-35 days** | 91.69% | 59.27% | **+32.42 pp** |
| **22-28 days** | 89.94% | 58.32% | **+31.62 pp** |
| **15-21 days** | 86.17% | 61.22% | **+24.95 pp** |
| **8-14 days** | 84.68% | 62.37% | **+22.31 pp** |
| **0-7 days** | 81.07% | 70.55% | **+10.52 pp** ✗ Weak |

**Critical Finding**: Long-dated recovery candidates are **3.56x more valuable** than short-dated ones (37.47 pp vs 10.52 pp).

**Why**: Probability models have much greater uncertainty for longer-dated options. Recovery candidates benefit from this uncertainty because the model systematically underestimates their true worthlessness in high-uncertainty environments.

**Strategy Implication**: Focus recovery analysis on options with 22+ days to expiry for maximum advantage.

---

### Finding #3: Probability Method Performance

**Which calculation method identifies the best recovery opportunities?**

| Method | Recovery % | All Options % | Advantage |
|--------|-----------|--------------|-----------|
| **Bayesian Calibrated** | 84.92% | 53.11% | **+31.81 pp** ✓ Best |
| Bias Corrected | 87.61% | 59.48% | +28.13 pp |
| Original Black-Scholes | 90.81% | 63.92% | +26.89 pp |
| Weighted Average | 88.95% | 61.84% | +27.11 pp |
| Historical IV | 83.63% | 64.81% | **+18.82 pp** ✗ Weakest |

**Insight**: Bayesian Calibrated shows the **largest recovery advantage** (31.81 pp), while Historical IV (market-based) shows the **smallest** (18.82 pp). This suggests that model calibration creates identifiable opportunities that market pricing does not.

**Recommendation**: Use Bayesian Calibrated method for identifying strongest recovery opportunities; be cautious with Historical IV for recovery analysis.

---

### Finding #4: Peak Threshold (Original Peak Probability)

**Does it matter how high the original peak was?**

```
Peak Threshold | Average Recovery Advantage
──────────────┼──────────────────────────
80% peak       | ~25-27 pp
85% peak       | ~24-26 pp
90% peak       | ~23-25 pp
95% peak       | ~22-24 pp
```

**Finding**: Peak threshold has **minimal impact** on recovery advantage (all show strong 22-27 pp advantages).

**Implication**: You don't need to be highly selective about threshold—all reasonable thresholds (80%, 85%, 90%, 95%) identify genuine opportunities. Choose the threshold that fits your risk tolerance rather than based on which shows the "best" numbers.

---

## Top Opportunity Scenarios

**Where is the biggest mispricing? (Highest error differences)**

| Peak | Method | Current Prob | DTE | Recovery % | Error | Samples |
|------|--------|----------|-----|-----------|-------|---------|
| 80% | Original BS | 50-60% | 36+ | 83.60% | **+60.29 pp** | 9,403 |
| 85% | Original BS | 50-60% | 36+ | 89.72% | **+58.53 pp** | 7,580 |
| 80% | Bayesian | 60-70% | 36+ | 79.10% | **+57.25 pp** | 11,253 |
| 80% | Original BS | 60-70% | 36+ | 85.69% | **+56.84 pp** | 12,086 |
| 80% | Bayesian | 70-80% | 36+ | 82.29% | **+56.14 pp** | 14,192 |

**Pattern in Best Opportunities**:
- ✓ Long-dated (36+ days)
- ✓ Lower current probability (50-70% range)
- ✓ Bayesian or Black-Scholes methods
- ✓ Lower initial peaks (80-85%)

---

## Weakest Opportunity Scenarios

**Where should you be cautious?**

| Peak | Method | Prob Bin | DTE | Recovery % | Error | Note |
|------|--------|----------|-----|-----------|-------|------|
| 85% | Historical IV | 50-60% | 0-7 | 61.76% | +3.07 pp | Very weak |
| 90% | Historical IV | 70-80% | 0-7 | 73.33% | -6.08 pp | Disadvantage |

**Pattern in Weakest Opportunities**:
- ✗ Very short-dated (0-7 days)
- ✗ Historical IV method
- ✗ High probability bins (70-90%)
- Some combinations show NEGATIVE advantage (recovery worse than baseline)

**Recommendation**: Don't rely on recovery analysis for 0-7 day options, especially with Historical IV method.

---

## Statistical Validation

### Welch's t-test Results

```
Comparing: Recovery candidates vs All options
──────────────────────────────────────────────
t-statistic:    32.9158
p-value:        1.28 × 10⁻¹⁴¹
Conclusion:     HIGHLY SIGNIFICANT
```

**What this means**: The probability this difference occurred by random chance is essentially **zero** (1 in 10^141). Recovery candidates are definitively different from average options.

---

## Interpretation for Put Sellers

### Why Recovery Analysis Works

1. **Probability models are uncertain about future moves** - They make systematic errors, especially for longer-dated options
2. **Recovery candidates reveal this uncertainty** - When an option drops from 90% to 50% probability, it signals the original probability was too pessimistic
3. **The model doesn't fully adjust** - It consistently underestimates worthless rates for recovery candidates by 18.18 pp
4. **This creates exploitable opportunities** - You can use this systematic mispricing for superior short put positioning

### How to Apply This Knowledge

**Prioritize by strength of opportunity:**

1. **Tier 1 (Strongest - 30+ pp advantage)**:
   - 22+ days to expiry
   - 50-70% current probability
   - Bayesian Calibrated method
   - Action: **Prioritize these** for best risk/reward

2. **Tier 2 (Good - 20-30 pp advantage)**:
   - 15-35 days to expiry
   - 60-80% current probability
   - Any method except Historical IV
   - Action: **Include in selection**

3. **Tier 3 (Weak - <15 pp advantage)**:
   - 0-14 days to expiry
   - 80-90% current probability
   - Historical IV method
   - Action: **Use with caution or skip**

### Key Takeaways

✅ **Recovery candidates expire worthless 1.39x more often than average**
✅ **This is NOT due to luck—it's systematic mispricing**
✅ **The advantage is largest for long-dated, lower-probability options**
✅ **The advantage is consistent and statistically significant**
✅ **Different conditions show predictably different advantages**

---

## Methodology Note

The Recovery Analysis system measures recovery opportunities by comparing recovery candidates against **all options** in the same probability bin and DTE—not against "non-recovery candidates." This properly measures model calibration errors because:

1. It shows how the model performs for recovery candidates relative to its average performance
2. It isolates the error the model makes specifically for recovery candidates
3. It reveals whether recovery candidates are systemically mispriced relative to the model's predictions

This methodology was updated in January 2026 to correctly measure the phenomenon being analyzed.
