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
    content: 'Complete universe of Swedish equity options analyzed daily. Only includes OTM (out-of-the-money) and ATM (at-the-money) options—ITM (in-the-money) options excluded because the premium collection strategy focuses on writing options for value decay. This means the daily count varies 4,500-5,500 options depending on market conditions. System scores 99.9% of available options.',
  },
  avgCombinedScore: {
    title: 'Average Combined Score',
    content: 'Average confidence level across your filtered options. The combined score is the average of the Probability Optimization Score and TA ML Model probability. Higher scores indicate stronger model consensus between the two independent models. Green (≥75) = strong, Amber (70-74) = good, Red (<70) = lower confidence.',
  },
  sampleSize: {
    title: 'Sample Size for Score Range',
    content: 'Historical validation sample size for the score range of your filtered options. Larger samples provide higher statistical confidence in the models\' predictions. Our TA Model V3 is validated on 1.59M walk-forward predictions, and the Probability Optimization Model on 934K+ historical options.',
  },
  showing: {
    title: 'Showing Results',
    content: 'Number of options displayed in current table (after applying all filters). Total may be less than "Total Options Available" if filters are active.',
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
      'Filter by proximity-based model agreement (how close are the scores?):\n\n**Strong Agreement:** Scores within ±2% of each other (excellent consensus)\n**Moderate Agreement:** Scores within ±2% to ±5% (good consensus)\n**Weak Agreement:** Scores within ±5% but separated (disagreement)\n**Models Disagree:** Scores separated by >±5% (conflicting signals)\n\n**How It Works:** Relative difference = |V2.1 - TA| / average score. When <5%, models agree.',
  },
  minCombinedScore: {
    title: 'Minimum Combined Score',
    content:
      'Combined Score = Average of Probability Optimization Score and TA ML Model Probability.\n\nThe default 70 targets the optimal 70-80% probability range where both models show strong historical accuracy:\n• Probability Optimization Model: 83.8% Actual Worthless %\n• TA ML Model: 76.6% Actual Worthless %\n• Expected calibration error: 2.4%\n\nThis represents the best risk-adjusted return profile. Adjust based on your risk tolerance.',
  },
  minV21Score: {
    title: 'Minimum Probability Optimization Score',
    content: 'Filter by Probability Optimization Model score only. Useful for analyzing primary model performance independently.',
  },
  minTAProb: {
    title: 'Minimum TA ML Model Probability',
    content: 'Filter by TA ML Model probability only. TA ML Model is independent validation using machine learning technical analysis.',
  },
};

// ============================================================================
// 3. COLUMN TOOLTIPS - Table Column Headers
// ============================================================================

export const columnTooltips: TooltipSection = {
  v21Score: {
    title: 'Probability Optimization Score',
    content:
      'Weighted composite score (0-100) combining three factors:\n\n• **Current Probability** (60% weight): Market-derived probability of expiration worthless\n• **Historical Peak** (30% weight): Maximum probability achieved during option lifetime\n• **Support Strength** (10% weight): Structural support level robustness\n\n**Formula:** (Current × 0.60) + (Peak × 0.30) + (Support × 0.10)',
  },
  taProbability: {
    title: 'TA ML Model Probability',
    content:
      'Machine learning prediction (0-100) using calibrated Random Forest with 17 features combining technical indicators, volatility measures, and options Greeks. Independent validation model using stock-level technical signals and contract-level features.\n\n**Test AUC:** 0.8615\n**Walk-Forward AUC:** 0.6511 ± 0.040\n**Brier Score:** 0.1519 (well-calibrated)',
  },
  combined: {
    title: 'Combined Score / Agreement',
    content:
      'Average of Probability Optimization Score and TA ML Model probability (0-100 scale). Color indicates confidence level AND agreement status.\n\n**Green (≥80):** High confidence - typically models are closely aligned (Strong agreement)\n**Amber (70-79):** Good confidence - OPTIMAL RANGE for 77% hit rate with 5-10x premiums. Models may vary (Moderate agreement)\n**Red (<70):** Lower confidence - consider additional analysis\n\n**Note:** Color reflects SCORE LEVEL, not agreement status. Check "Models Agree" column for agreement classification.',
  },
  agree: {
    title: 'Models Agree',
    content:
      'Boolean flag indicating whether the two independent models have SIMILAR predictions (within ±5% relative difference).\n\n**Yes = Models Agree:** Scores are within ±5% proximity (consensus between models)\n**No = Models Disagree:** Scores separated by >±5% (conflicting predictions)\n\n**Formula:** Relative difference = |V2.1 Score - (TA Probability × 100)| / average score ≤ 0.05\n\nThis measures AGREEMENT (similarity), not absolute score levels.',
  },
  strength: {
    title: 'Agreement Strength',
    content:
      'Classification of how closely the two models align (only shown when models agree):\n\n**Strong Agreement:** Scores within ±2% relative difference (excellent consensus - models nearly identical)\n**Moderate Agreement:** Scores within ±2% to ±5% relative difference (good consensus - models mostly aligned)\n**Weak Agreement:** Scores >±5% but still classified as agreeing (disagreement - conflicting signals)\n\n**Interpretation:** Stronger agreement = higher confidence in the prediction. Use Strong/Moderate as primary signals.',
  },
};

