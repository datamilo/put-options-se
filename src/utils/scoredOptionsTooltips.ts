/**
 * Unified Tooltip Content Library for Scored Options Recommendations Page
 *
 * All content sourced from INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md
 * Provides 9 organized sections of tooltips for maximum transparency
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TooltipItem {
  title: string;
  content: string;
}

interface TooltipSection {
  [key: string]: TooltipItem;
}

// ============================================================================
// HELPER FUNCTION: Format Markdown-like Content
// ============================================================================

/**
 * Converts simple markdown formatting to a formatted string
 * Supports:
 * - **text** for bold (returned as-is, expects UI layer to render)
 * - \n for line breaks
 * - Preserves plain text
 *
 * Note: This function returns the text with formatting markers intact.
 * The consuming component should parse **text** for bold styling.
 */
export function formatTooltipContent(text: string): string {
  // Currently returns text as-is with formatting markers
  // UI components should handle markdown-style **text** parsing
  return text;
}

// ============================================================================
// 1. KPI TOOLTIPS - Dashboard Summary Cards
// ============================================================================

export const kpiTooltips: TooltipSection = {
  totalOptions: {
    title: 'Total Options Available',
    content: 'Complete universe of Swedish equity options analyzed. System covers 5,743+ unique options daily with 99.9% scoring coverage.',
  },
  modelsAgree: {
    title: 'Models in Agreement',
    content:
      'Both models predict >=70% probability of expiration worthless. Represents 12-18% of all options (highest-confidence tier).\n\nExpected hit rate: 75%+\nRecommendation: Actionable opportunities',
  },
  strongAgreement: {
    title: 'Strong Agreement',
    content:
      'Both models predict >=80% probability of expiration worthless. Represents ~12% of all options.\n\nExpected hit rate: 85%+\nRecommendation: Highest priority for premium collection',
  },
  showing: {
    title: 'Showing Results',
    content: 'Number of options displayed in current table (after applying filters). Total may be less than "Total Options Available" if filters are active.',
  },
};

// ============================================================================
// 2. FILTER TOOLTIPS - Filter Section
// ============================================================================

export const filterTooltips: TooltipSection = {
  expiryDate: {
    title: 'Expiration Date Range',
    content: 'Filter options by expiration window. Model is calibrated for 5-35 day expirations where premium-to-accuracy tradeoff is optimal.',
  },
  stocks: {
    title: 'Underlying Stocks',
    content: 'Select specific stocks to analyze. Covers ~80-100 major Swedish equity securities with sufficient liquidity and options depth.',
  },
  modelAgreement: {
    title: 'Model Agreement Filter',
    content:
      'Filter by agreement tier:\n\n**Strong Agreement:** Both >=80% (highest confidence)\n**Moderate Agreement:** Both 70-79% (good confidence)\n**Any Agreement:** Both >=70% (actionable)\n**Disagreement:** Models differ (mixed signals)',
  },
  minCombinedScore: {
    title: 'Minimum Combined Score',
    content:
      'V2.1 Score must be at least this value. Score ranges 0-100.\n\n**Recommended:** 70+ for optimal risk-return profile\n70-80% range: 77% hit rate with 5-10x premiums',
  },
  minV21Score: {
    title: 'Minimum V2.1 Score',
    content: 'Filter by V2.1 Premium Optimization Model score only. Useful for analyzing primary model performance independently.',
  },
  minTAProb: {
    title: 'Minimum TA Probability',
    content: 'Filter by TA Model V2 probability only. TA Model is independent validation using machine learning technical analysis.',
  },
};

// ============================================================================
// 3. COLUMN TOOLTIPS - Table Column Headers
// ============================================================================

