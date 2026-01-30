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
      'Overbought/oversold momentum indicator (0-100 scale).\n\n**What It Does:** Captures momentum extremes. Values above 70 suggest overbought, below 30 suggest oversold.\n\n**Why It\'s Used:** Momentum extremes often precede reversions to mean, affecting option expiration probabilities.\n\n**Feature Importance:** 11.09% (5th most important among 9 features)',
  },
  rsiSlope: {
    title: 'RSI_Slope (3-period RSI Change)',
    content:
      'Momentum direction and acceleration measured as 3-period RSI change.\n\n**What It Does:** Detects inflection points where momentum shifts direction. Positive slope = accelerating momentum up, negative slope = decelerating or reversing.\n\n**Business Insight:** Rate of momentum change predicts short-term reversals relevant to option expiration.\n\n**Feature Importance:** 9.15% (8th most important)',
  },
  macdHist: {
    title: 'MACD_Hist (MACD Histogram)',
    content:
      'Trend momentum measured as distance between MACD line and signal line.\n\n**What It Does:** Captures trend momentum and strength. Positive histogram = uptrend, negative = downtrend.\n\n**Why It Matters:** Distance between fast and slow moving averages predicts trend persistence, affecting expiration probabilities.\n\n**Feature Importance:** 14.02% (2nd most important - very strong predictor)',
  },
  macdSlope: {
    title: 'MACD_Slope (3-period MACD Change)',
    content:
      'Trend acceleration/deceleration measured as 3-period MACD change.\n\n**What It Does:** Detects whether trend is accelerating or weakening. Positive = strengthening trend, negative = weakening.\n\n**Business Insight:** Inflection points where trends reverse significantly impact option outcomes.\n\n**Feature Importance:** 11.12% (4th most important)',
  },
  bbPosition: {
    title: 'BB_Position (Bollinger Band Position)',
    content:
      'Location within Bollinger Bands normalized to 0-1 range.\n\n**What It Does:** Identifies price extremes and mean reversion signals. 1.0 = at upper band (overbought), 0.0 = at lower band (oversold), 0.5 = middle.\n\n**Why It Matters:** Extreme positions often revert to mean, affecting probability of staying above strike.\n\n**Feature Importance:** 9.59% (7th most important)',
  },
  distSMA50: {
    title: 'Dist_SMA50 (Distance to 50-day Moving Average)',
    content:
      'Normalized distance from 50-day trend line.\n\n**What It Does:** Captures deviation from trend. Large distances suggest potential mean reversion back to trend.\n\n**Business Insight:** Stocks far from trend line often mean-revert, affecting expiration probabilities.\n\n**Feature Importance:** 13.79% (3rd most important - very strong predictor)',
  },
  volRatio: {
    title: 'Vol_Ratio (Recent vs. Historical Volatility)',
    content:
      'Recent volatility divided by historical average volatility.\n\n**What It Does:** Detects volatility regime changes. >1.0 = elevated volatility, <1.0 = suppressed volatility.\n\n**Why It Matters:** Volatility changes affect option pricing and probability distributions. Regime shifts impact prediction accuracy.\n\n**Feature Importance:** 9.67% (6th most important)',
  },
  adx14: {
    title: 'ADX_14 (Average Directional Index)',
    content:
      'Trend strength indicator (0-100 scale, though typically 0-60 in practice).\n\n**What It Does:** Measures trend strength independent of direction. High ADX = strong trend (up or down), low ADX = ranging/weak trend.\n\n**Business Insight:** Strong trends persist, affecting whether stocks stay above strike through expiration.',
  },
  adxSlope: {
    title: 'ADX_Slope (3-period ADX Change)',
    content:
      'Trend strength acceleration/deceleration measured as 3-period ADX change.\n\n**What It Does:** Detects whether trends are strengthening or weakening. Positive = trend strengthening, negative = trend weakening.\n\n**Business Insight:** Emerging or dissolving trends affect option expiration probabilities.',
  },
  atr14: {
    title: 'ATR_14 (Average True Range)',
    content:
      'Average volatility (absolute price movement) over 14 periods.\n\n**What It Does:** Measures typical price movement magnitude. Higher ATR = larger typical moves, lower ATR = smaller typical moves.\n\n**Business Insight:** Highly volatile stocks have different expiration dynamics than stable stocks.',
  },
  stochasticK: {
    title: 'Stochastic_K (Stochastic %K)',
    content:
      'Momentum oscillator (0-100 scale) measuring current price position within recent range.\n\n**What It Does:** Similar to RSI but uses range position. >80 = overbought, <20 = oversold.\n\n**Business Insight:** Captures short-term momentum extremes predicting mean reversion to strike.',
  },
  stochasticD: {
    title: 'Stochastic_D (Stochastic %D / Signal Line)',
    content:
      'Smoothed version of Stochastic %K (3-period moving average).\n\n**What It Does:** Signal line for confirming %K signals. More stable than %K. Crossovers signal momentum shifts.\n\n**Business Insight:** Smoother momentum confirmation reduces false signals affecting option predictions.',
  },
};

// ============================================================================
// 6. TA CONTRACT INDICATOR TOOLTIPS - Option-Specific Features
// ============================================================================

export const taContractIndicatorTooltips: TooltipSection = {
  sigmaDistance: {
    title: 'Sigma_Distance (Most Important - 16.13%)',
    content:
      'Strike distance normalized by both volatility and time: (Strike - Current_Price) / (Annual_HV * sqrt(DTE/365))\n\n**What It Does:** Controls for mixed volatility regimes and expiration periods. A 2% OTM strike on volatile tech stock != 2% OTM on utility stock. Same distance on 5-day expiry != 30-day expiry.\n\n**Why This Innovation Matters:** Enables strike-level and expiration-level differentiation. Without it, probabilities compress to narrow range. With it, full spectrum (0.044 to 0.992).\n\n**Feature Importance:** 16.13% (single most important feature)',
  },
  delta: {
    title: 'Delta (Option Sensitivity to Stock Moves)',
    content:
      'Rate of change in option price per 1 SEK move in underlying stock.\n\n**Interpretation:** Delta 0.30 = option price changes 0.30 SEK for each 1 SEK stock move.\n\nFor put options expiring worthless: Higher delta (more negative) = further OTM = more likely worthless.',
  },
  vega: {
    title: 'Vega (Option Sensitivity to Volatility)',
    content:
      'Rate of change in option price per 1% change in implied volatility.\n\n**Business Insight:** High volatility increases option premiums but also increases uncertainty about expiration.\n\nVega sensitivity matters for predicting probability changes as volatility regimes shift.',
  },
  theta: {
    title: 'Theta (Time Decay)',
    content:
      'Rate of daily time decay in option price (how much value is lost per day).\n\n**Business Insight:** Premium seller\'s friend - time decay works in favor of options expiring worthless.\n\nHigher theta = faster premium decay = beneficial for premium collection strategy.\n\nMarket already prices in time decay (reflected in Current Probability), so days-to-expiry alone has no predictive power.',
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
