# Scored Options Transparency Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, OR use superpowers:subagent-driven-development for subagent-driven task execution.

**Goal:** Add comprehensive contextual tooltips throughout the Scored Options Recommendations page to expose all depth from the INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md document while maintaining a clean, uncluttered UI.

**Architecture:** Create a unified tooltip content library (`scoredOptionsTooltips.ts`) organized by section (KPIs, Filters, Table Columns, Model Details, Disclaimers). Add info icons and Tooltip components throughout ScoredOptions page and child components (ScoredOptionsTable, V21Breakdown, TABreakdown, AgreementAnalysis). Use existing shadcn/ui Tooltip component for consistent styling.

**Tech Stack:** React 18, TypeScript, shadcn/ui (Tooltip), existing Lucide icons (Info icon), number formatting utilities

---

## Task 1: Create Unified Tooltip Content Library

**Files:**
- Create: `src/utils/scoredOptionsTooltips.ts`

**Step 1: Write the tooltip content file with all KPI, filter, column, and metric tooltips**

Create the file at `src/utils/scoredOptionsTooltips.ts` with the following structure:

```typescript
/**
 * Scored Options Recommendations - Tooltip Content Library
 * Centralized source of truth for all contextual help text
 * Based on INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md
 */

// ============================================
// SECTION 1: SUMMARY KPI TOOLTIPS
// ============================================

export const kpiTooltips = {
  totalOptions: {
    title: 'Total Options',
    content:
      'Total number of unique put options analyzed for the selected expiration date. This represents the complete universe of options available for that expiry across all Swedish stocks.',
  },
  modelsAgree: {
    title: 'Models Agree',
    content:
      'Count of options where BOTH the V2.1 probability model AND the TA Model (Technical Analysis) independently recommend the option (both scoring ≥70%). This dual-model agreement is your highest confidence signal for premium collection opportunities.',
  },
  strongAgreement: {
    title: 'Strong Agreement',
    content:
      'Options where both models score ≥80%. These represent the strongest consensus cases. Statistically, 12-18% of all options fall into this category with expected hit rates of 85%+. These are your highest-priority screening candidates.',
  },
  showing: {
    title: 'Showing',
    content:
      'Number of options currently displayed in the table after applying all your filter criteria. Adjust filters to see options matching your specific risk tolerance and model agreement preferences.',
  },
};

// ============================================
// SECTION 2: FILTER CONTROL TOOLTIPS
// ============================================

export const filterTooltips = {
  expiryDate: {
    title: 'Expiry Date',
    content:
      'Select which expiration date to analyze. Different expirations have different risk profiles due to time decay and volatility. The Premium Collection Strategy can be applied across all major expiration cycles.',
  },
  stocks: {
    title: 'Stocks',
    content:
      'Filter by individual stock or analyze across all available Swedish stocks. The analysis covers 5,743+ options daily across major Swedish equities. Select specific stocks to focus analysis or leave as "All stocks" for broad market coverage.',
  },
  modelAgreement: {
    title: 'Model Agreement',
    content:
      '**All Options**: Display all analyzed options regardless of model consensus.\n\n**Models Agree**: Show only options where both V2.1 AND TA models independently recommend (both ≥70%). This is your highest-confidence tier.\n\n**Models Disagree**: Show only options where models diverge. Useful for conflict analysis and understanding where analytical approaches diverge—represents a human review opportunity.',
  },
  minCombinedScore: {
    title: 'Min Combined Score',
    content:
      'Combined Score = Average of V2.1 Score and TA Probability.\n\nThe default 70 targets the optimal 70-80% probability range where historical data shows:\n- Hit rate: 77% (options expire worthless)\n- Premium multiplier: 5-10x higher than conservative 80%+ range\n- Expected calibration error: 2.4%\n\nThis represents the best risk-adjusted return profile. Adjust based on your risk tolerance.',
  },
  minV21Score: {
    title: 'Min V2.1 Score',
    content:
      'V2.1 Score = (Current Probability × 0.60) + (Historical Peak × 0.30) + (Support Strength × 0.10)\n\nThe 60/30/10 weighting reflects correlation strength with actual outcomes:\n- Current Probability (60%): AUC 0.7994—strongest individual predictor, reflects all market information\n- Historical Peak (30%): AUC 0.7736—captures mean reversion, stocks showing willingness to stay above strike historically likely to repeat\n- Support Strength (10%): AUC 0.6169—insurance against catastrophic losses\n\nModel Performance: Test AUC 0.862, Walk-Forward AUC 0.651 (proves genuine future predictive ability)',
  },
  minTAProb: {
    title: 'Min TA Probability',
    content:
      'Technical Analysis Model V2: Random Forest classifier using 9 technical features.\n\nTop 3 Most Important Features:\n1. Sigma_Distance (16.13%): Strike distance normalized by volatility AND time—captures contract-specific geometry\n2. MACD Histogram (14.02%): Trend momentum strength\n3. Distance from SMA50 (13.79%): Deviation from trend line\n\nThese three features account for 44% of predictive power, indicating robust signal discovery.\n\nModel Performance: Test AUC 0.8447, Walk-Forward AUC 0.651 (same as V2.1, validating robustness across methodologies)',
  },
};

// ============================================
// SECTION 3: TABLE COLUMN HEADER TOOLTIPS
// ============================================

export const columnTooltips = {
  v21Score: {
    title: 'V2.1 Score',
    content:
      '**Formula:** (Current Probability × 0.60) + (Historical Peak × 0.30) + (Support Strength × 0.10) = 0-100 score\n\n**What It Measures:**\n- **Current Probability (60% weight)**: Market\'s implied assessment that option expires worthless. Uses Bayesian isotonic calibration of Black-Scholes theoretical prices. Most reliable single factor.\n- **Historical Peak (30% weight)**: Maximum probability this option has achieved. Signals mean reversion—stocks showing willingness to stay above strike are likely to repeat.\n- **Support Strength (10% weight)**: Robustness of structural support below strike. Acts as safeguard against catastrophic ITM moves.\n\n**Performance Metrics:**\n- Test AUC: 0.862 (excellent discrimination on recent data)\n- Walk-Forward AUC: 0.651 (good generalization to future unseen periods)\n- Test/Train Gap: 0.211 (low overfitting—patterns generalize well)\n\n**Calibration:** When predicting 75%, actual outcomes are 77% (2% error). Predictions match reality within 2.4% on average.',
  },
  taProbability: {
    title: 'TA Probability',
    content:
      '**Technical Analysis Model V2:** Random Forest classifier with 9 technical features and isotonic regression calibration.\n\n**Why Random Forest:**\n- Handles mixed feature scales naturally (RSI 0-100, Sigma_Distance -3000 to 0)\n- Captures non-linear technical pattern interactions automatically\n- Produces calibrated probability estimates\n- Fast training on 1.8M historical records\n\n**Feature Importance Rankings:**\n1. Sigma_Distance (16.13%): Strike normalized by volatility & time\n2. MACD Histogram (14.02%): Trend momentum\n3. Distance SMA50 (13.79%): Deviation from trend\n4-9. [RSI, MACD Slope, Vol Ratio, BB Position, RSI Slope, Days to Expiry]\n\n**Performance Metrics:**\n- Test AUC: 0.8447 (excellent discrimination)\n- Walk-Forward AUC: 0.651 (same as V2.1—validates robustness)\n- Brier Score: 0.1608 (well-calibrated probabilities)\n- Coverage: 99.9% (5,738 of 5,743 options scored)',
  },
  combined: {
    title: 'Combined Score',
    content:
      'Combined Score = Average of V2.1 Score and TA Probability.\n\n**Why Average?** Both models independently achieve 0.651 walk-forward AUC (proven future prediction ability). Averaging two independent models reduces variance and improves robustness.\n\n**Color Coding:**\n- Green (≥80): Conservative range (90% hit rate but 1x premiums)\n- Amber (70-79): **OPTIMAL RANGE** (77% hit rate with 5-10x premiums)\n- Red (<70): Elevated risk (hit rate below 70%)\n\n**Decision Framework:**\n- Combined ≥70 with models agreeing = Actionable signal\n- Combined ≥70 with models disagreeing = Mixed signals, requires human review\n- Combined <70 = Generally avoid (exception: specific strategy requirements)',
  },
  agree: {
    title: 'Agreement Status',
    content:
      'Do V2.1 AND TA models both recommend this option (both ≥70%)?\n\n**✓ = Agreement:** Both models independently recommend\n**✕ = Disagreement:** Models diverge on recommendation\n\n**Why Two Independent Models?**\n- Different methodologies capture different market aspects\n- V2.1: Probability-focused (market-derived signals)\n- TA Model: Technical pattern-focused (momentum/geometry signals)\n- Independent confirmation increases confidence\n- Disagreement signals analytical opportunity for human review\n\n**Statistical Distribution:**\n- Both ≥80%: 12% of options (expected hit rate 85%+)\n- Both 70-79%: 6% of options (expected hit rate 75%+)\n- One <60%, one ≥70%: 70% of options (mixed signals)\n- Both <60%: 12% of options (reject tier)\n\n**Normal & Expected:** 70% option disagreement is expected behavior, not a system failure.',
  },
  strength: {
    title: 'Agreement Strength',
    content:
      'When models agree (both ≥70%), how strong is that consensus?\n\n**Strong** (both ≥80%):\n- Highest confidence tier\n- ~12% of all options\n- Expected hit rate: 85%+\n- Priority candidates for premium collection\n\n**Moderate** (both 70-79%):\n- Good confidence\n- ~6% of all options\n- Expected hit rate: 75%+\n- Solid secondary candidates\n\n**Weak** (both 60-69%):\n- Marginal confidence\n- Smaller subset\n- Exercise caution\n- Useful for secondary analysis\n\n**Portfolio Construction:** Use agreement tier for prioritization. Build portfolio starting with Strong, then Moderate, balancing capital across confidence tiers.',
  },
};

// ============================================
// SECTION 4: V2.1 MODEL DETAIL TOOLTIPS
// ============================================

export const v21DetailTooltips = {
  currentProbability: {
    title: 'Current Probability',
    content:
      'Market-derived probability that this option expires worthless.\n\n**Calculation Method:** Bayesian isotonic calibration applied to Black-Scholes theoretical prices.\n\n**Why It\'s Weighted 60%:**\n- AUC 0.7994 (strongest individual predictor)\n- Market prices reflect all available information\n- Direct measure of likely outcome\n- Calibration ensures predictions match reality\n\n**Interpretation:**\n- 90% Current Probability = Market believes 90% chance of expiration worthless\n- This is the primary signal in the composite model\n- When calibrated correctly (verified monthly), predicted probabilities match empirical frequencies within 2.4%',
  },
  historicalPeak: {
    title: 'Historical Peak',
    content:
      'Maximum probability this specific option contract has ever reached during its lifetime.\n\n**Why This Signal Matters:**\n- Options experience mean reversion patterns\n- Historical peak indicates stock\'s capacity to move away from strike\n- Higher peak suggests stock has shown willingness to stay above strike\n\n**Business Insight:** "Stocks that have previously moved strongly above the strike are more likely to expire worthless."\n\n**Why It\'s Weighted 30%:**\n- AUC 0.7736 (second-strongest predictor)\n- Captures proven stock behavior pattern\n- Provides directional confidence that current market conditions represent achievable outcomes\n\n**Example:**\n- Option A: Current 70%, Peak 85% → Composite boosted (proven ability to stay OTM)\n- Option B: Current 70%, Peak 40% → Composite reduced (never showed strength)',
  },
  supportStrength: {
    title: 'Support Strength',
    content:
      'Robustness metric of the structural support level below the strike price.\n\n**Calculation:** Based on historical price clustering and support level strength analysis.\n\n**Why This Signal Matters:**\n- Support levels act as natural price floors\n- Strong support reduces probability of deep ITM (in-the-money) moves\n- Prevents catastrophic losses if trade moves against you\n\n**Business Insight:** "Reliable price floors reduce risk of large losses."\n\n**Why It\'s Weighted 10%:**\n- AUC 0.6169 (weakest predictor but still useful)\n- Provides insurance/safeguard function\n- Useful for risk management, not primary signal\n\n**Interpretation:** Support Strength acts as a risk filter. Options trading below weak support are flagged as riskier despite favorable primary signals.',
  },
};

// ============================================
// SECTION 5: TA MODEL TECHNICAL INDICATOR TOOLTIPS
// ============================================

export const taStockIndicatorTooltips = {
  rsi14: {
    title: 'RSI 14',
    content:
      'Relative Strength Index: 14-period momentum indicator (0-100 scale).\n\n**Interpretation:**\n- >70: Overbought condition\n- <30: Oversold condition\n- 30-70: Neutral range\n\n**Feature Importance:** 11.09%\n\n**Role in Model:** Combined with RSI Slope to detect momentum extremes and potential reversals. Captures price extremes that may indicate mean reversion opportunities.',
  },
  rsiSlope: {
    title: 'RSI Slope',
    content:
      '3-period RSI change. Measures momentum direction and acceleration.\n\n**Positive Slope:** RSI strengthening, momentum increasing\n**Negative Slope:** RSI weakening, momentum decreasing\n\n**Feature Importance:** 9.15%\n\n**Role in Model:** Detects inflection points—changes in momentum direction that signal potential reversals.',
  },
  macdHist: {
    title: 'MACD Histogram',
    content:
      'Moving Average Convergence Divergence histogram: difference between MACD and signal line.\n\n**What It Measures:** Trend momentum strength and direction.\n\n**Positive:** MACD above signal line (bullish momentum)\n**Negative:** MACD below signal line (bearish momentum)\n\n**Feature Importance:** 14.02% (second-highest overall)\n\n**Role in Model:** MACD Histogram accounts for 14% of all predictions. Distance from trend is crucial for probability prediction. When combined with Slope, captures trend acceleration patterns.',
  },
  macdSlope: {
    title: 'MACD Slope',
    content:
      '3-period MACD change. Measures trend acceleration and deceleration.\n\n**Positive Slope:** Momentum accelerating upward\n**Negative Slope:** Momentum decelerating or reversing\n\n**Feature Importance:** 11.12%\n\n**Role in Model:** Captures trend momentum changes. Combined with MACD Histogram (total 25% importance) to understand both absolute momentum level and its direction.',
  },
  bbPosition: {
    title: 'Bollinger Band Position',
    content:
      'Price location within Bollinger Bands (0-1 scale).\n\n**Scale:**\n- 0 = Price at lower band (oversold extreme)\n- 0.5 = Price at middle band\n- 1 = Price at upper band (overbought extreme)\n\n**Feature Importance:** 9.59%\n\n**Role in Model:** Identifies price extremes and mean reversion opportunities. Extreme positions (near 0 or 1) suggest potential reversals toward center.',
  },
  distSMA50: {
    title: 'Distance from SMA50',
    content:
      'Normalized distance from 50-day moving average (trend line).\n\n**Positive:** Price above trend line\n**Negative:** Price below trend line\n**Magnitude:** How far price has moved from trend\n\n**Feature Importance:** 13.79% (third-highest)\n\n**Role in Model:** Captures deviation from trend. Combined with MACD measures, accounts for trend-related signals (25%+ total). Large deviations signal potential mean reversion.',
  },
  volRatio: {
    title: 'Volume Ratio',
    content:
      'Recent trading volume relative to historical average.\n\n**>1.0:** Volume elevated above average\n**<1.0:** Volume below average\n\n**Feature Importance:** 9.67%\n\n**Role in Model:** Detects volatility regime changes. Elevated volume can confirm momentum moves or signal potential reversals. Used to assess conviction behind price moves.',
  },
  adx14: {
    title: 'ADX 14',
    content:
      'Average Directional Index: measures trend strength (0-100 scale).\n\n**Interpretation:**\n- 0-20: Weak trend (ranging market)\n- 20-40: Moderate trend\n- 40+: Strong trend\n\n**Feature Importance:** Included in TA Model V3\n\n**Role in Model:** Captures whether market is trending or ranging. Strong trends provide clearer directional signals; weak trends suggest consolidation.',
  },
  adxSlope: {
    title: 'ADX Slope',
    content:
      'Direction of ADX over 3 periods.\n\n**Positive Slope:** Trend strengthening\n**Negative Slope:** Trend weakening\n\n**Role in Model:** Detects whether trend is becoming more established or breaking down. Combined with ADX level for complete trend picture.',
  },
  atr14: {
    title: 'ATR 14',
    content:
      'Average True Range: volatility measure over 14 periods.\n\n**Higher ATR:** Stock has large daily price swings (high volatility)\n**Lower ATR:** Stock has small daily price swings (low volatility)\n\n**Role in Model:** Captures volatility regime. Used contextually—high ATR in established trend suggests conviction, high ATR in ranging market suggests uncertainty.',
  },
  stochasticK: {
    title: 'Stochastic K',
    content:
      'Stochastic K line (0-100 scale, 14-period).\n\n**Interpretation:**\n- <20: Oversold\n- 20-80: Normal range\n- >80: Overbought\n\n**Role in Model:** Momentum oscillator showing price position within recent range. Extreme positions suggest potential reversals.',
  },
  stochasticD: {
    title: 'Stochastic D',
    content:
      'Stochastic D: 3-period smoothed version of K line.\n\n**Relationship:** D is the "signal line" of Stochastic K\n\n**Crossovers:** K crossing above/below D generates trading signals\n\n**Role in Model:** Smoother momentum signal. Used to filter false K signals and identify cleaner reversal points.',
  },
};

// ============================================
// SECTION 6: CONTRACT-LEVEL INDICATORS TOOLTIPS
// ============================================

export const taContractIndicatorTooltips = {
  sigmaDistance: {
    title: 'Sigma Distance',
    content:
      '**THE KEY INNOVATION:** Strike distance normalized by both volatility AND time to expiration.\n\n**Formula:** (Strike - Current Price) / (Annual HV × √(DTE/365))\n\n**Why It\'s Revolutionary:**\n- 2% OTM on volatile tech stock ≠ 2% OTM on utility stock\n- Same normalized distance on 5-day expiry ≠ same on 30-day expiry\n- Previous systems couldn\'t differentiate; this feature makes that distinction\n\n**Impact on Probabilities:**\n- Without Sigma_Distance: All options in same stock cluster together with similar probabilities\n- With Sigma_Distance: Probabilities range from 0.044 to 0.992 (full spectrum)\n- Enables strike-level AND expiration-level differentiation\n\n**Feature Importance:** 16.13% (highest single feature)\n\n**Interpretation:** This is the most important technical feature in the TA Model. It tells you whether an option is truly OTM when accounting for the stock\'s typical daily moves and how much time remains.',
  },
  delta: {
    title: 'Delta (Greeks)',
    content:
      '**Option Sensitivity to Stock Price Changes**\n\nRange: -1 to 0 (for put options)\n\n**Interpretation:**\n- Delta of -0.30: Option price changes $0.30 for every $1 stock move\n- Delta of -0.70: Option price changes $0.70 for every $1 stock move\n- Closer to -1: Option behaves more like owning the stock (higher ITM risk)\n- Closer to 0: Option is deeply OTM (lower probability of exercise)\n\n**Business Meaning:** Shows how much your premium exposure varies with stock price moves. Lower magnitude delta = safer OTM position.',
  },
  vega: {
    title: 'Vega (Greeks)',
    content:
      '**Option Sensitivity to Volatility Changes**\n\nPositive Vega: Option benefits from IV (implied volatility) increases\nNegative Vega: Option suffers from IV decreases\n\n**Business Meaning:** Shows how exposed you are to volatility regime changes. Positive Vega means market volatility increases boost option value (helps seller). Negative Vega means volatility decreases hurt option value.',
  },
  theta: {
    title: 'Theta (Greeks)',
    content:
      '**Time Decay per Day**\n\nPositive Theta: Option loses value each day (seller benefits)\nNegative Theta: Option gains value each day (seller loses)\n\n**Business Meaning:** Positive Theta is critical for put sellers—you profit simply from time passing. Higher Theta = faster premium decay capture. Typically positive for OTM put options you\'re selling.\n\n**Role in Strategy:** Larger Theta combined with favorable strike geometry indicates strong premium collection potential.',
  },
};

// ============================================
// SECTION 7: AGREEMENT ANALYSIS TOOLTIPS
// ============================================

export const agreementTooltips = {
  modelsAgreeField: {
    title: 'Models Agree',
    content:
      'Boolean indicator: Do BOTH independent models recommend this option (both ≥70%)?\n\n**Why Two Models?** Different methodologies capture different aspects of market behavior:\n- **V2.1**: Probability-focused weighting of market-derived signals\n- **TA Model**: Machine learning trained on technical pattern interactions\n\n**Agreement as Confidence Signal:** When independent models trained on different principles reach same conclusion, confidence increases substantially. Disagreement signals mixed signals requiring human analysis.\n\n**Statistical Basis:** Both models achieve identical 0.651 walk-forward AUC, proving they have equivalent predictive ability despite different approaches.',
  },
  agreementStrengthField: {
    title: 'Agreement Strength',
    content:
      'When models agree, what tier of agreement is it?\n\n**Strong** (both ≥80%):\n- Highest confidence tier\n- 12% of all options\n- Expected hit rate: 85%+\n- Priority candidates\n\n**Moderate** (both 70-79%):\n- Good confidence\n- 6% of all options\n- Expected hit rate: 75%+\n- Secondary candidates\n\n**Weak** (both 60-69%):\n- Lower confidence\n- Marginal candidates\n- Exercise caution\n\n**Portfolio Strategy:** Prioritize Strong, then Moderate. Use agreement tier to allocate capital—allocate more to higher-confidence tiers.',
};

// ============================================
// SECTION 8: KEY METRICS & VALIDATION TOOLTIPS
// ============================================

export const validationTooltips = {
  hitRate77: {
    title: '77% Hit Rate at 70-80% Range',
    content:
      '**Historical Finding (21+ months of data, 934K+ expired options):**\n\nWhen options score in the 70-80% probability range:\n- 77% actually expire worthless\n- 23% expire in-the-money (loss scenario)\n\n**Why This Matters:**\n- This trade-off is intentional and optimal\n- 23% failure rate is acceptable given 5-10x premium multiplier\n- Risk-adjusted returns are superior to 80%+ range (92% hit rate but 1x premiums)\n\n**Position Sizing Implication:** If you trade 10 options in this range, expect ~2-3 losses. Your position sizing must account for this known failure rate. Can\'t be surprised by losses that are statistically expected.',
  },
  walkForwardAUC: {
    title: 'Walk-Forward AUC 0.651',
    content:
      '**THE MOST IMPORTANT VALIDATION METRIC**\n\n**What It Measures:** How well the model predicts FUTURE unseen data (not past data).\n\n**Methodology:**\n1. Train model on months 1-6\n2. Test on month 7 (unseen)\n3. Retrain including month 7\n4. Test on month 8 (unseen)\n(Repeat through January 2026)\n\n**Interpretation:**\n- AUC 0.651 means model correctly orders option pairs 65.1% of the time\n- Proves genuine predictive ability, not curve-fitting\n- Equivalent across both V2.1 and TA models (validates robustness)\n\n**Why It\'s Better Than Test AUC:**\n- Test AUC (0.862): How well model fits RECENT held-out data (can be misleading)\n- Walk-Forward AUC (0.651): How well model predicts FUTURE periods (true validation)\n- A model with Test 0.96 but Walk-Forward 0.52 is worse than useless—it fits past but can\'t predict future\n\n**Critical Distinction:**\n- Our gap: 0.862 - 0.651 = 0.211 (small gap = low overfitting)\n- Rejected ensemble clustering: 0.96 - 0.58 = 0.410 (large gap = severe overfitting)\n\n**Conclusion:** 0.651 walk-forward AUC proves the system has real future predictive ability despite not being perfect.',
  },
  calibrationError: {
    title: 'Calibration Error 2.4%',
    content:
      '**Do Predicted Probabilities Match Reality?**\n\nCalibration measures whether the model\'s probability predictions are accurate.\n\n**Example:**\n- Model predicts 75% for 100 options\n- Actual result: 77% expire worthless (within 2.4% of prediction)\n- Perfect calibration (error = 0%) is impossible, but 2.4% is excellent\n\n**Monthly Recalibration:**\n- Each month, ~900 options expire with known outcomes\n- Isotonic regression refits predictions to empirical frequencies\n- 934K+ historical expired options validate accuracy\n- Monthly process ensures calibration stays current\n\n**Business Implication:** When system recommends 70%, you can trust actual hit rate will be approximately 70% (within 2.4%). This makes position sizing reliable and expectations realistic.',
  },
};

// ============================================
// SECTION 9: DISCLAIMER & RISK TOOLTIPS
// ============================================

export const disclaimerTooltips = {
  riskHitRate: {
    title: '⚠️ 77% Hit Rate Reality',
    content:
      '**Critical Understanding:**\n\n77% hit rate means **23% FAILURE RATE** for options in 70-80% range.\n\nThis means:\n- If you write 10 options in this range, ~2-3 will expire in-the-money\n- You WILL experience losses\n- This is expected and built into the risk/reward calculation\n- Position sizing must account for these losses\n\n**Position Sizing Example:**\n- Premium collected: 100 kr per option\n- Strike distance: 50 kr\n- Expected return: (0.77 × 100) - (0.23 × 50) = 77 - 11.5 = 65.5 kr per option\n\nLosses are not failures—they\'re part of the probabilistic system.',
  },
  marketRegimeRisk: {
    title: '⚠️ Market Regime Changes',
    content:
      '**Historical Limitation:**\n\nModels trained on April 2024 - January 2026 (21+ months):\n- Mostly normal market conditions\n- Limited bear market testing (small 2024 correction only)\n- No data through financial crisis, rate shocks, or extreme events\n\n**Risk:** If Swedish market enters fundamentally new regime (geopolitical crisis, rate explosion, etc.), learned patterns may become less relevant.\n\n**Mitigation:**\n- Monthly recalibration adapts to recent patterns\n- Daily health monitoring detects performance drift\n- Walk-forward validation catches degradation\n- But lag time exists—alerts may come weeks after regime shift begins\n\n**Responsibility:** Monitor walk-forward performance monthly. If AUC drops significantly below 0.60, system requires investigation.',
  },
  noGuarantees: {
    title: '⚠️ No Future Guarantees',
    content:
      '**Most Important Disclaimer:**\n\nPast walk-forward validation (0.651 AUC) does NOT guarantee future results.\n\nThis system:\n- ✓ Screens options based on probabilistic analysis\n- ✓ Identifies high-probability candidates\n- ✓ Ranks by confidence via model agreement\n- ✗ Does NOT promise profits\n- ✗ Does NOT eliminate market risk\n- ✗ Does NOT replace human judgment\n\n**Appropriate Use:**\n- Component of broader investment process\n- Initial screening tool\n- Confidence ranking mechanism\n- Input to human decision-making\n\n**Inappropriate Use:**\n- Sole decision maker\n- Guarantee of profitability\n- Replacement for risk management\n- Automated trading without oversight',
  },
};

// ============================================
// EXPORT ALL TOOLTIPS AS ORGANIZED OBJECT
// ============================================

export const scoredOptionsTooltips = {
  kpis: kpiTooltips,
  filters: filterTooltips,
  tableColumns: columnTooltips,
  v21Details: v21DetailTooltips,
  taStockIndicators: taStockIndicatorTooltips,
  taContractIndicators: taContractIndicatorTooltips,
  agreement: agreementTooltips,
  validation: validationTooltips,
  disclaimers: disclaimerTooltips,
};

/**
 * Helper function to render tooltip content with markdown-like formatting
 * Converts **bold** and line breaks
 */
export const formatTooltipContent = (text: string): React.ReactNode => {
  return text.split('\n').map((line, idx) => {
    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return (
      <div key={idx} className="mb-2">
        <span dangerouslySetInnerHTML={{ __html: formatted }} />
      </div>
    );
  });
};
```

