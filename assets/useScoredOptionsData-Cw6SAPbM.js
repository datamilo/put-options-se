import{u as T,j as t}from"./index-C3K-k8UA.js";import{C as M,a as A,b as D,c as I}from"./card-C1EPnjHb.js";import{f as v,d as w}from"./numberFormatting-BNPfGtWN.js";import{I as k}from"./info-icon-tooltip-Crn9pV5f.js";import{r as b}from"./router-Ci3v7tuP.js";import{u as R}from"./useEnrichedOptionsData-s_GxOu2u.js";const B={totalOptions:{title:"Total Options Available",content:"Complete universe of Swedish equity options analyzed daily. Only includes OTM (out-of-the-money) and ATM (at-the-money) options—ITM (in-the-money) options excluded because the premium collection strategy focuses on writing options for value decay. This means the daily count varies 4,500-5,500 options depending on market conditions. System scores 99.9% of available options."},avgCombinedScore:{title:"Average Combined Score",content:"Average confidence level across your filtered options. The combined score is the average of the Probability Optimization Score and TA ML Model probability. Higher scores indicate stronger model consensus between the two independent models. Green (≥75) = strong, Amber (70-74) = good, Red (<70) = lower confidence."},sampleSize:{title:"Sample Size for Score Range",content:"Historical validation sample size for the score range of your filtered options. Larger samples provide higher statistical confidence in the models' predictions. Our TA ML Model is validated on 7.4M+ out-of-sample records (8.76M trained, May 2026 retrain), and the Probability Optimization Model on 72K+ tracked options."},showing:{title:"Showing Results",content:'Number of options displayed in current table (after applying all filters). Total may be less than "Total Options Available" if filters are active.'}},W={expiryDate:{content:"Filter options by expiration window. Model is calibrated for 5-35 day expirations where premium-to-accuracy tradeoff is optimal."},stocks:{content:"Select specific stocks to analyze. Covers ~80-100 major Swedish equity securities with sufficient liquidity and options depth."},modelAgreement:{content:`Filter by proximity-based model agreement (how close are the scores?):

**Strong Agreement:** Scores within ±2% of each other (excellent consensus)
**Moderate Agreement:** Scores within ±2% to ±5% (good consensus)
**Weak Agreement:** Scores within ±5% but separated (disagreement)
**Models Disagree:** Scores separated by >±5% (conflicting signals)

**How It Works:** Relative difference = |Probability Optimization - TA ML| / average score. When <5%, models agree.`},minCombinedScore:{content:`Combined Score = Average of Probability Optimization Score and TA ML Model Probability.

The 70-80% probability range shows historical accuracy:
• Probability Optimization Model: 83.8% Actual Worthless %
• TA ML Model: 70.06% Actual Worthless % (note: varies by DTE; 77% for 0-35 DTE, 54% for 36+ DTE)
• Expected calibration error: 2.2% (ECE)`},minV21Score:{content:"Filter by Probability Optimization Model score only. Useful for analyzing primary model performance independently."},minTAProb:{content:"Filter by TA ML Model probability only. TA ML Model is independent validation using machine learning technical analysis."}},P={v21Score:{title:"Probability Optimization Score",content:`Weighted composite score (0-100) combining three factors:

• **Current Probability** (60% weight): Market-derived probability of expiration worthless
• **Historical Peak** (30% weight): Maximum probability achieved during option lifetime
• **Support Strength** (10% weight): Structural support level robustness

**Formula:** (Current × 0.60) + (Peak × 0.30) + (Support × 0.10)`},taProbability:{title:"TA ML Model Probability",content:`Machine learning prediction (0-100) using calibrated Random Forest with 17 features combining technical indicators, volatility measures, and options Greeks. Independent validation model using stock-level technical signals and contract-level features.

**Test AUC:** 0.8615
**Walk-Forward AUC:** 0.6511 ± 0.040
**Brier Score:** 0.1519 (well-calibrated)`},combined:{title:"Combined Score / Agreement",content:`Average of Probability Optimization Score and TA ML Model probability (0-100 scale). Color indicates confidence level AND agreement status.

**Green (≥80):** High confidence - typically models are closely aligned (Strong agreement)
**Amber (70-79):** Good confidence - OPTIMAL RANGE for 77% hit rate with 5-10x premiums. Models may vary (Moderate agreement)
**Red (<70):** Lower confidence - consider additional analysis

**Note:** Color reflects SCORE LEVEL, not agreement status. Check "Models Agree" column for agreement classification.`},agree:{title:"Models Agree",content:`Boolean flag indicating whether the two independent models have SIMILAR predictions (within ±5% relative difference).

**Yes = Models Agree:** Scores are within ±5% proximity (consensus between models)
**No = Models Disagree:** Scores separated by >±5% (conflicting predictions)

**Formula:** Relative difference = |Probability Optimization Score - (TA ML Probability × 100)| / average score ≤ 0.05

This measures AGREEMENT (similarity), not absolute score levels.`},strength:{title:"Agreement Strength",content:`Classification of model alignment:

**Strong Agreement:** Scores within ±2% relative difference
**Moderate Agreement:** Scores within ±2% to ±5% relative difference
**Weak Agreement:** Scores >±5% relative difference`}},E={currentProbability:{title:"Current Probability (60% Weight)",content:`The current market's implied assessment of whether the option will expire worthless.

**Calculation Method:** Bayesian isotonic calibration applied to Black-Scholes theoretical probabilities.

**Why 60% Weight:** Strongest individual predictor (AUC 0.7994). Market prices reflect all available information.

**Interpretation:** If 90%, market believes 90% chance of expiration worthless. Direct measure of likely outcome.`},historicalPeak:{title:"Historical Peak (30% Weight)",content:`The maximum probability this specific option contract has ever reached during its lifetime.

**Why This Matters:** Options experience mean reversion. Historical peak indicates stock's capacity to move away from strike. Higher peak suggests stock has proven ability to stay above strike.

**Why 30% Weight:** Second-strongest predictor (AUC 0.7736). Captures pattern of past behavior and provides directional confidence.

**Interpretation:** Historical strength provides confidence that current market conditions represent achievable outcomes.`},supportStrength:{title:"Support Strength (10% Weight)",content:`Robustness metric of the nearest structural support level below the strike price.

**Why This Matters:** Support levels act as natural price floors. Strong support reduces probability of deep in-the-money moves and prevents catastrophic losses.

**Why 10% Weight:** Weakest individual predictor (AUC 0.6169). Provides insurance/safeguard function useful for risk management, not primary signal.

**Interpretation:** Acts as a risk filter. Options trading below weak support are flagged as riskier despite favorable primary signals.`}},F={rsi14:{title:"RSI_14 (Relative Strength Index)",content:`Current value range: 0-100

• **Below 30:** Oversold (stock has fallen sharply) → favorable for puts
• **30-70:** Neutral range
• **Above 70:** Overbought (stock has risen sharply) → less favorable for puts

**What It Does:** Measures momentum extremes. When RSI is very low or very high, the stock often reverses toward the middle.

**Why It Matters:** The ML model empirically learned from 1.8M Swedish options records that RSI momentum levels predict expiration outcomes. This is what the data revealed, not traditional indicator theory.

**Feature Importance:** 5.27% (empirically learned, ranked #9)`},rsiSlope:{title:"RSI_Slope (3-period RSI Change)",content:`Current value range: typically -5 to +5

• **Negative (declining):** RSI is falling → momentum weakening
• **Positive (rising):** RSI is rising → momentum strengthening

**What It Does:** Shows whether momentum is accelerating or decelerating. Catches turning points where momentum changes direction.

**Why It Matters:** The model empirically determined that momentum acceleration/deceleration predicts expiration probability. The data revealed this relationship from analyzing 1.8M+ historical options.

**Feature Importance:** 3.58% (empirically learned, ranked #16)`},macdHist:{title:"MACD_Hist (MACD Histogram)",content:`Current value range: typically -2 to +2

• **Negative (below zero):** Bearish momentum → favorable for puts
• **Around zero:** Transition point (trend changing)
• **Positive (above zero):** Bullish momentum → unfavorable for puts

**What It Does:** Shows trend momentum by measuring distance between MACD and signal line. Larger values mean stronger trends.

**Why Bearish Is Favorable (Empirical Finding):** The ML model discovered that bearish MACD values correlate with options expiring worthless. This seems backwards—traditional TA says bearish means downward. But the data from 1.8M Swedish options showed that bearish momentum predicts expiration. This likely reflects mean reversion: beaten-down stocks often bounce back above the strike. Trust the data, not the theory.

**Feature Importance:** 6.03% (empirically learned, ranked #7)`},macdSlope:{title:"MACD_Slope (3-period MACD Change)",content:`Current value range: typically -1 to +1

• **Negative (declining):** Momentum is weakening → unfavorable
• **Positive (rising):** Momentum is strengthening → favorable

**What It Does:** Shows whether momentum is accelerating or decelerating. Positive slope means trends are getting stronger, negative means they're losing power.

**Why It Matters:** The model empirically learned that trend acceleration/deceleration predicts expiration probability. Established trends (positive slope) correlate with put expiration worthless. This is what 1.8M Swedish options records revealed.

**Feature Importance:** 4.81% (empirically learned, ranked #11)`},bbPosition:{title:"BB_Position (Bollinger Band Position)",content:`Current value range: 0 to 1

• **Near 0 (lower band):** Stock at lower extreme, near support → favorable
• **0.5 (middle):** Stock at middle of normal range
• **Near 1 (upper band):** Stock at upper extreme, near resistance → less favorable

**What It Does:** Shows where the stock price sits between its normal high and low ranges. Extremes (near 0 or near 1) often reverse back toward the middle.

**Why It Matters:** The model discovered that price extremes within Bollinger Bands predict expiration outcomes. This is an empirical pattern from analyzing 1.8M options, not traditional mean reversion theory.

**Feature Importance:** 4.31% (empirically learned, ranked #13)`},distSMA50:{title:"Dist_SMA50 (Distance to 50-day Moving Average)",content:`Current value range: typically -10% to +10%

• **Negative (below MA):** Stock trading below trend line → favorable
• **Around zero:** Stock near its trend line
• **Positive (above MA):** Stock trading above trend line → less favorable

**What It Does:** Shows how far the stock has moved away from its 50-day trend. When distance is large, the stock often reverts back toward the trend line.

**Why It Matters:** The model empirically learned that deviation from the 50-day trend predicts expiration probability. Stocks far from their trend tend to move back, affecting put outcomes. This is what 1.8M records revealed.

**Feature Importance:** 7.66% (empirically learned, ranked #5)`},volRatio:{title:"Vol_Ratio (Recent vs. Historical Volatility)",content:`Current value range: 0.5 to 2.0

• **Below 1.0:** Trading volume lower than usual → weaker activity
• **Around 1.0:** Normal trading volume
• **Above 1.0:** Trading volume higher than usual → stronger activity

**What It Does:** Compares recent volatility to the historical average. Higher values mean unusual volatility spikes, lower values mean calm periods.

**Why It Matters:** The model empirically learned that volatility regimes predict expiration outcomes. Volatility changes affect price distributions and option behavior. This is what the data from 1.8M options revealed.

**Feature Importance:** 4.13% (empirically learned, ranked #14)`},adx14:{title:"ADX_14 (Average Directional Index - Trend Strength)",content:`Current value range: 0-100 (typically 10-50)

• **Below 20:** Weak trend or no direction → choppy, mixed signals
• **20-40:** Moderate to strong trend → clear direction
• **Above 40:** Very strong trend → pronounced momentum

**What It Does:** Measures how strong the current trend is. High ADX = strong trend (either up or down). Low ADX = ranging/choppy market.

**Why It Matters:** The model empirically discovered that trend strength is highly predictive of expiration outcomes—ranked #3 of all 17 features (8.12%). When trends are strong, options behave differently than in choppy markets. This is what 1.8M Swedish options records revealed.

**Feature Importance:** 8.12% (empirically learned, ranked #3)`},adxSlope:{title:"ADX_Slope (3-period ADX Change)",content:`Current value range: typically -2 to +2

• **Negative (declining):** Trend strength weakening → less defined direction
• **Positive (rising):** Trend strength increasing → clearer, stronger direction

**What It Does:** Shows whether trends are getting stronger or falling apart. Emerging trends (positive slope) have different behavior than dissolving trends.

**Why It Matters:** The model learned that trend acceleration/deceleration predicts expiration probability. As trends form or dissolve, option outcomes shift. This is an empirical pattern from 1.8M options.

**Feature Importance:** 5.28% (empirically learned, ranked #8)`},atr14:{title:"ATR_14 (Average True Range - Volatility Measure)",content:`Current value range: depends on stock price (e.g., 0.5-5 kr for a 100 kr stock)

• **Low values:** Stock is stable with small daily moves → lower volatility
• **High values:** Stock is volatile with large daily moves → higher volatility

**What It Does:** Measures typical daily price movement magnitude. ATR shows "how much does this stock typically swing per day?" Higher ATR = bigger swings.

**Why It Matters:** The model empirically discovered that volatility magnitude is the 2nd most important predictor of expiration outcomes (8.52%, ranked #2)! This is surprising—it contradicts traditional volatility theory which focuses on risk. But the data from 1.8M Swedish options revealed volatility itself predicts expiration. This is an empirical finding unique to put option expiration prediction.

**Feature Importance:** 8.52% (empirically learned, ranked #2 - SECOND MOST IMPORTANT)`},stochasticK:{title:"Stochastic_K (%K) - Fast Stochastic",content:`Current value range: 0-100

• **Below 20:** Oversold (stock at recent lows) → favorable
• **20-80:** Normal range
• **Above 80:** Overbought (stock at recent highs) → less favorable

**What It Does:** Shows where the current stock price falls within its recent high-low range. Similar to RSI but based on price location, not momentum strength.

**Why It Matters:** The model empirically learned that Stochastic momentum predicts expiration outcomes. This is what 1.8M options records revealed about how price extremes correlate with worthless expiration.

**Feature Importance:** 3.79% (empirically learned, ranked #15)`},stochasticD:{title:"Stochastic_D (Slow Stochastic - Signal Line)",content:`Current value range: 0-100

• **Below 20:** Oversold → favorable
• **20-80:** Normal range
• **Above 80:** Overbought → less favorable

**What It Does:** Smoothed version of Stochastic %K (3-period average). More stable than %K and better for confirming momentum signals.

**Why It Matters:** The model empirically learned that smoothed momentum predicts expiration. The smoothing reduces noise and captures true trend changes. This is an empirical discovery from analyzing 1.8M options.

**Feature Importance:** 4.58% (empirically learned, ranked #12)`}},L={sigmaDistance:{title:"Sigma_Distance (Volatility-Normalized Strike Distance)",content:`**What It Measures:** Distance from current stock price to strike price, adjusted for volatility and time remaining.

Formula: (Strike - Current Price) / (Annual Volatility × √(Days to Expiry/365))

**Value Range:** Depends on volatility and expiration, typically -3 to +3 standard deviations

**What It Does:** Answers: "How many typical price swings away is the strike?" It accounts for two things traditional fixed percentages miss:

• **Volatility Adjustment:** 2% away on a 100 kr volatile stock ≠ 2% away on a 100 kr stable stock
• **Time Adjustment:** 2% away on a 5-day option ≠ 2% away on a 30-day option

Without this normalization, options compress into a narrow probability range. With it, full spectrum (0.044 to 0.992).

**Why It Matters:** The model empirically learned that normalized strike distance strongly predicts expiration (8.00%, ranked #4). This is what 1.8M Swedish options records revealed.

**Feature Importance:** 8.00% (empirically learned, ranked #4)`},delta:{title:"⭐ Greeks_Delta (MOST IMPORTANT - #1 Predictor)",content:`Current value range: -1 to 0 for put options

• **Near 0 (e.g., -0.05):** Option far out-of-the-money (very likely worthless) → favorable
• **Around -0.5:** Option at-the-money (50/50 chance) → neutral
• **Near -1 (e.g., -0.95):** Option deep in-the-money (likely has value) → less favorable

**What It Means:** Delta shows option price sensitivity. For puts: -0.30 means the option price changes 0.30 kr when the stock moves 1 kr.

**CRITICAL EMPIRICAL FINDING:** The ML model discovered that Delta is the SINGLE STRONGEST PREDICTOR of put expiration worthless (11.82%, ranked #1). This contradicts traditional options theory, which uses Delta primarily for hedging calculations.

**Why This Matters:** Traditional options textbooks never mention Delta predicting expiration probability. But when the model analyzed 1.8M Swedish options records, Delta emerged as the top feature. This is a discovery unique to this dataset. Trust the data, not the textbook.

**Feature Importance:** 11.82% (empirically learned, ranked #1 - SINGLE MOST IMPORTANT OF ALL 17 FEATURES)`},vega:{title:"Greeks_Vega (Volatility Sensitivity)",content:`Current value range: typically 0.01 to 0.2

• **Low values:** Option barely affected by volatility changes
• **High values:** Option strongly affected by volatility changes

**What It Means:** Vega shows how much the option price changes per 1% change in implied volatility. Higher vega = more sensitive to volatility swings.

**Why It Matters:** The model empirically discovered that volatility sensitivity predicts expiration outcomes (6.12%, ranked #6). This is an empirical pattern from 1.8M options records. Traditional options theory uses Vega for volatility hedging, not expiration prediction.

**Feature Importance:** 6.12% (empirically learned, ranked #6)`},theta:{title:"Greeks_Theta (Time Decay)",content:`Current value range: typically -0.1 to +0.1

• **Positive values:** Option loses value each day (premium seller benefits) → favorable
• **Negative values:** Option gains value each day (premium seller loses) → less favorable

**What It Means:** Theta shows daily time decay value - how much the option price changes per day just from time passing. Positive = option loses value daily (good for sellers). Negative = option gains value daily (bad for sellers).

**Why It Matters:** The model empirically learned that time decay patterns predict expiration outcomes (5.23%, ranked #10). Theta captures option behavior near expiration. This is what the model discovered from analyzing 1.8M options.

**Feature Importance:** 5.23% (empirically learned, ranked #10)`},daysToExpiry:{title:"Days_To_Expiry (Time Until Expiration)",content:`Current value range: typically 5-35 days (model filtered range)

• **5-10 days:** Short-term expiration (high time decay impact)
• **10-20 days:** Medium-term expiration (moderate time decay)
• **20-35 days:** Longer-term expiration (less immediate decay)

**What It Means:** Number of business days until the option expires. Time remaining affects how much the stock can move and how much the option decays.

**Why This Matters (Surprising Finding):** The model empirically learned that days-to-expiry has the LOWEST importance of all 17 features (2.73%, ranked #17). This seems counterintuitive—more time should matter, right? But the data revealed that time decay is already priced into option values. The market reflects time value, so the raw number of days doesn't add much new predictive power. What matters more is volatility (ATR ranked #2) and Greeks.

**Feature Importance:** 2.73% (empirically learned, ranked #17 - LOWEST IMPORTANCE)`}},G={modelsAgreeField:{title:"Models Agree (Boolean Field)",content:`Both Probability Optimization Score ≥70% AND TA ML Model ≥70% = True
Otherwise = False

**Business Value:** Represents 12-18% of all options (highest-confidence tier). These represent the strongest trading opportunities.

**Expected Actual Worthless %:** 75%+

**Statistical Principle:** Combining independent predictors reduces variance and improves robustness.`},agreementStrengthField:{title:"Agreement Strength Classification",content:`Categorizes agreement tier:

**Strong Agreement** (~12%): Both >=80%, Expected Actual Worthless % 85%+ -> HIGH PRIORITY
**Moderate Agreement** (~6%): Both 70-79%, Expected Actual Worthless % 75%+ -> GOOD
**Total Agreement** (~18%): Combined 12-18% -> ACTIONABLE
**Disagreement** (~70%): Models diverge -> INVESTIGATE
**Both Conservative** (~12%): Both <60% -> SKIP`}},h={kpi:B,filters:W,columns:P,v21Details:E,taStockIndicators:F,taContractIndicators:L,agreement:G},q=({option:r})=>{const{t:n}=T("pages"),g=l=>l>=80?"text-green-700":l>=70?"text-amber-600":"text-red-600",u=l=>l>=80?"bg-green-50 dark:bg-green-950":l>=70?"bg-amber-50 dark:bg-amber-950":"bg-red-50 dark:bg-red-950",y=()=>{const l=r.v21_score;return l>=90?n("scoredOptions.v21Breakdown.interp90"):l>=80?n("scoredOptions.v21Breakdown.interp80"):l>=70?n("scoredOptions.v21Breakdown.interp70"):l>=60?n("scoredOptions.v21Breakdown.interp60"):n("scoredOptions.v21Breakdown.interp0")};return t.jsxs(M,{className:`${u(r.v21_score)}`,children:[t.jsxs(A,{className:"pb-3",children:[t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx(D,{className:"text-lg",children:n("scoredOptions.v21Breakdown.title")}),t.jsx("div",{className:`text-3xl font-bold ${g(r.v21_score)}`,children:r.v21_score!=null?`${v(r.v21_score,1)}%`:"-"})]}),t.jsxs("div",{className:"text-sm text-muted-foreground mt-2",children:[n("scoredOptions.v21Breakdown.bucket")," ",t.jsx("span",{className:"font-semibold",children:r.v21_bucket})]})]}),t.jsxs(I,{className:"space-y-4",children:[t.jsxs("div",{children:[t.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[t.jsx("span",{className:"text-sm font-medium",children:n("scoredOptions.v21Breakdown.currentProbability")}),t.jsx(k,{title:h.v21Details.currentProbability.title,content:h.v21Details.currentProbability.content,side:"top"})]}),t.jsx("div",{className:"flex justify-between items-center mb-2",children:t.jsx("span",{className:"font-semibold",children:r.current_probability!=null?w(r.current_probability,2):"-"})}),t.jsx("div",{className:"w-full h-2 bg-gray-200 rounded-full overflow-hidden",children:t.jsx("div",{className:"h-full bg-blue-500",style:{width:`${Math.min((r.current_probability||0)*100,100)}%`}})}),t.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:n("scoredOptions.v21Breakdown.probWorthlessNote")})]}),t.jsxs("div",{children:[t.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[t.jsx("span",{className:"text-sm font-medium",children:n("scoredOptions.v21Breakdown.historicalPeak")}),t.jsx(k,{title:h.v21Details.historicalPeak.title,content:h.v21Details.historicalPeak.content,side:"top"})]}),t.jsx("div",{className:"flex justify-between items-center mb-2",children:t.jsx("span",{className:"font-semibold",children:r.v21_historical_peak!=null?w(r.v21_historical_peak,2):"-"})}),t.jsx("p",{className:"text-xs text-muted-foreground",children:n("scoredOptions.v21Breakdown.historicalPeakNote")})]}),t.jsxs("div",{children:[t.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[t.jsx("span",{className:"text-sm font-medium",children:n("scoredOptions.v21Breakdown.supportStrength")}),t.jsx(k,{title:h.v21Details.supportStrength.title,content:h.v21Details.supportStrength.content,side:"top"})]}),t.jsx("div",{className:"flex justify-between items-center mb-2",children:t.jsx("span",{className:"font-semibold",children:r.v21_support_strength!=null?`${v(r.v21_support_strength,2)}%`:"-"})}),t.jsx("div",{className:"w-full h-2 bg-gray-200 rounded-full overflow-hidden",children:t.jsx("div",{className:"h-full bg-purple-500",style:{width:`${Math.min(r.v21_support_strength||0,100)}%`}})}),t.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:n("scoredOptions.v21Breakdown.supportStrengthNote")})]}),t.jsx("div",{className:"mt-4 pt-3 border-t",children:t.jsx("p",{className:"text-sm italic text-gray-700",children:y()})})]})]})},Y=({option:r})=>{const{t:n}=T("pages"),g=e=>e>=.7?"text-green-700":e>=.5?"text-amber-600":"text-red-600",u=e=>e>=.7?"bg-green-50 dark:bg-green-950":e>=.5?"bg-amber-50 dark:bg-amber-950":"bg-red-50 dark:bg-red-950",y=(e,s)=>{switch(s){case"RSI_14":return e<30?{emoji:"🟢",state:"low"}:e>70?{emoji:"🔴",state:"high"}:{emoji:"🟡",state:"neutral"};case"RSI_Slope":return e<-1?{emoji:"🟢",state:"low"}:e>1?{emoji:"🔴",state:"high"}:{emoji:"🟡",state:"neutral"};case"MACD_Hist":return e<-.5?{emoji:"🟢",state:"low"}:e>.5?{emoji:"🔴",state:"high"}:{emoji:"🟡",state:"neutral"};case"MACD_Slope":return e>.1?{emoji:"🟢",state:"high"}:e<-.1?{emoji:"🔴",state:"low"}:{emoji:"🟡",state:"neutral"};case"BB_Position":return e<-.5?{emoji:"🟢",state:"low"}:e>.5?{emoji:"🔴",state:"high"}:{emoji:"🟡",state:"neutral"};case"Dist_SMA50":return e<-2?{emoji:"🟢",state:"low"}:e>2?{emoji:"🔴",state:"high"}:{emoji:"🟡",state:"neutral"};case"Vol_Ratio":return e>1.2?{emoji:"🟢",state:"high"}:e<.8?{emoji:"🔴",state:"low"}:{emoji:"🟡",state:"neutral"};case"ADX_14":return e>25?{emoji:"🟢",state:"high"}:e>20?{emoji:"🟡",state:"moderate"}:{emoji:"🔴",state:"low"};case"ADX_Slope":return e>.5?{emoji:"🟢",state:"high"}:e<-.5?{emoji:"🔴",state:"low"}:{emoji:"🟡",state:"neutral"};case"ATR_14":return e>2?{emoji:"🟢",state:"high"}:e>1?{emoji:"🟡",state:"moderate"}:{emoji:"🔴",state:"low"};case"Stochastic_K":return e<20?{emoji:"🟢",state:"low"}:e>80?{emoji:"🔴",state:"high"}:{emoji:"🟡",state:"neutral"};case"Stochastic_D":return e<20?{emoji:"🟢",state:"low"}:e>80?{emoji:"🔴",state:"high"}:{emoji:"🟡",state:"neutral"};case"Sigma_Distance":return Math.abs(e)>2?{emoji:"🟢",state:"high"}:Math.abs(e)>1?{emoji:"🟡",state:"moderate"}:{emoji:"🔴",state:"low"};case"Greeks_Delta":return e<-.5?{emoji:"🟢",state:"high"}:e<-.25?{emoji:"🟡",state:"moderate"}:{emoji:"🔴",state:"low"};case"Greeks_Vega":return e>.05?{emoji:"🟢",state:"high"}:e>.01?{emoji:"🟡",state:"moderate"}:{emoji:"🔴",state:"low"};case"Greeks_Theta":return e>.01?{emoji:"🟢",state:"high"}:e>-.01?{emoji:"🟡",state:"neutral"}:{emoji:"🔴",state:"low"};default:return{emoji:"⚪",state:"unknown"}}},l=e=>n(`scoredOptions.taBreakdown.indicatorLabels.${e}`),p=(e,s)=>n(s==="unknown"?"scoredOptions.taBreakdown.status.unknown.label":`scoredOptions.taBreakdown.status.${e}.${s}.label`),a=(e,s)=>n(s==="unknown"?"scoredOptions.taBreakdown.status.unknown.assessment":`scoredOptions.taBreakdown.status.${e}.${s}.assessment`),_=(e,s)=>e==="Dist_SMA50"?w(s,2):e==="Stochastic_K"||e==="Stochastic_D"?v(s,1):e==="Greeks_Delta"||e==="Greeks_Vega"||e==="Greeks_Theta"?v(s,4):v(s,2),d=[{key:"RSI_14",value:r.RSI_14},{key:"RSI_Slope",value:r.RSI_Slope},{key:"MACD_Hist",value:r.MACD_Hist},{key:"MACD_Slope",value:r.MACD_Slope},{key:"BB_Position",value:r.BB_Position},{key:"Dist_SMA50",value:r.Dist_SMA50},{key:"Vol_Ratio",value:r.Vol_Ratio},{key:"ADX_14",value:r.ADX_14},{key:"ADX_Slope",value:r.ADX_Slope},{key:"ATR_14",value:r.ATR_14},{key:"Stochastic_K",value:r.Stochastic_K},{key:"Stochastic_D",value:r.Stochastic_D}],o=[{key:"Sigma_Distance",value:r.Sigma_Distance},{key:"Greeks_Delta",value:r.Greeks_Delta},{key:"Greeks_Vega",value:r.Greeks_Vega},{key:"Greeks_Theta",value:r.Greeks_Theta}],m=(e,s)=>{const c=y(e.value,e.key),i=s(e.key);return t.jsxs("div",{className:"border-l-4 border-gray-200 pl-3",children:[t.jsxs("div",{className:"flex items-center justify-between mb-1",children:[t.jsxs("span",{className:"text-sm font-medium flex items-center gap-2",children:[t.jsx("span",{className:"text-lg",children:c.emoji}),t.jsxs("span",{className:"flex items-center gap-1",children:[l(e.key),i&&t.jsx(k,{title:i.title,content:i.content,side:"top"})]})]}),t.jsx("span",{className:"text-sm font-semibold",children:e.value!=null?_(e.key,e.value):"-"})]}),t.jsxs("p",{className:"text-xs text-muted-foreground",children:[p(e.key,c.state)," - ",a(e.key,c.state)]})]},e.key)},f={RSI_14:"rsi14",RSI_Slope:"rsiSlope",MACD_Hist:"macdHist",MACD_Slope:"macdSlope",BB_Position:"bbPosition",Dist_SMA50:"distSMA50",Vol_Ratio:"volRatio",ADX_14:"adx14",ADX_Slope:"adxSlope",ATR_14:"atr14",Stochastic_K:"stochasticK",Stochastic_D:"stochasticD"},S={Sigma_Distance:"sigmaDistance",Greeks_Delta:"delta",Greeks_Vega:"vega",Greeks_Theta:"theta"};return t.jsxs(M,{className:`${u(r.ta_probability)}`,children:[t.jsxs(A,{className:"pb-3",children:[t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx(D,{className:"text-lg",children:n("scoredOptions.taBreakdown.title")}),t.jsx("div",{className:`text-3xl font-bold ${g(r.ta_probability)}`,children:w(r.ta_probability,0)})]}),t.jsxs("div",{className:"text-sm text-muted-foreground mt-2",children:[n("scoredOptions.taBreakdown.bucket")," ",t.jsx("span",{className:"font-semibold",children:r.ta_bucket})]})]}),t.jsxs(I,{className:"space-y-4",children:[t.jsxs("div",{className:"space-y-3",children:[t.jsx("div",{className:"text-sm font-semibold text-muted-foreground border-b pb-2",children:n("scoredOptions.taBreakdown.stockLevelIndicators")}),d.map(e=>m(e,s=>{const c=f[s];return c?h.taStockIndicators[c]:null}))]}),t.jsxs("div",{className:"space-y-3",children:[t.jsx("div",{className:"text-sm font-semibold text-muted-foreground border-b pb-2",children:n("scoredOptions.taBreakdown.contractLevelIndicators")}),o.map(e=>m(e,s=>{const c=S[s];return c?h.taContractIndicators[c]:null}))]})]})]})},J=()=>{const[r,n]=b.useState([]),[g,u]=b.useState(!0),[y,l]=b.useState(null),{data:p}=R(),a=d=>{const o=parseFloat(d);return isNaN(o)?null:o};return b.useEffect(()=>{(async()=>{try{u(!0);const o=await fetch("https://raw.githubusercontent.com/datamilo/put-options-se/main/data/current_options_scored.csv");if(!o.ok)throw new Error(`Failed to load CSV: ${o.statusText}`);const f=(await o.text()).trim().split(`
`);if(f.length<2)throw new Error("CSV file is empty or malformed");const S=f[0].split("|").map(s=>s.trim()),e=f.slice(1).map(s=>{const c=s.split("|").map(x=>x.trim()),i=Object.fromEntries(S.map((x,O)=>[x,c[O]])),j=a(i.v21_score),C=a(i.ta_probability),N=a(i.combined_score);return{date:i.date,stock_name:i.stock_name,option_name:i.option_name,strike_price:a(i.strike_price)||0,expiry_date:i.expiry_date,days_to_expiry:parseInt(i.Days_To_Expiry,10),current_probability:a(i.current_probability)||0,v21_score:j,v21_bucket:i.v21_bucket,v21_historical_peak:a(i.v21_historical_peak),v21_support_strength:a(i.v21_support_strength),ta_probability:C,ta_bucket:i.ta_bucket,RSI_14:a(i.RSI_14),RSI_Slope:a(i.RSI_Slope),MACD_Hist:a(i.MACD_Hist),MACD_Slope:a(i.MACD_Slope),BB_Position:a(i.BB_Position),Dist_SMA50:a(i.Dist_SMA50),Vol_Ratio:a(i.Vol_Ratio),ADX_14:a(i.ADX_14),ADX_Slope:a(i.ADX_Slope),ATR_14:a(i.ATR_14),Stochastic_K:a(i.Stochastic_K),Stochastic_D:a(i.Stochastic_D),Sigma_Distance:a(i.Sigma_Distance),Greeks_Delta:a(i.Greeks_Delta),Greeks_Vega:a(i.Greeks_Vega),Greeks_Theta:a(i.Greeks_Theta),models_agree:i.models_agree==="True",agreement_strength:i.agreement_strength,combined_score:N,premium:0}});n(e),l(null)}catch(o){const m=o instanceof Error?o.message:"Unknown error loading CSV";console.error("Error loading scored options CSV:",m),l(m),n([])}finally{u(!1)}})()},[]),{data:b.useMemo(()=>r.length===0||!p||p.length===0?r:(console.log("🔄 Enriching scored options with website premium data...",{scoredOptionsCount:r.length,enrichedDataCount:p.length}),r.map(d=>{const o=p.find(m=>m.OptionName===d.option_name);return o||console.log("⚠️ No enriched data found for option:",d.option_name),{...d,premium:(o==null?void 0:o.Premium)||0,FinancialReport:o==null?void 0:o.FinancialReport,"X-Day":o==null?void 0:o["X-Day"]}})),[r,p]),isLoading:g,error:y}};export{Y as T,q as V,h as s,J as u};