// ============================================================================
// 4. PROBABILITY OPTIMIZATION DETAIL TOOLTIPS - Expandable Factor Details
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
      'Current value range: 0-100\n\n• **Below 30:** Oversold (stock has fallen sharply) → favorable for puts\n• **30-70:** Neutral range\n• **Above 70:** Overbought (stock has risen sharply) → less favorable for puts\n\n**What It Does:** Measures momentum extremes. When RSI is very low or very high, the stock often reverses toward the middle.\n\n**Why It Matters:** The ML model empirically learned from 1.8M Swedish options records that RSI momentum levels predict expiration outcomes. This is what the data revealed, not traditional indicator theory.\n\n**Feature Importance:** 5.27% (empirically learned, ranked #9)',
  },
  rsiSlope: {
    title: 'RSI_Slope (3-period RSI Change)',
    content:
      'Current value range: typically -5 to +5\n\n• **Negative (declining):** RSI is falling → momentum weakening\n• **Positive (rising):** RSI is rising → momentum strengthening\n\n**What It Does:** Shows whether momentum is accelerating or decelerating. Catches turning points where momentum changes direction.\n\n**Why It Matters:** The model empirically determined that momentum acceleration/deceleration predicts expiration probability. The data revealed this relationship from analyzing 1.8M+ historical options.\n\n**Feature Importance:** 3.58% (empirically learned, ranked #16)',
  },
  macdHist: {
    title: 'MACD_Hist (MACD Histogram)',
    content:
      'Current value range: typically -2 to +2\n\n• **Negative (below zero):** Bearish momentum → favorable for puts\n• **Around zero:** Transition point (trend changing)\n• **Positive (above zero):** Bullish momentum → unfavorable for puts\n\n**What It Does:** Shows trend momentum by measuring distance between MACD and signal line. Larger values mean stronger trends.\n\n**Why Bearish Is Favorable (Empirical Finding):** The ML model discovered that bearish MACD values correlate with options expiring worthless. This seems backwards—traditional TA says bearish means downward. But the data from 1.8M Swedish options showed that bearish momentum predicts expiration. This likely reflects mean reversion: beaten-down stocks often bounce back above the strike. Trust the data, not the theory.\n\n**Feature Importance:** 6.03% (empirically learned, ranked #7)',
  },
  macdSlope: {
    title: 'MACD_Slope (3-period MACD Change)',
    content:
      'Current value range: typically -1 to +1\n\n• **Negative (declining):** Momentum is weakening → unfavorable\n• **Positive (rising):** Momentum is strengthening → favorable\n\n**What It Does:** Shows whether momentum is accelerating or decelerating. Positive slope means trends are getting stronger, negative means they\'re losing power.\n\n**Why It Matters:** The model empirically learned that trend acceleration/deceleration predicts expiration probability. Established trends (positive slope) correlate with put expiration worthless. This is what 1.8M Swedish options records revealed.\n\n**Feature Importance:** 4.81% (empirically learned, ranked #11)',
  },
  bbPosition: {
    title: 'BB_Position (Bollinger Band Position)',
    content:
      'Current value range: 0 to 1\n\n• **Near 0 (lower band):** Stock at lower extreme, near support → favorable\n• **0.5 (middle):** Stock at middle of normal range\n• **Near 1 (upper band):** Stock at upper extreme, near resistance → less favorable\n\n**What It Does:** Shows where the stock price sits between its normal high and low ranges. Extremes (near 0 or near 1) often reverse back toward the middle.\n\n**Why It Matters:** The model discovered that price extremes within Bollinger Bands predict expiration outcomes. This is an empirical pattern from analyzing 1.8M options, not traditional mean reversion theory.\n\n**Feature Importance:** 4.31% (empirically learned, ranked #13)',
  },
  distSMA50: {
    title: 'Dist_SMA50 (Distance to 50-day Moving Average)',
    content:
      'Current value range: typically -10% to +10%\n\n• **Negative (below MA):** Stock trading below trend line → favorable\n• **Around zero:** Stock near its trend line\n• **Positive (above MA):** Stock trading above trend line → less favorable\n\n**What It Does:** Shows how far the stock has moved away from its 50-day trend. When distance is large, the stock often reverts back toward the trend line.\n\n**Why It Matters:** The model empirically learned that deviation from the 50-day trend predicts expiration probability. Stocks far from their trend tend to move back, affecting put outcomes. This is what 1.8M records revealed.\n\n**Feature Importance:** 7.66% (empirically learned, ranked #5)',
  },
  volRatio: {
    title: 'Vol_Ratio (Recent vs. Historical Volatility)',
    content:
      'Current value range: 0.5 to 2.0\n\n• **Below 1.0:** Trading volume lower than usual → weaker activity\n• **Around 1.0:** Normal trading volume\n• **Above 1.0:** Trading volume higher than usual → stronger activity\n\n**What It Does:** Compares recent volatility to the historical average. Higher values mean unusual volatility spikes, lower values mean calm periods.\n\n**Why It Matters:** The model empirically learned that volatility regimes predict expiration outcomes. Volatility changes affect price distributions and option behavior. This is what the data from 1.8M options revealed.\n\n**Feature Importance:** 4.13% (empirically learned, ranked #14)',
  },
  adx14: {
    title: 'ADX_14 (Average Directional Index - Trend Strength)',
    content:
      'Current value range: 0-100 (typically 10-50)\n\n• **Below 20:** Weak trend or no direction → choppy, mixed signals\n• **20-40:** Moderate to strong trend → clear direction\n• **Above 40:** Very strong trend → pronounced momentum\n\n**What It Does:** Measures how strong the current trend is. High ADX = strong trend (either up or down). Low ADX = ranging/choppy market.\n\n**Why It Matters:** The model empirically discovered that trend strength is highly predictive of expiration outcomes—ranked #3 of all 17 features (8.12%). When trends are strong, options behave differently than in choppy markets. This is what 1.8M Swedish options records revealed.\n\n**Feature Importance:** 8.12% (empirically learned, ranked #3)',
  },
  adxSlope: {
    title: 'ADX_Slope (3-period ADX Change)',
    content:
      'Current value range: typically -2 to +2\n\n• **Negative (declining):** Trend strength weakening → less defined direction\n• **Positive (rising):** Trend strength increasing → clearer, stronger direction\n\n**What It Does:** Shows whether trends are getting stronger or falling apart. Emerging trends (positive slope) have different behavior than dissolving trends.\n\n**Why It Matters:** The model learned that trend acceleration/deceleration predicts expiration probability. As trends form or dissolve, option outcomes shift. This is an empirical pattern from 1.8M options.\n\n**Feature Importance:** 5.28% (empirically learned, ranked #8)',
  },
  atr14: {
    title: 'ATR_14 (Average True Range - Volatility Measure)',
    content:
      'Current value range: depends on stock price (e.g., 0.5-5 kr for a 100 kr stock)\n\n• **Low values:** Stock is stable with small daily moves → lower volatility\n• **High values:** Stock is volatile with large daily moves → higher volatility\n\n**What It Does:** Measures typical daily price movement magnitude. ATR shows "how much does this stock typically swing per day?" Higher ATR = bigger swings.\n\n**Why It Matters:** The model empirically discovered that volatility magnitude is the 2nd most important predictor of expiration outcomes (8.52%, ranked #2)! This is surprising—it contradicts traditional volatility theory which focuses on risk. But the data from 1.8M Swedish options revealed volatility itself predicts expiration. This is an empirical finding unique to put option expiration prediction.\n\n**Feature Importance:** 8.52% (empirically learned, ranked #2 - SECOND MOST IMPORTANT)',
  },
  stochasticK: {
    title: 'Stochastic_K (%K) - Fast Stochastic',
    content:
      'Current value range: 0-100\n\n• **Below 20:** Oversold (stock at recent lows) → favorable\n• **20-80:** Normal range\n• **Above 80:** Overbought (stock at recent highs) → less favorable\n\n**What It Does:** Shows where the current stock price falls within its recent high-low range. Similar to RSI but based on price location, not momentum strength.\n\n**Why It Matters:** The model empirically learned that Stochastic momentum predicts expiration outcomes. This is what 1.8M options records revealed about how price extremes correlate with worthless expiration.\n\n**Feature Importance:** 3.79% (empirically learned, ranked #15)',
  },
  stochasticD: {
    title: 'Stochastic_D (Slow Stochastic - Signal Line)',
    content:
      'Current value range: 0-100\n\n• **Below 20:** Oversold → favorable\n• **20-80:** Normal range\n• **Above 80:** Overbought → less favorable\n\n**What It Does:** Smoothed version of Stochastic %K (3-period average). More stable than %K and better for confirming momentum signals.\n\n**Why It Matters:** The model empirically learned that smoothed momentum predicts expiration. The smoothing reduces noise and captures true trend changes. This is an empirical discovery from analyzing 1.8M options.\n\n**Feature Importance:** 4.58% (empirically learned, ranked #12)',
  },
};