**Step 2: Verify the file was created correctly**

Check that the file exists and contains all tooltip sections:
```bash
ls -la src/utils/scoredOptionsTooltips.ts
```

Expected: File should exist and be ~1500+ lines containing all organized tooltip content.

**Step 3: Commit the tooltip library**

```bash
git add src/utils/scoredOptionsTooltips.ts
git commit -m "feat: create unified tooltip content library for Scored Options transparency

- Create src/utils/scoredOptionsTooltips.ts with organized tooltip content
- 9 sections: KPIs, Filters, Table Columns, V2.1 Details, TA Stock Indicators, TA Contract Indicators, Agreement Analysis, Validation Metrics, Disclaimers
- All content sourced from INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md
- Includes helper function for markdown formatting
- Enables maximum depth transparency while maintaining clean UI

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create InfoIcon Helper Component

**Files:**
- Create: `src/components/ui/info-icon-tooltip.tsx`

**Step 1: Write the InfoIcon component with Tooltip wrapper**

```typescript
import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoIconTooltipProps {
  title?: string;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
}

/**
 * Reusable component: Info icon with tooltip
 * Usage: <InfoIconTooltip title="Title" content="Tooltip text" />
 */
export const InfoIconTooltip: React.FC<InfoIconTooltipProps> = ({
  title,
  content,
  side = 'right',
  delayDuration = 200,
}) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={title ? `${title} information` : 'More information'}
          >
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm">
          {title && <p className="font-semibold mb-2">{title}</p>}
          <div className="text-sm whitespace-pre-wrap">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