export const columnTooltips: TooltipSection = {
  v21Score: {
    title: 'V2.1 Premium Optimization Score',
    content:
      'Weighted composite score (0-100) combining three factors:\n\n• **Current Probability** (60% weight): Market-derived probability of expiration worthless\n• **Historical Peak** (30% weight): Maximum probability achieved during option lifetime\n• **Support Strength** (10% weight): Structural support level robustness\n\n**Formula:** (Current * 0.60) + (Peak * 0.30) + (Support * 0.10)',
  },
  taProbability: {
    title: 'TA Model V2 Probability',
    content:
      'Machine learning prediction (0-100) using calibrated Random Forest with 9 technical indicators. Independent validation model using stock-level technical signals and contract-level features.\n\n**Test AUC:** 0.8447\n**Walk-Forward AUC:** 0.651\n**Brier Score:** 0.1608 (well-calibrated)',
  },
  combined: {
    title: 'Combined Score / Agreement',
    content:
      'Visual indicator of model agreement strength.\n\n**Green (85%+ expected hit rate):** Both models >=80%\n**Yellow (75%+ expected hit rate):** Both models 70-79%\n**Gray:** Disagreement or one model <70%',
  },
  agree: {
    title: 'Models Agree',
    content:
      'Boolean flag indicating whether both V2.1 and TA Model V2 predict >=70% probability.\n\nYes = Both models bullish (15%+ premium opportunities)\nNo = Models diverge (mixed signals, human review needed)',
  },
  strength: {
    title: 'Agreement Strength',
    content:
      'Classification of agreement tier:\n\n**Strong:** Both >=80% (expected 85%+ hit rate)\n**Moderate:** Both 70-79% (expected 75%+ hit rate)\n**Mild:** Both 60-69% (expected 60-70% hit rate)\n**None:** Disagreement (expected 55%+ hit rate)',
  },
};

// ============================================================================
// 4. V2.1 DETAIL TOOLTIPS - Expandable Factor Details
// ============================================================================

export const v21DetailTooltips: TooltipSection = {
  currentProbability: {
    title: 'Current Probability (60% Weight)',
    content:
      'The current market\'s implied assessment of whether the option will expire worthless.\n\n**Calculation Method:** Bayesian isotonic calibration applied to Black-Scholes theoretical probabilities.\n\n**Why 60% Weight:** Strongest individual predictor (AUC 0.7994). Market prices reflect all available information.\n\n**Interpretation:** If 90%, market believes 90% chance of expiration worthless. Direct measure of likely outcome.',
  },
  historicalPeak: {
    title: 'Historical Peak (30% Weight)',
    content:
      'The maximum probability this specific option contract has ever reached during its lifetime.\n\n**Why This Matters:** Options experience mean reversion. Historical peak indicates stock\'s capacity to move away from strike. Higher peak suggests stock has proven ability to stay above strike.\n\n**Why 30% Weight:** Second-strongest predictor (AUC 0.7736). Captures pattern of past behavior and provides directional confidence.\n\n**Interpretation:** Historical strength provides confidence that current market conditions represent achievable outcomes.',
  },
  supportStrength: {
    title: 'Support Strength (10% Weight)',
    content:
      'Robustness metric of the nearest structural support level below the strike price.\n\n**Why This Matters:** Support levels act as natural price floors. Strong support reduces probability of deep in-the-money moves and prevents catastrophic losses.\n\n**Why 10% Weight:** Weakest individual predictor (AUC 0.6169). Provides insurance/safeguard function useful for risk management, not primary signal.\n\n**Interpretation:** Acts as a risk filter. Options trading below weak support are flagged as riskier despite favorable primary signals.',
  },
};

// ============================================================================
// 5. TA STOCK INDICATOR TOOLTIPS - Technical Analysis Features
// ============================================================================

