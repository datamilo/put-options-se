export interface FieldInfo {
  name: string;
  category: string;
  whatItIs: string;
  whyItMatters: string;
  example?: string;
  unit?: string;
}

export const fieldInfoMap: Record<string, FieldInfo> = {
  // Identification Fields
  OptionName: {
    name: "Option Name",
    category: "Identification",
    whatItIs: "Unique code identifying this specific put option contract",
    whyItMatters: "Use this to place orders or track specific options",
    example: "ERICB6U45 (Ericsson B-share, expiry code 6U, strike 45 SEK)",
  },
  StockName: {
    name: "Stock Name",
    category: "Identification",
    whatItIs: "Company name (Swedish convention)",
    whyItMatters: "Identifies which stock you're protecting",
    example: "ERIC B for Ericsson B-shares",
  },
  ExpiryDate: {
    name: "Expiry Date",
    category: "Identification",
    whatItIs: "Last day the option is valid",
    whyItMatters: "After this date, option expires. Earlier dates = less time = lower premiums but faster profit",
    unit: "YYYY-MM-DD",
  },
  FinancialReport: {
    name: "Financial Report",
    category: "Identification",
    whatItIs: "'Y' if company releases quarterly/annual report before expiry",
    whyItMatters: "Reports can cause big price swings. 'Y' means higher risk but potentially higher reward",
  },
  "X-Day": {
    name: "X-Day",
    category: "Identification",
    whatItIs: "'Y' if ex-dividend date falls before expiry",
    whyItMatters: "Stock price drops by dividend amount on ex-dividend date. Our calculations already adjust for this",
  },

  // Pricing Fields
  Premium: {
    name: "Premium",
    category: "Pricing",
    whatItIs: "Total money you receive for selling this put option position",
    whyItMatters: "This is your profit if stock stays above strike price",
    unit: "SEK (for ~100,000 SEK position)",
    example: "5,000 SEK means you get 5,000 SEK immediately",
  },
  Bid_Ask_Mid_Price: {
    name: "Bid-Ask Mid Price",
    category: "Pricing",
    whatItIs: "Average between what buyers offer (bid) and what sellers ask",
    whyItMatters: "Fair market price for one option. Used to calculate Premium field",
    unit: "SEK per option contract (1 contract = 100 shares)",
  },
  Option_Price_Min: {
    name: "Option Price Min",
    category: "Pricing",
    whatItIs: "Minimum price per option to break even (accounting for transaction costs)",
    whyItMatters: "Only sell if market price is above this break-even point",
    unit: "SEK per option",
  },
  NumberOfContractsBasedOnLimit: {
    name: "Number of Contracts",
    category: "Pricing",
    whatItIs: "How many option contracts you'd sell for a 100,000 SEK position",
    whyItMatters: "All loss/premium calculations assume this position size",
  },
  Bid: {
    name: "Bid",
    category: "Pricing",
    whatItIs: "Highest price buyers are offering right now",
    whyItMatters: "You can sell immediately at this price (real market price)",
    unit: "SEK per option",
  },
  Ask: {
    name: "Ask",
    category: "Pricing",
    whatItIs: "Lowest price sellers are offering right now",
    whyItMatters: "Shows other side of market. Gap between Bid and Ask shows liquidity",
    unit: "SEK per option",
  },
  AskBidSpread: {
    name: "Ask-Bid Spread",
    category: "Pricing",
    whatItIs: "Difference between Ask and Bid prices",
    whyItMatters: "Narrow spread (<1 SEK) = liquid, easy to trade. Wide spread (>5 SEK) = harder to get fair price",
    unit: "SEK",
  },

  // Probability Fields
  "1_2_3_ProbOfWorthless_Weighted": {
    name: "Weighted Probability",
    category: "Probability",
    whatItIs: "Main probability estimate - combines 3 methods (Black-Scholes, Calibrated, Historical)",
    whyItMatters: "Use this as your primary probability estimate. Higher is safer but lower premium",
    unit: "0.0 to 1.0 (0% to 100%)",
    example: "0.85 = 85% chance you keep the premium",
  },
  "1_ProbOfWorthless_Original": {
    name: "Black-Scholes Probability",
    category: "Probability",
    whatItIs: "Black-Scholes mathematical model probability",
    whyItMatters: "Pure mathematical calculation. Part of weighted probability but may over/underestimate",
    unit: "0.0 to 1.0",
  },
  "2_ProbOfWorthless_Calibrated": {
    name: "Calibrated Probability",
    category: "Probability",
    whatItIs: "Black-Scholes adjusted with historical accuracy for this stock",
    whyItMatters: "Corrects for consistent over/underestimation. More accurate than raw Black-Scholes",
    unit: "0.0 to 1.0",
  },
  "3_ProbOfWorthless_Historical_IV": {
    name: "Historical IV Probability",
    category: "Probability",
    whatItIs: "Probability based on how accurate implied volatility has been historically",
    whyItMatters: "Uses real market data to estimate probability",
    unit: "0.0 to 1.0",
  },
  ProbWorthless_Bayesian_IsoCal: {
    name: "Bayesian Probability",
    category: "Probability",
    whatItIs: "Sophisticated statistical adjustment based on similar past options",
    whyItMatters: "Groups similar options (by probability bucket and time to expiry) and learns from outcomes",
    unit: "0.0 to 1.0",
  },
  PoW_Simulation_Mean_Earnings: {
    name: "Simulation Mean Earnings",
    category: "Probability",
    whatItIs: "Average profit/loss from 1,000 Monte Carlo simulations",
    whyItMatters: "Simulated long-term average outcome. Positive = profitable strategy over many trades",
    unit: "SEK",
  },
  PoW_Stats_MedianLossPct: {
    name: "Median Loss %",
    category: "Probability",
    whatItIs: "Typical loss percentage when things go wrong (historical high-probability options)",
    whyItMatters: "Shows what actually happened to similar options in the past",
    unit: "Percentage",
  },
  PoW_Stats_WorstLossPct: {
    name: "Worst Loss %",
    category: "Probability",
    whatItIs: "Worst historical loss percentage (from similar high-probability options)",
    whyItMatters: "Reality check on worst-case scenarios",
    unit: "Percentage",
  },
  PoW_Stats_MedianLoss: {
    name: "Median Loss",
    category: "Probability",
    whatItIs: "Typical loss amount when things go wrong",
    whyItMatters: "Historical reality check in SEK",
    unit: "SEK",
  },
  PoW_Stats_WorstLoss: {
    name: "Worst Loss",
    category: "Probability",
    whatItIs: "Worst historical loss amount",
    whyItMatters: "Shows maximum pain in SEK from similar past options",
    unit: "SEK",
  },
  PoW_Stats_MedianProbOfWorthless: {
    name: "Median Probability",
    category: "Probability",
    whatItIs: "Typical probability value in this historical group",
    whyItMatters: "Reference point for similar options",
    unit: "0.0 to 1.0",
  },
  PoW_Stats_MinProbOfWorthless: {
    name: "Min Probability",
    category: "Probability",
    whatItIs: "Lowest probability in historical group",
    whyItMatters: "Shows range of similar options",
    unit: "0.0 to 1.0",
  },
  PoW_Stats_MaxProbOfWorthless: {
    name: "Max Probability",
    category: "Probability",
    whatItIs: "Highest probability in historical group",
    whyItMatters: "Shows range of similar options",
    unit: "0.0 to 1.0",
  },

  // Risk Protection Fields
  Lower_Bound_at_Accuracy: {
    name: "Lower Bound (80% Accuracy)",
    category: "Risk Protection",
    whatItIs: "Stock price level with 80% historical accuracy",
    whyItMatters: "Strike price below this = extra safety margin. Key risk metric",
    unit: "SEK",
    example: "If stock is 100 SEK and lower bound is 85 SEK, stock can drop 15% before reaching this level",
  },
  Lower_Bound_HistMedianIV_at_Accuracy: {
    name: "Lower Bound (Historical Median IV)",
    category: "Risk Protection",
    whatItIs: "Lower bound using historical median implied volatility (at 80% accuracy)",
    whyItMatters: "Alternative calculation using longer-term volatility average. More conservative estimate",
    unit: "SEK",
  },
  Lower_Bound: {
    name: "Lower Bound",
    category: "Risk Protection",
    whatItIs: "Basic lower bound calculation using current implied volatility",
    whyItMatters: "Simplest estimate. Compare with other lower bounds for full picture",
    unit: "SEK",
  },
  Lower_Bound_HistMedianIV: {
    name: "Lower Bound (Hist Median)",
    category: "Risk Protection",
    whatItIs: "Lower bound using historical median IV (without accuracy adjustment)",
    whyItMatters: "Shows typical volatility range without accuracy weighting",
    unit: "SEK",
  },
  ExpiryDate_Lower_Bound_Minus_Pct_Based_on_Accuracy: {
    name: "Lower Bound Adjustment %",
    category: "Risk Protection",
    whatItIs: "Percentage adjustment used in lower bound calculations",
    whyItMatters: "Technical field showing how much volatility buffer is applied",
    unit: "Decimal (0.35 = 35%)",
  },
  StrikeBelowLowerAtAcc: {
    name: "Strike Below Lower Bound",
    category: "Risk Protection",
    whatItIs: "'Y' if strike price is below Lower_Bound_at_Accuracy AND spread is reasonable (≤10 SEK)",
    whyItMatters: "Quick safety filter. 'Y' = extra protection against losses. Good for conservative strategies",
  },

  // Loss Scenario Fields
  LossAtBadDecline: {
    name: "Loss at Bad Decline",
    category: "Loss Scenarios",
    whatItIs: "Your loss if stock experiences a 'bad' historical decline (around 10th-20th worst)",
    whyItMatters: "Realistic worst-case for typical market stress. Not catastrophic, but uncomfortable",
    unit: "SEK (negative = loss)",
    example: "-15,000 = you lose 15,000 SEK",
  },
  LossAtWorstDecline: {
    name: "Loss at Worst Decline",
    category: "Loss Scenarios",
    whatItIs: "Your loss if stock experiences its single worst historical decline",
    whyItMatters: "Absolute worst case seen in this stock's history. Very rare but possible",
    unit: "SEK (negative = loss)",
  },
  LossAt100DayWorstDecline: {
    name: "Loss at 100-Day Worst",
    category: "Loss Scenarios",
    whatItIs: "Loss if stock drops like its worst 100-day period ever",
    whyItMatters: "Time-matched risk (if option has ~100 days, shows relevant historical comparison)",
    unit: "SEK (negative = loss)",
  },
  LossAt_2008_100DayWorstDecline: {
    name: "Loss at 2008 (100-Day)",
    category: "Loss Scenarios",
    whatItIs: "Loss if stock drops like it did during 2008 financial crisis (100-day window)",
    whyItMatters: "Stress test against global financial crisis. Extreme but has happened",
    unit: "SEK (negative = loss)",
  },
  LossAt50DayWorstDecline: {
    name: "Loss at 50-Day Worst",
    category: "Loss Scenarios",
    whatItIs: "Loss if stock drops like its worst 50-day period ever",
    whyItMatters: "For shorter-term options (~50 days to expiry)",
    unit: "SEK (negative = loss)",
  },
  LossAt_2008_50DayWorstDecline: {
    name: "Loss at 2008 (50-Day)",
    category: "Loss Scenarios",
    whatItIs: "Loss if stock drops like it did during 2008 crisis (50-day window)",
    whyItMatters: "Shorter-term 2008 crisis stress test",
    unit: "SEK (negative = loss)",
  },
  Loss_Least_Bad: {
    name: "Least Bad Loss",
    category: "Loss Scenarios",
    whatItIs: "The smallest loss among Bad, Worst, and 100Day scenarios",
    whyItMatters: "Most optimistic of the realistic bad scenarios",
    unit: "SEK (negative = loss)",
  },
  WorstHistoricalDecline: {
    name: "Worst Historical Decline",
    category: "Loss Scenarios",
    whatItIs: "Percentage the stock dropped during its worst historical period",
    whyItMatters: "Shows the stock's maximum pain point",
    unit: "Decimal (0.45 = 45% decline)",
  },
  BadHistoricalDecline: {
    name: "Bad Historical Decline",
    category: "Loss Scenarios",
    whatItIs: "Percentage the stock dropped during 'bad' historical period",
    whyItMatters: "Typical significant decline for this stock",
    unit: "Decimal (0.25 = 25% decline)",
  },
  "100DayMaxPrice": {
    name: "100-Day Max Price",
    category: "Loss Scenarios",
    whatItIs: "Highest stock price in last 100 days",
    whyItMatters: "Shows recent peak. Current price vs this = how much stock has already fallen",
    unit: "SEK",
  },
  "100DayMaxPriceDate": {
    name: "100-Day Max Price Date",
    category: "Loss Scenarios",
    whatItIs: "Date when stock hit its 100-day maximum",
    whyItMatters: "Recent peak timing. If yesterday = near highs, if 95 days ago = already declined",
    unit: "YYYY-MM-DD",
  },
  "50DayMaxPrice": {
    name: "50-Day Max Price",
    category: "Loss Scenarios",
    whatItIs: "Highest stock price in last 50 days",
    whyItMatters: "Shorter-term peak reference",
    unit: "SEK",
  },
  "50DayMaxPriceDate": {
    name: "50-Day Max Price Date",
    category: "Loss Scenarios",
    whatItIs: "Date when stock hit its 50-day maximum",
    whyItMatters: "Recent trend indicator",
    unit: "YYYY-MM-DD",
  },
  Historical100DaysWorstDecline: {
    name: "Historical 100-Day Worst",
    category: "Loss Scenarios",
    whatItIs: "Worst decline percentage over any 100-day period in stock's history",
    whyItMatters: "Historical volatility reference for 100-day timeframe",
    unit: "Decimal (negative, e.g., -0.45 = -45%)",
  },
  Historical50DaysWorstDecline: {
    name: "Historical 50-Day Worst",
    category: "Loss Scenarios",
    whatItIs: "Worst decline percentage over any 50-day period in stock's history",
    whyItMatters: "Historical volatility reference for 50-day timeframe",
    unit: "Decimal (negative)",
  },
  "2008_100DaysWorstDecline": {
    name: "2008 100-Day Worst",
    category: "Loss Scenarios",
    whatItIs: "Worst 100-day decline during 2008 financial crisis",
    whyItMatters: "Crisis benchmark for 100-day timeframe",
    unit: "Decimal (negative)",
  },
  "2008_50DaysWorstDecline": {
    name: "2008 50-Day Worst",
    category: "Loss Scenarios",
    whatItIs: "Worst 50-day decline during 2008 financial crisis",
    whyItMatters: "Crisis benchmark for 50-day timeframe",
    unit: "Decimal (negative)",
  },

  // Profit Ratios
  ProfitLossPctLeastBad: {
    name: "Profit/Loss % (Least Bad)",
    category: "Profit Ratios",
    whatItIs: "Premium ÷ Loss_Least_Bad (smallest of the bad scenarios)",
    whyItMatters: "Risk/reward ratio for most optimistic bad scenario. Higher = better payoff",
    unit: "Ratio",
    example: "0.25 = premium is 25% of potential loss",
  },
  ProfitLossPctBad: {
    name: "Profit/Loss % (Bad)",
    category: "Profit Ratios",
    whatItIs: "Premium ÷ LossAtBadDecline",
    whyItMatters: "Typical bad scenario risk/reward",
    unit: "Ratio",
    example: "0.20 = you get 20% of potential loss as premium",
  },
  ProfitLossPctWorst: {
    name: "Profit/Loss % (Worst)",
    category: "Profit Ratios",
    whatItIs: "Premium ÷ LossAtWorstDecline",
    whyItMatters: "Absolute worst-case risk/reward. Very low = scary losses possible",
    unit: "Ratio",
    example: "0.10 = premium is 10% of worst-case loss",
  },
  ProfitLossPct100DayWorst: {
    name: "Profit/Loss % (100-Day)",
    category: "Profit Ratios",
    whatItIs: "Premium ÷ LossAt100DayWorstDecline",
    whyItMatters: "Time-matched risk/reward for 100-day scenarios",
    unit: "Ratio",
  },

  // Volatility Fields
  ImpliedVolatility: {
    name: "Implied Volatility",
    category: "Volatility",
    whatItIs: "Market's expectation of future stock volatility (annualized)",
    whyItMatters: "Key pricing input. Higher IV = higher premiums but more risk",
    unit: "Decimal (0.30 = 30%)",
    example: "0.30 means market expects stock to move ±30% over a year",
  },
  ImpliedVolatilityUntilExpiry: {
    name: "IV Until Expiry",
    category: "Volatility",
    whatItIs: "ImpliedVolatility scaled to actual time until expiry",
    whyItMatters: "More accurate volatility for shorter time periods",
    unit: "Decimal",
  },
  TodayStockMedianIV_Maximum100DaysToExp: {
    name: "Today's Median IV",
    category: "Volatility",
    whatItIs: "Today's median implied volatility across all options for this stock (≤100 days to expiry)",
    whyItMatters: "Shows today's overall volatility level for this stock",
    unit: "Decimal",
  },
  AllMedianIV_Maximum100DaysToExp: {
    name: "Historical Median IV",
    category: "Volatility",
    whatItIs: "Historical median implied volatility for this stock (all-time, ≤100 days to expiry)",
    whyItMatters: "Baseline volatility. Current IV above this = elevated premiums",
    unit: "Decimal",
  },
  IV_AllMedianIV_Maximum100DaysToExp_Ratio: {
    name: "IV Ratio",
    category: "Volatility",
    whatItIs: "Current IV ÷ Historical median IV",
    whyItMatters: "Volatility indicator. >1.2 = high volatility (good premiums), <0.8 = low volatility (poor premiums)",
    unit: "Ratio",
    example: "1.5 = current volatility is 50% higher than usual",
  },

  // Position Sizing
  StockPrice: {
    name: "Stock Price",
    category: "Position Sizing",
    whatItIs: "Current stock price (adjusted for dividends if X-Day = 'Y')",
    whyItMatters: "Reference price for strike comparison and lower bounds",
    unit: "SEK",
  },
  StrikePrice: {
    name: "Strike Price",
    category: "Position Sizing",
    whatItIs: "Price at which you must buy the stock if option is exercised",
    whyItMatters: "Key decision point. Stock must fall below strike before you lose money",
    unit: "SEK",
    example: "Strike = 100 SEK means you buy stock at 100 if it falls below that",
  },
  Underlying_Value: {
    name: "Underlying Value",
    category: "Position Sizing",
    whatItIs: "Total value of stocks you'd have to buy if exercised",
    whyItMatters: "Shows capital requirement if you get assigned",
    unit: "SEK",
    example: "StrikePrice × NumberOfContracts × 100",
  },
  StockPrice_After_2008_100DayWorstDecline: {
    name: "Stock Price After 2008 (100-Day)",
    category: "Position Sizing",
    whatItIs: "Where stock would be after a 2008-style 100-day crash",
    whyItMatters: "Concrete price level for worst-case scenario",
    unit: "SEK",
  },
  StockPrice_After_100DayWorstDecline: {
    name: "Stock Price After 100-Day Worst",
    category: "Position Sizing",
    whatItIs: "Where stock would be after its worst historical 100-day decline",
    whyItMatters: "Historical worst-case price level",
    unit: "SEK",
  },
  StockPrice_After_50DayWorstDecline: {
    name: "Stock Price After 50-Day Worst",
    category: "Position Sizing",
    whatItIs: "Where stock would be after its worst historical 50-day decline",
    whyItMatters: "Shorter-term worst-case price level",
    unit: "SEK",
  },
  StockPrice_After_2008_50DayWorstDecline: {
    name: "Stock Price After 2008 (50-Day)",
    category: "Position Sizing",
    whatItIs: "Where stock would be after a 2008-style 50-day crash",
    whyItMatters: "Shorter-term 2008 crisis price level",
    unit: "SEK",
  },

  // Timing Fields
  DaysToExpiry: {
    name: "Days to Expiry",
    category: "Timing",
    whatItIs: "Calendar days until option expires",
    whyItMatters: "More days = more premium but more time for things to go wrong. Sweet spot often 30-90 days",
    unit: "Days",
  },
  Mean_Accuracy: {
    name: "Mean Accuracy",
    category: "Timing",
    whatItIs: "Historical accuracy of implied volatility predictions for this stock/timeframe",
    whyItMatters: "Confidence indicator. Higher = more reliable probability estimates",
    unit: "0.0 to 1.0 (0% to 100%)",
    example: "0.80 = implied volatility was accurate 80% of the time historically",
  },
  "100k_Invested_Loss_Mean": {
    name: "100k Invested Loss Mean",
    category: "Timing",
    whatItIs: "Average loss for 100k SEK positions with similar probability/expiry, based on historical outcomes",
    whyItMatters: "Real-world results from similar past trades. Reality check on your estimates",
    unit: "SEK",
  },
};

export const getFieldInfo = (fieldName: string): FieldInfo | undefined => {
  return fieldInfoMap[fieldName];
};

export const getAllCategories = (): string[] => {
  const categories = new Set<string>();
  Object.values(fieldInfoMap).forEach((info) => categories.add(info.category));
  return Array.from(categories);
};