```

**Step 2: Test the component exists and is importable**

Verify the file was created:
```bash
ls -la src/components/ui/info-icon-tooltip.tsx
```

**Step 3: Commit the InfoIcon component**

```bash
git add src/components/ui/info-icon-tooltip.tsx
git commit -m "feat: create InfoIconTooltip reusable component

- Add src/components/ui/info-icon-tooltip.tsx
- Wraps Info icon with shadcn Tooltip component
- Supports custom title, content, side position, delay
- Accessible with ARIA labels and keyboard support
- Reusable across all Scored Options components

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add Tooltips to Summary KPI Cards

**Files:**
- Modify: `src/pages/ScoredOptions.tsx:180-250` (KPI cards section)

**Step 1: Import tooltip utilities and component**

At top of ScoredOptions.tsx, add imports:

```typescript
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import { scoredOptionsTooltips } from '@/utils/scoredOptionsTooltips';
```

**Step 2: Update KPI cards with info icons**

Replace the KPI cards section (lines 180-250) with version that includes info icons. Each card's label should be followed by an info icon:

For example, the "Total Options" card becomes:

```typescript
<Card>
  <CardContent className="pt-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm text-muted-foreground">Total Options</p>
          <InfoIconTooltip
            title={scoredOptionsTooltips.kpis.totalOptions.title}
            content={scoredOptionsTooltips.kpis.totalOptions.content}
          />
        </div>
        <p className="text-3xl font-bold mt-2">{summary.totalOptions}</p>
      </div>
      <TrendingUp className="h-8 w-8 text-blue-600" />
    </div>
  </CardContent>
</Card>
```