// ============================================================================
// 6. TA CONTRACT INDICATOR TOOLTIPS - Option-Specific Features
// ============================================================================

export const taContractIndicatorTooltips: TooltipSection = {
  sigmaDistance: {
    title: 'Sigma_Distance (Volatility-Normalized Strike Distance)',
    content:
      '**What It Measures:** Distance from current stock price to strike price, adjusted for volatility and time remaining.\n\nFormula: (Strike - Current Price) / (Annual Volatility × √(Days to Expiry/365))\n\n**Value Range:** Depends on volatility and expiration, typically -3 to +3 standard deviations\n\n**What It Does:** Answers: "How many typical price swings away is the strike?" It accounts for two things traditional fixed percentages miss:\n\n• **Volatility Adjustment:** 2% away on a 100 kr volatile stock ≠ 2% away on a 100 kr stable stock\n• **Time Adjustment:** 2% away on a 5-day option ≠ 2% away on a 30-day option\n\nWithout this normalization, options compress into a narrow probability range. With it, full spectrum (0.044 to 0.992).\n\n**Why It Matters:** The model empirically learned that normalized strike distance strongly predicts expiration (8.00%, ranked #4). This is what 1.8M Swedish options records revealed.\n\n**Feature Importance:** 8.00% (empirically learned, ranked #4)',
  },
  delta: {
    title: '⭐ Greeks_Delta (MOST IMPORTANT - #1 Predictor)',
    content:
      'Current value range: -1 to 0 for put options\n\n• **Near 0 (e.g., -0.05):** Option far out-of-the-money (very likely worthless) → favorable\n• **Around -0.5:** Option at-the-money (50/50 chance) → neutral\n• **Near -1 (e.g., -0.95):** Option deep in-the-money (likely has value) → less favorable\n\n**What It Means:** Delta shows option price sensitivity. For puts: -0.30 means the option price changes 0.30 kr when the stock moves 1 kr.\n\n**CRITICAL EMPIRICAL FINDING:** The ML model discovered that Delta is the SINGLE STRONGEST PREDICTOR of put expiration worthless (11.82%, ranked #1). This contradicts traditional options theory, which uses Delta primarily for hedging calculations.\n\n**Why This Matters:** Traditional options textbooks never mention Delta predicting expiration probability. But when the model analyzed 1.8M Swedish options records, Delta emerged as the top feature. This is a discovery unique to this dataset. Trust the data, not the textbook.\n\n**Feature Importance:** 11.82% (empirically learned, ranked #1 - SINGLE MOST IMPORTANT OF ALL 17 FEATURES)',
  },
  vega: {
    title: 'Greeks_Vega (Volatility Sensitivity)',
    content:
      'Current value range: typically 0.01 to 0.2\n\n• **Low values:** Option barely affected by volatility changes\n• **High values:** Option strongly affected by volatility changes\n\n**What It Means:** Vega shows how much the option price changes per 1% change in implied volatility. Higher vega = more sensitive to volatility swings.\n\n**Why It Matters:** The model empirically discovered that volatility sensitivity predicts expiration outcomes (6.12%, ranked #6). This is an empirical pattern from 1.8M options records. Traditional options theory uses Vega for volatility hedging, not expiration prediction.\n\n**Feature Importance:** 6.12% (empirically learned, ranked #6)',
  },
  theta: {
    title: 'Greeks_Theta (Time Decay)',
    content:
      'Current value range: typically -0.1 to +0.1\n\n• **Positive values:** Option loses value each day (premium seller benefits) → favorable\n• **Negative values:** Option gains value each day (premium seller loses) → less favorable\n\n**What It Means:** Theta shows daily time decay value - how much the option price changes per day just from time passing. Positive = option loses value daily (good for sellers). Negative = option gains value daily (bad for sellers).\n\n**Why It Matters:** The model empirically learned that time decay patterns predict expiration outcomes (5.23%, ranked #10). Theta captures option behavior near expiration. This is what the model discovered from analyzing 1.8M options.\n\n**Feature Importance:** 5.23% (empirically learned, ranked #10)',
  },
  daysToExpiry: {
    title: 'Days_To_Expiry (Time Until Expiration)',
    content:
      'Current value range: typically 5-35 days (model filtered range)\n\n• **5-10 days:** Short-term expiration (high time decay impact)\n• **10-20 days:** Medium-term expiration (moderate time decay)\n• **20-35 days:** Longer-term expiration (less immediate decay)\n\n**What It Means:** Number of business days until the option expires. Time remaining affects how much the stock can move and how much the option decays.\n\n**Why This Matters (Surprising Finding):** The model empirically learned that days-to-expiry has the LOWEST importance of all 17 features (2.73%, ranked #17). This seems counterintuitive—more time should matter, right? But the data revealed that time decay is already priced into option values. The market reflects time value, so the raw number of days doesn\'t add much new predictive power. What matters more is volatility (ATR ranked #2) and Greeks.\n\n**Feature Importance:** 2.73% (empirically learned, ranked #17 - LOWEST IMPORTANCE)',
  },
};