export const taStockIndicatorTooltips: TooltipSection = {
  rsi14: {
    title: 'RSI_14 (Relative Strength Index)',
    content:
      'Current value range: 0-100\n\n• **Below 30:** Oversold (stock has fallen sharply) → favorable for puts\n• **30-70:** Neutral range\n• **Above 70:** Overbought (stock has risen sharply) → less favorable for puts\n\n**What It Does:** Measures how much momentum the stock has. Extreme readings suggest the stock might reverse direction.\n\n**Feature Importance:** 11.09%',
  },
  rsiSlope: {
    title: 'RSI_Slope (3-period RSI Change)',
    content:
      'Current value range: typically -5 to +5\n\n• **Negative (declining):** RSI is falling → momentum weakening → favorable\n• **Positive (rising):** RSI is rising → momentum strengthening → less favorable\n\n**What It Does:** Shows whether momentum is getting stronger or weaker. Helps catch turning points.\n\n**Feature Importance:** 9.15%',
  },
  macdHist: {
    title: 'MACD_Hist (MACD Histogram)',
    content:
      'Current value range: typically -2 to +2\n\n• **Negative (below zero):** Bearish momentum → favorable for puts\n• **Around zero:** Transition point (trend changing)\n• **Positive (above zero):** Bullish momentum → unfavorable for puts\n\n**What It Does:** Shows whether the trend is bullish or bearish. Larger values mean stronger trends.\n\n**Why Bearish Is Favorable (Empirical Finding):** The machine learning model discovered that when stocks show bearish momentum (negative MACD), they tend to expire worthless more often. This reflects mean reversion—stocks that get beaten down often bounce back above the strike. This seems counterintuitive but is an empirical pattern the model found in Swedish options data.\n\n**Feature Importance:** 14.02% (2nd most important)',
  },
  macdSlope: {
    title: 'MACD_Slope (3-period MACD Change)',
    content:
      'Current value range: typically -1 to +1\n\n• **Negative (declining):** Momentum is weakening → unfavorable\n• **Positive (rising):** Momentum is strengthening → favorable\n\n**What It Does:** Shows whether momentum is accelerating or decelerating. Stronger momentum trends tend to persist, which is beneficial for put expiration.\n\n**Why This Matters:** The machine learning model found that strengthening momentum (positive slope) correlates with higher probability of expiration worthless. This reflects that established trends have persistence.\n\n**Feature Importance:** 11.12% (4th most important)',
  },
  bbPosition: {
    title: 'BB_Position (Bollinger Band Position)',
    content:
      'Current value range: 0 to 1\n\n• **Near 0 (lower band):** Stock at lower extreme, near support → favorable\n• **0.5 (middle):** Stock at middle of normal range\n• **Near 1 (upper band):** Stock at upper extreme, near resistance → less favorable\n\n**What It Does:** Shows where the stock price sits between its normal high and low ranges. Extremes often reverse.\n\n**Feature Importance:** 9.59%',
  },
  distSMA50: {
    title: 'Dist_SMA50 (Distance to 50-day Moving Average)',
    content:
      'Current value range: typically -10 to +10 (percentage)\n\n• **Negative (below MA):** Stock trading below trend line → favorable\n• **Around zero:** Stock near its trend line\n• **Positive (above MA):** Stock trading above trend line → less favorable\n\n**What It Does:** Shows how far the stock has moved away from its 50-day trend. Stocks far from trend often move back toward it.\n\n**Feature Importance:** 13.79% (3rd most important)',
  },
  volRatio: {
    title: 'Vol_Ratio (Recent vs. Historical Volatility)',
    content:
      'Current value range: 0.5 to 2.0\n\n• **Below 1.0:** Trading volume lower than usual → weaker activity\n• **Around 1.0:** Normal trading volume\n• **Above 1.0:** Trading volume higher than usual → stronger interest\n\n**What It Does:** Compares today\'s volume to the average. High volume often confirms trend strength.\n\n**Feature Importance:** 9.67%',
  },
  adx14: {
    title: 'ADX_14 (Average Directional Index - Trend Strength)',
    content:
      'Current value range: 0-100 (typically 10-50 in practice)\n\n• **Below 20:** Weak or no trend → mixed signals\n• **20-40:** Moderate to strong trend → clear direction\n• **Above 40:** Very strong trend → pronounced momentum\n\n**What It Does:** Measures how strong the current trend is, regardless of direction. Higher = clearer trend.',
  },
  adxSlope: {
    title: 'ADX_Slope (3-period ADX Change)',
    content:
      'Current value range: typically -2 to +2\n\n• **Negative (declining):** Trend strength weakening → less clear direction\n• **Positive (rising):** Trend strength increasing → clearer direction\n\n**What It Does:** Shows whether trends are getting stronger or falling apart. Helps predict when trends will reverse.',
  },
  atr14: {
    title: 'ATR_14 (Average True Range - Volatility)',
    content:
      'Current value range: depends on stock price (e.g., 0.5-5 kr for a 100 kr stock)\n\n• **Low values:** Stock is stable, small daily moves\n• **High values:** Stock is volatile, large daily moves\n\n**What It Does:** Measures typical daily price swings. More volatile stocks are riskier but offer more trading opportunities.',
  },
  stochasticK: {
    title: 'Stochastic_K (%K)',
    content:
      'Current value range: 0-100\n\n• **Below 20:** Oversold (stock at recent lows) → favorable\n• **20-80:** Normal range\n• **Above 80:** Overbought (stock at recent highs) → less favorable\n\n**What It Does:** Shows where the current price falls within the stock\'s recent high-low range. Similar to RSI but uses range instead of strength.',
  },
  stochasticD: {
    title: 'Stochastic_D (Signal Line)',
    content:
      'Current value range: 0-100\n\n• **Below 20:** Oversold → favorable\n• **20-80:** Normal range\n• **Above 80:** Overbought → less favorable\n\n**What It Does:** Smoothed version of %K (like an average). More stable and better for confirming signals.',
  },
};