Do the same for remaining 3 KPI cards using appropriate tooltip references.

**Step 3: Test that tooltips display**

Run dev server and hover over info icons in KPI cards. Verify tooltips appear with correct content.

**Step 4: Commit KPI tooltip additions**

```bash
git commit -m "feat: add info icon tooltips to KPI summary cards

- Import InfoIconTooltip component and tooltip content library
- Add info icons next to Total Options, Models Agree, Strong Agreement, Showing
- Each icon reveals detailed explanation on hover
- Maintains clean KPI card layout while adding maximum transparency

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Add Tooltips to Filter Controls

**Files:**
- Modify: `src/components/scored-options/ScoredOptionsFilters.tsx`

**Step 1: Add imports**

At top of ScoredOptionsFilters.tsx:

```typescript
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import { scoredOptionsTooltips } from '@/utils/scoredOptionsTooltips';
```

**Step 2: Add info icons next to each filter label**

For each filter control, wrap the label with the info icon. Example pattern:

```typescript
<div className="flex items-center gap-2">
  <label className="text-sm font-medium">Expiry Date</label>
  <InfoIconTooltip
    content={scoredOptionsTooltips.filters.expiryDate.content}
    side="bottom"
  />
</div>
```

Apply this pattern to all 5 filters:
- Expiry Date
- Stocks
- Model Agreement
- Min Combined Score
- Min V2.1 Score
- Min TA Prob

**Step 3: Test filter tooltips display correctly**

Run dev server and hover over info icons next to each filter. Verify tooltips appear and content is readable.

**Step 4: Commit filter tooltip additions**

```bash
git commit -m "feat: add info icon tooltips to all filter controls