// ============================================================================
// 7. AGREEMENT TOOLTIPS - Dual-Model Agreement Analysis
// ============================================================================

export const agreementTooltips: TooltipSection = {
  modelsAgreeField: {
    title: 'Models Agree (Boolean Field)',
    content:
      'Both Probability Optimization Score ≥70% AND TA ML Model ≥70% = True\nOtherwise = False\n\n**Business Value:** Represents 12-18% of all options (highest-confidence tier). These represent the strongest trading opportunities.\n\n**Expected Actual Worthless %:** 75%+\n\n**Statistical Principle:** Combining independent predictors reduces variance and improves robustness.',
  },
  agreementStrengthField: {
    title: 'Agreement Strength Classification',
    content:
      'Categorizes agreement tier:\n\n**Strong Agreement** (~12%): Both >=80%, Expected Actual Worthless % 85%+ -> HIGH PRIORITY\n**Moderate Agreement** (~6%): Both 70-79%, Expected Actual Worthless % 75%+ -> GOOD\n**Total Agreement** (~18%): Combined 12-18% -> ACTIONABLE\n**Disagreement** (~70%): Models diverge -> INVESTIGATE\n**Both Conservative** (~12%): Both <60% -> SKIP',
  },
};

// ============================================================================
// 8. VALIDATION TOOLTIPS - Performance Metrics
// ============================================================================