// ============================================================================
// 6. TA CONTRACT INDICATOR TOOLTIPS - Option-Specific Features
// ============================================================================

export const taContractIndicatorTooltips: TooltipSection = {
  sigmaDistance: {
    title: 'Sigma_Distance (Most Important - 16.13%)',
    content:
      '**What It Measures:** Distance from current stock price to strike price, adjusted for volatility and time remaining before expiration.\n\n**Why This Matters:** Two options at the same 2% distance have very different probabilities:\n\n• **Volatile stock** (moves 3-4% daily): 2% distance is very close and easy to reach\n• **Stable stock** (moves 0.3% daily): 2% distance requires several days\n\nSame problem with time: 2% distance on 5-day option != 2% distance on 30-day option.\n\n**How It Works:** Answers "How many typical daily moves away is the strike?" High = many moves away (safer). Low = close to typical moves (riskier).\n\n**The Impact:** Enables accurate comparison across different volatility levels and expiration periods.',
  },
  delta: {
    title: 'Delta (Option Price Sensitivity)',
    content:
      'Current value range: -1 to 0 for put options\n\n• **Near 0:** Option far out-of-the-money (very likely worthless) → favorable\n• **Around -0.5:** Option at-the-money (50/50 chance)\n• **Near -1:** Option deep in-the-money (likely has value) → less favorable\n\n**What It Does:** Shows how much the option price moves when the stock price moves 1 kr. More negative = higher probability of being worthless.',
  },
  vega: {
    title: 'Vega (Volatility Sensitivity)',
    content:
      'Current value range: typically 0.01 to 0.2\n\n• **Low values:** Option barely affected by volatility changes\n• **High values:** Option strongly affected by volatility changes\n\n**What It Does:** Shows how much the option price changes when market volatility changes. Higher vega = more price swings possible.',
  },
  theta: {
    title: 'Theta (Time Decay)',
    content:
      'Current value range: typically -0.1 to +0.1\n\n• **Positive values:** Option loses value each day (premium seller benefits) → favorable\n• **Negative values:** Option gains value each day (premium seller loses) → less favorable\n\n**What It Does:** Shows how much the option loses (or gains) value each day just from time passing. Time decay is the premium seller\'s friend.',
  },
};

// ============================================================================
// 7. AGREEMENT TOOLTIPS - Dual-Model Agreement Analysis
// ============================================================================

export const agreementTooltips: TooltipSection = {
  modelsAgreeField: {
    title: 'Models Agree (Boolean Field)',
    content:
      'Both V2.1 >=70% AND TA Model V2 >=70% = True\nOtherwise = False\n\n**Business Value:** Represents 12-18% of all options (highest-confidence tier). These represent the strongest trading opportunities.\n\n**Expected Hit Rate:** 75%+\n\n**Statistical Principle:** Combining independent predictors reduces variance and improves robustness.',
  },
  agreementStrengthField: {
    title: 'Agreement Strength Classification',
    content:
      'Categorizes agreement tier:\n\n**Strong Agreement** (~12%): Both >=80%, Expected hit 85%+ -> HIGH PRIORITY\n**Moderate Agreement** (~6%): Both 70-79%, Expected hit 75%+ -> GOOD\n**Total Agreement** (~18%): Combined 12-18% -> ACTIONABLE\n**Disagreement** (~70%): Models diverge -> INVESTIGATE\n**Both Conservative** (~12%): Both <60% -> SKIP',
  },
};

// ============================================================================
// 8. VALIDATION TOOLTIPS - Performance Metrics
// ============================================================================