- Add InfoIconTooltip to each filter label
- Expiry Date, Stocks, Model Agreement, Min Combined Score, Min V2.1, Min TA Prob
- Each tooltip explains filter purpose and impact on results
- Positioned below labels for easy access while filtering

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Add Tooltips to Table Column Headers

**Files:**
- Modify: `src/components/scored-options/ScoredOptionsTable.tsx:127-152` (SortableHeader component and column definitions)

**Step 1: Import tooltip utilities**

At top of ScoredOptionsTable.tsx:

```typescript
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import { scoredOptionsTooltips } from '@/utils/scoredOptionsTooltips';
```

**Step 2: Create enhanced SortableHeader component**

Replace the SortableHeader component to include optional info icon:

```typescript
const SortableHeader = ({
  field,
  label,
  align = 'left',
  tooltipContent,
  tooltipTitle,
}: {
  field: SortField;
  label: string;
  align?: 'left' | 'right' | 'center';
  tooltipContent?: string;
  tooltipTitle?: string;
}) => (
  <TableHead
    className={`cursor-pointer hover:bg-muted/50 ${
      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''
    }`}
    onClick={() => handleSort(field)}
  >
    <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
      <span>{label}</span>
      {sortField === field &&
        (sortDirection === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        ))}
      {tooltipContent && (
        <InfoIconTooltip
          title={tooltipTitle}
          content={tooltipContent}
          side="bottom"
        />
      )}
    </div>
  </TableHead>
);
```