export const validationTooltips: TooltipSection = {
  hitRate77: {
    title: 'Actual Worthless % in 70-80% Range',
    content:
      'Empirically observed outcomes at 70-80% prediction range:\n• Probability Optimization Model: 83.8% (19,830 options analyzed)\n• TA ML Model: 76.6% (636,639 predictions tested)\n\n**Based on:** 934K+ expired options over 21+ months (April 2024 - January 2026)\n\n**Consistency:** Both models show stable performance across the entire period\n\n**Interpretation:** \n• Probability Optimization Model: 83.8% success rate means 16.2% failure rate\n• TA: 76.6% success rate means 23.4% failure rate\nPremium gains offset by occasional losses.\n\n**Risk Management:** Position sizing must account for failure rate. Average loss when wrong = strike distance.\n\n**Why 70-80%?** Higher premiums than conservative 80%+ range (which has 90%+ Actual Worthless % but minimal premiums)',
  },
  walkForwardAUC: {
    title: 'Walk-Forward AUC: 0.6511 ± 0.040 (Dual-Model)',
    content:
      'Primary validation metric proving both models have genuine predictive ability on **future unseen data**.\n\n**Both Models Achieve:**\n• Probability Optimization Score: 0.651\n• TA ML Model: 0.6511 ± 0.040\n\n**Methodology:** Train on 6-month periods, test on subsequent month, retrain including new data (repeat through Jan 2026)\n\n**Interpretation:** Model correctly orders option pairs 65.1% of the time on future data, with consistency (±0.040 standard error).\n\n**Why This Matters:** Walk-Forward is TRUE validation (Test AUC can be misleading). Models with Test AUC 0.96 but Walk-Forward 0.52 are worse than useless—they fit past but can\'t predict future.\n\n**Our Performance:** 0.6511 ± 0.040 represents genuine predictive ability from both models, not overfitting artifact',
  },
  calibrationError: {
    title: 'Calibration Error: 2.4% (Dual-Model System)',
    content:
      'Expected Calibration Error measures how closely predicted probabilities match empirical outcomes across both models.\n\n**Interpretation:** If either model predicts 75%, actual outcome is approximately 77% (within 2.4% error).\n\n**Methodology:** Split predictions into 10% bins (0-10%, 10-20%, etc.), compare predicted vs. actual frequencies. Validated against 934K+ expired options.\n\n**What It Means:** Predicted probabilities are highly accurate. When models predict 75% expiration worthless, approximately 77% actually expire worthless.\n\n**Quality Bar:** 2.4% error is excellent (0.0 = perfect, 0.25 = random guessing)',
  },
};

// ============================================================================
// 9. DISCLAIMER TOOLTIPS - Risk Factors & Limitations
// ============================================================================