export const validationTooltips: TooltipSection = {
  hitRate77: {
    title: 'Hit Rate: 77% in 70-80% Range',
    content:
      'Empirically observed outcome: Approximately 77% of options in the 70-80% score range expire worthless (out-of-the-money).\n\n**21-Month Consistency:** Stable 76-78% across April 2024 - January 2026\n\n**Interpretation:** 77% success rate means 23% failure rate. Premium gains offset by occasional losses.\n\n**Risk Management:** Position sizing must account for 23% failure rate. Average loss when wrong = strike distance.\n\n**Premium Level:** 5-10x higher than conservative 80%+ range (which has 90%+ hit rate but minimal premiums)',
  },
  walkForwardAUC: {
    title: 'Walk-Forward AUC: 0.651',
    content:
      'Primary validation metric proving genuine predictive ability on **future unseen data**.\n\n**Methodology:** Train on 6-month periods, test on subsequent month, retrain including new data (repeat through Jan 2026)\n\n**Interpretation:** Model correctly orders option pairs 65.1% of the time on future data.\n\n**Why This Matters:** Walk-Forward is TRUE validation (Test AUC can be misleading). Models with Test AUC 0.96 but Walk-Forward 0.52 are worse than useless—they fit past but can\'t predict future.\n\n**Our Performance:** 0.651 represents genuine predictive ability, not overfitting artifact',
  },
  calibrationError: {
    title: 'Calibration Error: 2.4% (ECE)',
    content:
      'Expected Calibration Error measures how closely predicted probabilities match empirical outcomes.\n\n**Interpretation:** If model predicts 75%, actual outcome is 77% (within 2.4% error).\n\n**Methodology:** Split predictions into 10% bins (0-10%, 10-20%, etc.), compare predicted vs. actual frequencies.\n\n**What It Means:** Predicted probabilities are highly accurate. When model predicts 75% expiration worthless, approximately 75% actually expire worthless.\n\n**Quality Bar:** 2.4% error is excellent (0.0 = perfect, 0.25 = random guessing)',
  },
};

// ============================================================================
// 9. DISCLAIMER TOOLTIPS - Risk Factors & Limitations
// ============================================================================

export const disclaimerTooltips: TooltipSection = {
  riskHitRate: {
    title: 'Hit Rate of 77% Means 23% Failure',
    content:
      'In the 70-80% range, approximately 1 in 4 options will expire in-the-money (against the prediction).\n\n**Financial Impact:** 23% of positions will experience losses = strike distance - premium collected.\n\n**Risk Management Requirement:** Portfolio-level risk controls, position sizing accounting for failure rate, stop-loss implementation.\n\n**Position Sizing Example:** If writing 10 put options in 70-80% range, expect ~7-8 to be profitable and ~2-3 to have losses.\n\n**No Guarantee:** Past performance does not guarantee future results.',
  },
  marketRegimeRisk: {
    title: 'Market Regime Changes Risk',
    content:
      'Walk-forward validation tests model on future periods. However, if market fundamentally changes:\n\n• Extreme interest rate shifts\n• Financial crises or major shocks\n• Pandemic or geopolitical disruptions\n• Sector rotation or regime changes\n\nThen learned patterns may become less relevant. Monthly recalibration helps but may lag significant regime shifts.\n\n**Training Data:** 21+ months (April 2024 - Jan 2026) covers mostly normal conditions. Limited severe bear market or crisis data.\n\n**Monitoring Requirement:** Daily health checks catch issues, but continuous monitoring essential.',
  },
  noGuarantees: {
    title: 'No Guarantees of Future Performance',
    content:
      'Most critical limitation:\n\n**What We Know:** Models achieved 77% hit rate in 70-80% range on 934K+ expired options from April 2024-Jan 2026.\n\n**What We Don\'t Know:** Whether this performance will persist going forward. Market conditions evolve, investors\' behavior changes, regulatory environment shifts.\n\n**Historical Disclaimer:** Past performance does not guarantee future results.\n\n**Appropriate Use:** Use as screening tool and confidence ranking mechanism (not sole decision-maker). Combine with other analysis, implement portfolio-level risk controls, monitor monthly performance.\n\n**Investor Responsibility:** Understand model limitations, implement risk management, accept that real-world trading involves uncertainty.',
  },
};

// ============================================================================
// DEFAULT EXPORT: Combined Tooltip Object
// ============================================================================

const scoredOptionsTooltips = {
  kpi: kpiTooltips,
  filters: filterTooltips,
  columns: columnTooltips,
  v21Details: v21DetailTooltips,
  taStockIndicators: taStockIndicatorTooltips,
  taContractIndicators: taContractIndicatorTooltips,
  agreement: agreementTooltips,
  validation: validationTooltips,
  disclaimers: disclaimerTooltips,
};

export default scoredOptionsTooltips;