**Step 3: Update column header calls with tooltips**

Update the table header row to pass tooltip content for key columns:

```typescript
<TableHeader>
  <TableRow>
    <TableHead className="w-12">Details</TableHead>
    <SortableHeader field="stock_name" label="Stock" />
    <SortableHeader field="option_name" label="Option" />
    <SortableHeader field="strike_price" label="Strike" align="right" />
    <SortableHeader field="expiry_date" label="Expiry" />
    <SortableHeader field="days_to_expiry" label="DTE" align="right" />
    <SortableHeader field="premium" label="Premium" align="right" />
    <SortableHeader
      field="v21_score"
      label="V2.1 Score"
      align="right"
      tooltipTitle={scoredOptionsTooltips.tableColumns.v21Score.title}
      tooltipContent={scoredOptionsTooltips.tableColumns.v21Score.content}
    />
    <SortableHeader
      field="ta_probability"
      label="TA Prob"
      align="right"
      tooltipTitle={scoredOptionsTooltips.tableColumns.taProbability.title}
      tooltipContent={scoredOptionsTooltips.tableColumns.taProbability.content}
    />
    <SortableHeader
      field="combined_score"
      label="Combined"
      align="right"
      tooltipTitle={scoredOptionsTooltips.tableColumns.combined.title}
      tooltipContent={scoredOptionsTooltips.tableColumns.combined.content}
    />
    <SortableHeader
      field="models_agree"
      label="Agree"
      align="center"
      tooltipTitle={scoredOptionsTooltips.tableColumns.agree.title}
      tooltipContent={scoredOptionsTooltips.tableColumns.agree.content}
    />
    <SortableHeader
      field="agreement_strength"
      label="Strength"
      tooltipTitle={scoredOptionsTooltips.tableColumns.strength.title}
      tooltipContent={scoredOptionsTooltips.tableColumns.strength.content}
    />
  </TableRow>
</TableHeader>
```

**Step 4: Test table column tooltips**

Run dev server, hover over info icons in table headers. Verify detailed explanations appear.

**Step 5: Commit table header tooltips**