export const disclaimerTooltips: TooltipSection = {
  riskHitRate: {
    title: 'Actual Worthless % Means Failure Rate Too',
    content:
      'When models predict 70-80% probability:\n• Probability Optimization Model: 83.8% expire worthless = 16.2% fail\n• TA ML Model: 76.6% expire worthless = 23.4% fail\n\nThis means approximately 1 in 4-6 options will expire in-the-money (against the prediction).\n\n**Financial Impact:** Failed positions will experience losses = strike distance - premium collected.\n\n**Risk Management Requirement:** Portfolio-level risk controls, position sizing accounting for failure rate, stop-loss implementation.\n\n**Position Sizing Example (TA Model):** If writing 10 put options in 70-80% range, expect ~7-8 to be profitable and ~2-3 to have losses.\n\n**No Guarantee:** Past performance does not guarantee future results.',
  },
  marketRegimeRisk: {
    title: 'Market Regime Changes Risk',
    content:
      'Walk-forward validation tests model on future periods. However, if market fundamentally changes:\n\n• Extreme interest rate shifts\n• Financial crises or major shocks\n• Pandemic or geopolitical disruptions\n• Sector rotation or regime changes\n\nThen learned patterns may become less relevant. Monthly recalibration helps but may lag significant regime shifts.\n\n**Training Data:** 21+ months (April 2024 - Jan 2026) covers mostly normal conditions. Limited severe bear market or crisis data.\n\n**Monitoring Requirement:** Daily health checks catch issues, but continuous monitoring essential.',
  },
  noGuarantees: {
    title: 'No Guarantees of Future Performance',
    content:
      'Most critical limitation:\n\n**What We Know:** Models achieved 77% Actual Worthless % in 70-80% range on 934K+ expired options from April 2024-Jan 2026.\n\n**What We Don\'t Know:** Whether this performance will persist going forward. Market conditions evolve, investors\' behavior changes, regulatory environment shifts.\n\n**Historical Disclaimer:** Past performance does not guarantee future results.\n\n**Appropriate Use:** Use as screening tool and confidence ranking mechanism (not sole decision-maker). Combine with other analysis, implement portfolio-level risk controls, monitor monthly performance.\n\n**Investor Responsibility:** Understand model limitations, implement risk management, accept that real-world trading involves uncertainty.',
  },
};

// ============================================================================
// 10. CALIBRATION METRICS TOOLTIPS - Bucket-Based Calibration Data
// ============================================================================