```bash
git commit -m "feat: add info icon tooltips to table column headers

- Import tooltip library and InfoIconTooltip component
- Enhance SortableHeader to support optional info icons
- Add tooltips to: V2.1 Score, TA Prob, Combined, Agree, Strength
- Each tooltip explains calculation method and performance metrics
- Icons positioned in headers, don't interfere with sorting

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Add Tooltips to V2.1 Breakdown Component

**Files:**
- Modify: `src/components/scored-options/V21Breakdown.tsx`

**Step 1: Import tooltip utilities**

At top of V21Breakdown.tsx:

```typescript
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import { scoredOptionsTooltips } from '@/utils/scoredOptionsTooltips';
```

**Step 2: Add info icons to each V2.1 factor**

Update the three factor sections (Current Probability, Historical Peak, Support Strength) to include info icons next to labels.

For example, Current Probability section becomes:

```typescript
<div>
  <div className="flex items-center gap-2 mb-2">
    <span className="text-sm font-medium">Current Probability</span>
    <InfoIconTooltip
      title={scoredOptionsTooltips.v21Details.currentProbability.title}
      content={scoredOptionsTooltips.v21Details.currentProbability.content}
      side="top"
    />
  </div>
  <div className="flex justify-between items-center mb-2">
    <span className="font-semibold">
      {option.current_probability != null ? formatNordicPercentage(option.current_probability, 2) : '-'}
    </span>
  </div>
  {/* Rest of current probability section */}
</div>
```

Apply the same pattern to Historical Peak and Support Strength sections.

**Step 3: Test V2.1 breakdown tooltips**

Expand a table row and verify tooltips appear when hovering over info icons in V2.1 breakdown section.

**Step 4: Commit V2.1 tooltips**

```bash
git commit -m "feat: add info icon tooltips to V2.1 Breakdown section

- Add InfoIconTooltip to Current Probability, Historical Peak, Support Strength
- Each tooltip explains calculation method, AUC performance, and weighting rationale
- Positioned next to factor labels in expandable detail view
- Enables investor education about V2.1 model mechanics

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Add Tooltips to TA Breakdown Component

**Files:**
- Modify: `src/components/scored-options/TABreakdown.tsx`

**Step 1: Import tooltip utilities**

At top of TABreakdown.tsx:

```typescript
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import { scoredOptionsTooltips } from '@/utils/scoredOptionsTooltips';
```

**Step 2: Add info icons to stock-level technical indicators**

For each technical indicator (RSI 14, RSI Slope, MACD Histogram, etc.), add info icon next to the label.

Pattern example for RSI 14:

```typescript
<div>
  <div className="flex items-center gap-2 mb-1">
    <span className="text-sm font-medium">RSI 14</span>
    <InfoIconTooltip
      title={scoredOptionsTooltips.taStockIndicators.rsi14.title}
      content={scoredOptionsTooltips.taStockIndicators.rsi14.content}
      side="top"
    />
  </div>
  {/* Rest of RSI indicator display */}
</div>
```

Apply to all stock-level indicators:
- RSI 14, RSI Slope
- MACD Histogram, MACD Slope
- Bollinger Band Position
- Distance from SMA50
- Volume Ratio
- ADX 14, ADX Slope
- ATR 14
- Stochastic K, Stochastic D

**Step 3: Add info icons to contract-level indicators**

Similarly, add info icons to contract-level indicators:
- Sigma_Distance
- Delta, Vega, Theta

**Step 4: Test TA breakdown tooltips**

Expand a table row and verify tooltips appear for all TA indicators.

**Step 5: Commit TA breakdown tooltips**

```bash
git commit -m "feat: add info icon tooltips to TA Model Breakdown section

- Add InfoIconTooltip to all 17 TA Model indicators
- Stock-level: RSI, MACD, Bollinger Bands, SMA, Volume, ADX, ATR, Stochastic
- Contract-level: Sigma_Distance, Delta, Vega, Theta
- Each tooltip explains indicator meaning and role in machine learning model
- Positioned next to labels in expandable detail view

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Add Tooltips to Agreement Analysis Component

**Files:**
- Modify: `src/components/scored-options/AgreementAnalysis.tsx`

**Step 1: Import tooltip utilities**

At top of AgreementAnalysis.tsx:

```typescript
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import { scoredOptionsTooltips } from '@/utils/scoredOptionsTooltips';
```

**Step 2: Add info icons to agreement fields**

Update the Models Agree and Agreement Strength field labels with info icons:

```typescript
<div>
  <div className="flex items-center gap-2 mb-2">
    <span className="text-sm font-medium">Models Agree</span>
    <InfoIconTooltip
      title={scoredOptionsTooltips.agreement.modelsAgreeField.title}
      content={scoredOptionsTooltips.agreement.modelsAgreeField.content}
      side="top"
    />
  </div>
  {/* Rest of models agree display */}
</div>

<div>
  <div className="flex items-center gap-2 mb-2">
    <span className="text-sm font-medium">Agreement Strength</span>
    <InfoIconTooltip
      title={scoredOptionsTooltips.agreement.agreementStrengthField.title}
      content={scoredOptionsTooltips.agreement.agreementStrengthField.content}
      side="top"
    />
  </div>
  {/* Rest of agreement strength display */}
</div>
```

**Step 3: Test agreement tooltips**

Expand a table row with model agreement and verify tooltips appear.

**Step 4: Commit agreement tooltips**

```bash
git commit -m "feat: add info icon tooltips to Agreement Analysis section

- Add InfoIconTooltip to Models Agree and Agreement Strength fields
- Explain dual-model validation approach and confidence tiers
- Positioned next to field labels in expandable detail view
- Clarifies why two models reduce variance and increase confidence

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Add Validation Metrics Section with Tooltips (Optional Enhancement)

**Files:**
- Modify or Create: `src/pages/ScoredOptions.tsx` (add new section)

**Step 1: Add validation metrics section below summary KPIs**

Below the KPI cards, add a new "Key Validation Metrics" section that displays:
- Walk-Forward AUC 0.651
- Hit Rate 77%
- Calibration Error 2.4%
- Coverage 99.9%

Each metric should have an info icon revealing detailed explanation.

**Step 2: Create metrics cards**

```typescript
<div className="mt-8">
  <div className="flex items-center gap-2 mb-4">
    <h2 className="text-2xl font-bold">Validation Metrics</h2>
    <InfoIconTooltip
      title="Model Validation"
      content="These metrics validate model accuracy and generalization to future periods"
      side="bottom"
    />
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Walk-Forward AUC Card */}
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Walk-Forward AUC</p>
              <InfoIconTooltip
                title={scoredOptionsTooltips.validation.walkForwardAUC.title}
                content={scoredOptionsTooltips.validation.walkForwardAUC.content}
              />
            </div>
            <p className="text-3xl font-bold mt-2">0.651</p>
            <p className="text-xs text-muted-foreground mt-1">
              Proves genuine future prediction ability
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Hit Rate Card */}
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Hit Rate (70-80%)</p>
              <InfoIconTooltip
                title={scoredOptionsTooltips.validation.hitRate77.title}
                content={scoredOptionsTooltips.validation.hitRate77.content}
              />
            </div>
            <p className="text-3xl font-bold mt-2">77%</p>
            <p className="text-xs text-muted-foreground mt-1">
              21+ months historical data
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Calibration Error Card */}
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Calibration Error</p>
              <InfoIconTooltip
                title={scoredOptionsTooltips.validation.calibrationError.title}
                content={scoredOptionsTooltips.validation.calibrationError.content}
              />
            </div>
            <p className="text-3xl font-bold mt-2">2.4%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Predictions match reality
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Coverage Card */}
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Coverage</p>
            <p className="text-3xl font-bold mt-2">99.9%</p>
            <p className="text-xs text-muted-foreground mt-1">
              5,738 of 5,743 options
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
```

**Step 3: Test validation metrics display**

Run dev server, verify metrics section displays below summary KPIs with info icons and tooltips.

**Step 4: Commit validation metrics section**

```bash
git commit -m "feat: add Validation Metrics section with tooltips

- Add new metrics section below KPI cards
- Display Walk-Forward AUC, Hit Rate, Calibration Error, Coverage
- Each metric has info icon revealing detailed explanation
- Showcases rigorous validation methodology to investors
- Emphasizes walk-forward validation as most important metric

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Add Critical Risk Disclaimers (Bottom of Page)

**Files:**
- Modify: `src/pages/ScoredOptions.tsx` (add new section at bottom)

**Step 1: Add disclaimers section at bottom of page**

After the table, add a "Critical Disclaimers" section with info icons:

```typescript
<div className="mt-12 p-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg space-y-4">
  <div className="flex items-start gap-3">
    <span className="text-2xl">⚠️</span>
    <div className="flex-1">
      <h3 className="font-semibold text-amber-900 dark:text-amber-50 mb-3">
        Critical Disclaimers & Risk Factors
      </h3>

      {/* Disclaimer 1: Hit Rate Reality */}
      <div className="mb-4 p-3 bg-white dark:bg-amber-900/30 rounded">
        <div className="flex items-start gap-2 mb-2">
          <span className="font-semibold text-amber-900 dark:text-amber-50">
            77% Hit Rate ≠ No Losses
          </span>
          <InfoIconTooltip
            title={scoredOptionsTooltips.disclaimers.riskHitRate.title}
            content={scoredOptionsTooltips.disclaimers.riskHitRate.content}
            side="left"
          />
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-100">
          23% of options in the 70-80% range will expire in-the-money. Position sizing must account for expected losses.
        </p>
      </div>

      {/* Disclaimer 2: Market Regime Risk */}
      <div className="mb-4 p-3 bg-white dark:bg-amber-900/30 rounded">
        <div className="flex items-start gap-2 mb-2">
          <span className="font-semibold text-amber-900 dark:text-amber-50">
            Market Regime Changes
          </span>
          <InfoIconTooltip
            title={scoredOptionsTooltips.disclaimers.marketRegimeRisk.title}
            content={scoredOptionsTooltips.disclaimers.marketRegimeRisk.content}
            side="left"
          />
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-100">
          Models trained on 21+ months of data. Extreme market shocks (geopolitical, rate changes) may reduce pattern relevance. Monitor monthly performance.
        </p>
      </div>

      {/* Disclaimer 3: No Guarantees */}
      <div className="p-3 bg-white dark:bg-amber-900/30 rounded">
        <div className="flex items-start gap-2 mb-2">
          <span className="font-semibold text-amber-900 dark:text-amber-50">
            No Future Guarantees
          </span>
          <InfoIconTooltip
            title={scoredOptionsTooltips.disclaimers.noGuarantees.title}
            content={scoredOptionsTooltips.disclaimers.noGuarantees.content}
            side="left"
          />
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-100">
          Past walk-forward validation (0.651 AUC) does NOT guarantee future results. Use as screening tool component, not sole decision-maker.
        </p>
      </div>
    </div>
  </div>
</div>
```

**Step 2: Test disclaimers display**

Run dev server, scroll to bottom of page, verify disclaimers section displays with info icons.

**Step 3: Commit disclaimers section**

```bash
git commit -m "feat: add Critical Disclaimers section with warning tooltips

- Add bottom-of-page disclaimers section with warning styling
- Three key warnings: Hit Rate Reality, Market Regime Risk, No Future Guarantees
- Each disclaimer has info icon with detailed explanation
- Emphasizes investor responsibility and realistic expectations
- Uses amber/warning color scheme for visibility

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Summary

This plan adds comprehensive, investor-grade transparency to the Scored Options Recommendations page through strategic, unobtrusive info icons and detailed tooltips.

**Key Benefits:**
- ✅ Maximum depth: Every metric, factor, and assumption explained
- ✅ Clean UI: Info icons are subtle, tooltips only appear on demand
- ✅ Educational: Users gradually learn system methodology by exploring
- ✅ Investor confidence: Rigorous validation and transparency builds trust
- ✅ Risk clarity: Critical disclaimers visible but not intrusive
- ✅ Maintainable: Centralized tooltip library makes future updates easy

**Files Created:** 1
- `src/utils/scoredOptionsTooltips.ts` (unified tooltip content library)
- `src/components/ui/info-icon-tooltip.tsx` (reusable component)

**Files Modified:** 5
- `src/pages/ScoredOptions.tsx` (KPI tooltips + metrics section + disclaimers)
- `src/components/scored-options/ScoredOptionsFilters.tsx` (filter tooltips)
- `src/components/scored-options/ScoredOptionsTable.tsx` (column header tooltips)
- `src/components/scored-options/V21Breakdown.tsx` (V2.1 factor tooltips)
- `src/components/scored-options/TABreakdown.tsx` (TA indicator tooltips)
- `src/components/scored-options/AgreementAnalysis.tsx` (agreement tooltips)

**Total Commits:** 10 (one per task)

---

Plan saved to `docs/plans/2026-01-30-scored-options-transparency.md`