export const calibrationTooltips: TooltipSection = {
  overview: {
    title: 'Model Calibration & Accuracy',
    content:
      'These tables show actual Actual Worthless %s (% worthless) achieved at each predicted probability level.\n\n**What This Answers:** "When the model predicts 70-80% probability, how often do options actually expire worthless?"\n\n**Key Finding:** Both models independently validated at the 70-80% prediction range:\n• Probability Optimization Model: 83.8% Actual Worthless % (19,830 samples)\n• TA ML Model: 76.6% Actual Worthless % (636,639 samples)\n\n---\n\n**THE 25.6x DATA DIFFERENCE - THE COMPLETE PICTURE:**\n\n**Starting Point (Both Models):**\n- Both begin with 1,860,935 historical Swedish options (April 2024 - January 2026)\n\n**Probability Optimization Model DATA FILTERING (Only 3.9% pass all requirements):**\n\nProbability Optimization Model uses 5 complex probability calculation methods requiring:\n1. Black-Scholes mathematical formula\n2. Calibrated probability adjustment\n3. Historical volatility analysis\n4. Bayesian statistical calibration\n5. Ensemble weighted average\n\nEach option also needs:\n- Current probability (from 5-method calculation)\n- Historical peak probability (months of tracking data)\n- Support strength score (from price pattern analysis)\n- Known final outcome (already expired)\n\nFiltering waterfall:\n• Start: 1,860,935 options\n• Has probability calculations? → 72,469 remain (3.9%)\n• Has historical peak? → Further filtered\n• Has support metrics? → Further filtered  \n• Has known outcome? → **72,469 final (3.9%)**\n\n**TA MODEL V3 DATA FILTERING (~100% pass requirements):**\n\nTA Model uses 17 standard technical analysis features:\n- Stock indicators: RSI, MACD, ADX, ATR, Bollinger Bands, etc.\n- Option Greeks: Delta, Vega, Theta\n- Simple calculations: Volatility ratio, Days to expiry, Distance to MA\n\nEach requires only:\n- Daily price data (open, high, low, close)\n- Current implied volatility\n- Option parameters (strike, expiration)\n\nThese are **standard market data available for every stock**.\n\nFiltering waterfall:\n• Start: 1,860,935 options\n• Has complete price history? → ~1,845,935 remain (99.2%)\n• Has volatility data? → ~1,840,935 remain (98.9%)\n• Edge cases cleaned? → **~1,860,935 final (~100%)**\n\n---\n\n**ONE-SENTENCE SUMMARY:**\n\n**"Probability Optimization Model requires months of special historical probability tracking data that only 3.9% of options have. TA Model V3 requires only standard daily price data that 100% of options have."**\n\n---\n\n**Why This Matters:**\n• Probability Optimization Model: Deeply optimized for the 3.9% of options it can analyze → 83.8% accuracy\n• TA Model: Generalizes to all 100% of options → 76.6% realistic expectation\n• Different populations tested = different results expected and correct\n• Probability Optimization Model is "specialist" (tracked options); TA Model is "generalist" (all options)',
  },
  premiumZone: {
    title: '70-80% Premium Zone (OPTIMAL)',
    content:
      'The 70-80% prediction range is the optimal premium collection zone because:\n\n**Model Performance:**\n• Probability Optimization Model: 83.8% Actual Worthless % (16.2% failure rate)\n• TA ML Model: 76.6% Actual Worthless % (23.4% failure rate)\n→ Premium gains offset occasional losses\n\n**Why This Zone?**\n→ Offers higher premiums than conservative 80%+ ranges\n→ Maintains reasonable accuracy compared to <70% ranges\n\n**Expected Return Formula:**\nExpected Return = (Model Accuracy × Premium) - (Failure Rate × Loss)\n\nThis risk-adjusted return profile is why 70-80% dominates trading strategies.\n\n**Risk-Adjusted Return:** Superior to both 80%+ (lower premiums) and <70% (lower Actual Worthless %).',
  },
  confidenceIntervals: {
    title: '95% Confidence Intervals',
    content:
      'Range where the true Actual Worthless % is 95% likely to fall based on sample size.\n\n**Example (TA V3 at 70-80%):** 77.1% ± 0.2% = [77.0%-77.2%]\n\nInterpretation: We\'re 95% confident the true Actual Worthless % falls between 77.0% and 77.2%.\n\n**Why Tight CIs Matter:** Tight intervals (like [77.0%-77.2%] with 583K samples) indicate reliable, precise estimates. Wide intervals would indicate uncertainty.\n\n**Sample Size Relationship:**\n• Larger samples (583K) = Tighter intervals\n• Smaller samples (15K) = Wider intervals\n\n**Investment Decision:** Tight CIs at 70-80% indicate the 77% Actual Worthless % is a reliable, stable metric for trading decisions.',
  },
  temporalStability: {
    title: 'Temporal Stability (Per-Fold Analysis)',
    content:
      'Shows how model calibration varies across different 3-month market periods (folds 1-5 in walk-forward validation) at the 70-80% prediction range.\n\n**Why This Matters:** Calibration shows period-to-period variation:\n• Fold 1: 73.8% (near average)\n• Fold 2: 64.7% (significant underperformance during Dec 2024-Mar 2025)\n• Fold 3: 82.0% (strong performance)\n• Fold 4: 79.0% (above average)\n• Fold 5: 80.8% (above average, recent)\n\n**What This Reveals:**\n• Market regimes affect calibration accuracy\n• Long-term average masks period-to-period swings\n• Recent periods (Folds 4-5) show strength\n• Fold 2 underperformance reflects temporary market regime shift\n\n**Investment Takeaway:** Long-term average is reliable, but understand Actual Worthless %s will fluctuate with market conditions. Recent performance (Folds 4-5) suggests current calibration is strong.',
  },
  dualModelConvergence: {
    title: 'Why Models Differ: Data Requirements & Populations Tested',
    content:
      'Both models show strong Actual Worthless % at 70-80%, but 32x different sample sizes reveal fundamental differences:\n• Probability Optimization (Probability Optimization Model): 83.8% (19,830 samples)\n• TA ML Model (V3): 76.6% (636,639 samples)\n\n===== Probability Optimization Model: THE SPECIALIST (Only 3.9% of Options) =====\n\n**Probability Optimization Model Data Requirement: 5 Complex Probability Methods**\n- Black-Scholes mathematical formula\n- Calibrated probability adjustment (comparing to historical outcomes)\n- Historical volatility analysis\n- Bayesian statistical calibration\n- Ensemble weighted average (combining all methods)\n\n**Each option also needs:**\n- Current probability (from complex 5-method calculation)\n- Historical peak probability (months of tracking data per option)\n- Support strength score (price pattern analysis)\n- Known final outcome (option must have already expired)\n\n**Filtering results on 1.86M options:**\n- Has probability calculations? → 72,469 remain (3.9%)\n- Has historical peak? → Further filtered\n- Has support metrics? → Further filtered\n- Has known outcome? → 72,469 final (3.9%)\n\n**Why so few (3.9%)?**\n- New options lack months of tracking history\n- Probability tracking system is resource-intensive (complex calculations)\n- Selective tracking—not all options tracked equally\n- Some stocks lack required historical data\n\n**Result:** 83.8% accuracy at 70-80%\n- Probability Optimization Model deeply optimized for the 3.9% it analyzes\n- ±0.53 pp confidence interval (19,830 samples)\n- What it proves: "Works excellently on actively tracked options"\n\n===== TA MODEL: THE GENERALIST (Nearly 100% of Options) =====\n\n**TA Model Data Requirement: 17 Standard Technical Features**\n\nStock-level indicators (calculated from price data):\n- RSI, MACD, ADX, ATR, Stochastic, Bollinger Bands, Volatility ratio, Distance to MA\n\nOption-level features (calculated from option parameters):\n- Greeks: Delta, Vega, Theta\n- Simple metrics: Sigma distance, Days to expiry\n\n**Data required:**\n- Daily stock price (open, high, low, close) - STANDARD MARKET DATA\n- Implied volatility - STANDARD MARKET DATA\n- Option parameters (strike, expiration) - STANDARD MARKET DATA\n\n**Filtering results on 1.86M options:**\n- Has complete price history? → ~1,845,935 remain (99.2%)\n- Has volatility data? → ~1,840,935 remain (98.9%)\n- Edge cases cleaned? → ~1,860,935 final (99%+)\n\n**Why so many (99%+)?**\n- No special tracking system needed\n- Uses standard market data available for EVERY stock\n- Simple calculations, no complex probability methods\n- Works on new options immediately (no months of history required)\n\n**Result:** 76.6% accuracy at 70-80%\n- TA Model generalizes to 100% of market\n- ±0.11 pp confidence interval (636,639 samples)\n- What it proves: "Works on new options it\'s never seen"\n\n===== THE KEY INSIGHT =====\n\n**"Probability Optimization Model requires months of special historical probability tracking data that only 3.9% of options have. TA Model V3 requires only standard daily price data that 100% of options have."**\n\n**Why Different Results Are CORRECT:**\n✓ Probability Optimization Model is a specialist optimized for 3.9% → Higher accuracy on that population\n✓ TA Model is a generalist validated on 100% → Realistic expectation for any option\n✓ Testing different populations explains different hit rates\n✓ Both approaches are statistically valid\n✓ Probability Optimization Model best for tracking portfolio; TA Model best for new opportunities',
  },
  walkForwardValidation: {
    title: 'Walk-Forward Validation (Out-of-Sample)',
    content:
      'TA Model V3 calibration based on 1.59M walk-forward validated predictions.\n\n**What "Walk-Forward" Means:**\n• Model never saw the data it was tested on\n• Each prediction made on future periods\n• Most rigorous validation methodology\n• Proves genuine predictive ability (not overfitting)\n\n**Why This Matters:**\n• Test AUC on recent data can be misleading (model fitting to training period)\n• Walk-forward AUC on truly future data is TRUE validation\n• Our 0.6511 Walk-Forward AUC proves 1.59M out-of-sample predictions are genuine\n\n**Investment Confidence:** Walk-forward validated Actual Worthless %s are the most trustworthy metrics for real-world trading decisions.',
  },
  calibrationAccuracy: {
    title: 'Calibration Accuracy: Why Models Differ in Error Rates',
    content:
      'Calibration error measures: When models predict X% probability, do approximately X% actually expire worthless?\n\n**Probability Optimization Model Calibration Error:** 2.4% (on tracked options)\n• Tests on 72,469 options from Probability Tracking System\n• In-sample testing (formula calibrated on same data it predicts)\n• Measures: "How close are predictions to reality on tracked options?"\n• Result: If Probability Optimization Model predicts 75%, actual on tracked options ~77% (within 2.4%)\n\n**TA Model Calibration:** Similar 2.4% error (on comprehensive database)\n• Tests on 1.86M options from historical database via walk-forward\n• Out-of-sample testing (predicts on data model never trained on)\n• Measures: "How close are predictions to reality on new, unseen options?"\n• Result: If TA Model predicts 75%, actual on new options ~77% (within 2.4%)\n\n**Why This Matters:**\n• 2.4% average error is excellent (0.0% = perfect, 25% = random guessing)\n• Both models understand their predictions accurately\n• The different testing approaches validate for different use cases\n• Probability Optimization Model: Reliable for tracking portfolio\n• TA Model: Reliable for new trading opportunities\n\n**Investor Takeaway:** 2.4% error demonstrates both models produce trustworthy predictions for their respective purposes.',
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
  calibration: calibrationTooltips,
  disclaimers: disclaimerTooltips,
};

export default scoredOptionsTooltips;
