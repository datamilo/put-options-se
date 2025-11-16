import React, { useMemo, useState } from 'react';
import { useProbabilityRecoveryData } from '@/hooks/useProbabilityRecoveryData';
import { useProbabilityValidationData } from '@/hooks/useProbabilityValidationData';
import { RecoveryComparisonChart } from '@/components/probability/RecoveryComparisonChart';
import { CalibrationChart } from '@/components/probability/CalibrationChart';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export const ProbabilityAnalysis: React.FC = () => {
  const { isLoading: recoveryLoading, error: recoveryError, stocks, chartData, stockChartData } = useProbabilityRecoveryData();
  const { calibrationData, isLoading: validationLoading, error: validationError, getCalibrationPoints } = useProbabilityValidationData();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    calibrationIntro: true,
    recoveryIntro: true,
    practical: false,
    faqs: false
  });

  const isLoading = recoveryLoading || validationLoading;
  const error = recoveryError || validationError;

  const calibrationPoints = useMemo(() => getCalibrationPoints('aggregated'), [getCalibrationPoints]);

  // Get unique stocks for calibration chart filter
  const availableStocks = useMemo(() => {
    const stocks = calibrationData
      .filter(d => d.DataType === 'calibration_by_stock' && d.Stock)
      .map(d => d.Stock);
    return Array.from(new Set(stocks)).sort();
  }, [calibrationData]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading probability analysis data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-destructive">
          <p className="font-semibold">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Probability Analysis</h1>
        <p className="text-base text-muted-foreground">
          Based on analysis of 934,000+ expired options from 2024-2025
        </p>
      </div>

      {/* Executive Overview */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-3">Executive Overview</h3>
          <p className="text-base leading-relaxed mb-3">
            This page provides two complementary analyses to improve your put option writing decisions:
          </p>
          <ul className="space-y-2 text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">1.</span>
              <span><strong>Calibration Analysis:</strong> Validates which probability calculation methods are most accurate by comparing predictions against actual market outcomes.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">2.</span>
              <span><strong>Probability Recovery Analysis:</strong> Identifies recovery opportunities where options previously had high probability levels but have since declined—these statistically expire worthless more often than their current probability suggests.</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Calibration Analysis Section */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold">Calibration Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">Probability Method Accuracy & Validation</p>
        </div>

        {/* Calibration Introduction - Collapsible */}
        <Card>
          <div
            className="p-6 cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-start"
            onClick={() => toggleSection('calibrationIntro')}
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Why This Matters</h3>
              <p className="text-sm text-muted-foreground">
                {expandedSections.calibrationIntro ? 'Click to collapse' : 'Click to expand'}
              </p>
            </div>
            {expandedSections.calibrationIntro ? (
              <ChevronUp className="h-5 w-5 mt-1 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 mt-1 flex-shrink-0" />
            )}
          </div>
          {expandedSections.calibrationIntro && (
            <CardContent className="pt-0 space-y-4">
              <p className="text-base leading-relaxed">
                When you say "this option has an 80% probability of expiring worthless," does that actually mean 80% of similar options expire worthless? Or is the probability systematically too high or too low? The Calibration Analysis answers this critical question.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">The Core Question:</h4>
                <p className="text-sm">Are the probability predictions accurate? This chart measures prediction accuracy by comparing what five different probability calculation methods predicted against what actually happened in the market.</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* How to Read the Calibration Chart */}
        <Card>
          <div
            className="p-6 cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-start"
            onClick={() => toggleSection('calibrationHow')}
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">How to Read the Chart</h3>
              <p className="text-sm text-muted-foreground">
                {expandedSections.calibrationHow ? 'Click to collapse' : 'Click to expand'}
              </p>
            </div>
            {expandedSections.calibrationHow ? (
              <ChevronUp className="h-5 w-5 mt-1 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 mt-1 flex-shrink-0" />
            )}
          </div>
          {expandedSections.calibrationHow && (
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Key Elements:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-3">
                      <span className="text-muted-foreground font-mono">—</span>
                      <span><strong>Black dashed diagonal line:</strong> "Perfect Calibration" - what perfect accuracy looks like</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-muted-foreground font-mono">●●●</span>
                      <span><strong>Colored lines with dots:</strong> Each color represents a different probability calculation method. Larger dots = more data</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-500/10 border border-slate-500/20 rounded-lg p-3 space-y-2">
                  <h4 className="font-semibold text-sm">Interpreting Position Relative to the Line:</h4>
                  <ul className="space-y-1 text-sm">
                    <li><strong>On the diagonal:</strong> Method is perfectly calibrated (predictions match reality)</li>
                    <li><strong>Above the diagonal:</strong> Method is conservative (actual outcomes are better than predicted)</li>
                    <li><strong>Below the diagonal:</strong> Method is overconfident (actual outcomes are worse than predicted)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Understanding the Axes:</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <strong>Horizontal axis (Predicted Probability):</strong> What probability the method predicted (0-100%)
                  </li>
                  <li>
                    <strong>Vertical axis (Actual Rate):</strong> What actually happened in the market (percentage that truly expired worthless)
                  </li>
                  <li className="text-xs text-muted-foreground italic">Example: At 80% predicted probability, if the actual rate was also 80%, that point would be right on the perfect calibration line</li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>

        {/* How to Use the Calibration Chart */}
        <Card>
          <div
            className="p-6 cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-start"
            onClick={() => toggleSection('calibrationUse')}
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">How to Use This Chart</h3>
              <p className="text-sm text-muted-foreground">
                {expandedSections.calibrationUse ? 'Click to collapse' : 'Click to expand'}
              </p>
            </div>
            {expandedSections.calibrationUse ? (
              <ChevronUp className="h-5 w-5 mt-1 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 mt-1 flex-shrink-0" />
            )}
          </div>
          {expandedSections.calibrationUse && (
            <CardContent className="pt-0 space-y-4">
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-green-600 flex-shrink-0">1.</span>
                  <span><strong>Evaluate Overall Accuracy:</strong> Look for which method stays closest to the perfect calibration line (diagonal). This method's predictions can be trusted most accurately.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-600 flex-shrink-0">2.</span>
                  <span><strong>Stock-Specific Analysis:</strong> Use the dropdown menu to analyze calibration for individual stocks. Some stocks may have better calibration than others—identify which stocks have the most reliable probability predictions.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-600 flex-shrink-0">3.</span>
                  <span><strong>Identify Systematic Bias:</strong> If a method consistently curves above the line, it under-predicts risk (conservative). If below, it over-estimates safety (risky). A method tracking the diagonal has no systematic bias.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-600 flex-shrink-0">4.</span>
                  <span><strong>Make Informed Decisions:</strong> Use the most-calibrated method for your trading decisions. If a method shows consistent patterns of over- or under-estimation, adjust your confidence accordingly.</span>
                </li>
              </ol>
            </CardContent>
          )}
        </Card>

        {/* Calibration Chart */}
        <Card>
          <CardContent className="pt-6">
            <CalibrationChart
              calibrationPoints={calibrationPoints}
              availableStocks={availableStocks}
              getCalibrationPoints={getCalibrationPoints}
            />
          </CardContent>
        </Card>
      </div>

      {/* Section Separator */}
      <div className="border-t-2 border-border my-8" />

      {/* Probability Recovery Analysis */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold">Probability Recovery Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">Identifying Statistical Opportunities from Historical Price Action</p>
        </div>

        {/* Recovery Introduction - Collapsible */}
        <Card>
          <div
            className="p-6 cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-start"
            onClick={() => toggleSection('recoveryIntro')}
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Why This Chart Matters</h3>
              <p className="text-sm text-muted-foreground">
                {expandedSections.recoveryIntro ? 'Click to collapse' : 'Click to expand'}
              </p>
            </div>
            {expandedSections.recoveryIntro ? (
              <ChevronUp className="h-5 w-5 mt-1 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 mt-1 flex-shrink-0" />
            )}
          </div>
          {expandedSections.recoveryIntro && (
            <CardContent className="pt-0 space-y-4">
              <p className="text-base leading-relaxed">
                When writing put options, you want to collect premium while minimizing the chance of exercise. Traditional probability calculations tell you "this option has a 70% chance of expiring worthless" based on current market conditions. But history matters more than you might think.
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">The Key Discovery:</h4>
                <p className="text-sm leading-relaxed">
                  Options that previously peaked at very high probability levels (90%+) but then declined actually expire worthless much more frequently than their current probability suggests. This chart visualizes this advantage.
                </p>
                <p className="text-sm italic text-muted-foreground">
                  Example: An option that was at 95% probability two weeks ago, then dropped to 65% today, is likely to be safer than a different option that's currently at 65% but never reached such high levels.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* How to Read the Recovery Chart */}
        <Card>
          <div
            className="p-6 cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-start"
            onClick={() => toggleSection('recoveryHow')}
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">How to Read the Chart</h3>
              <p className="text-sm text-muted-foreground">
                {expandedSections.recoveryHow ? 'Click to collapse' : 'Click to expand'}
              </p>
            </div>
            {expandedSections.recoveryHow ? (
              <ChevronUp className="h-5 w-5 mt-1 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 mt-1 flex-shrink-0" />
            )}
          </div>
          {expandedSections.recoveryHow && (
            <CardContent className="pt-0 space-y-4">
              <p className="text-base leading-relaxed">
                The chart displays two bars for comparison across different days-to-expiry buckets:
              </p>
              <div className="space-y-3">
                <div className="border-l-4 border-green-600 bg-green-500/5 p-3 rounded">
                  <h4 className="font-semibold text-sm mb-1">Green Bars (Recovery Candidates)</h4>
                  <p className="text-sm">Options that previously reached your selected probability threshold (e.g., 80%, 90%) but have since dropped to lower levels</p>
                </div>
                <div className="border-l-4 border-red-600 bg-red-500/5 p-3 rounded">
                  <h4 className="font-semibold text-sm mb-1">Red Bars (Baseline)</h4>
                  <p className="text-sm">Options that never reached the threshold you selected (control group for comparison)</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <h4 className="font-semibold">Chart Axes:</h4>
                <ul className="space-y-2">
                  <li>
                    <strong>Vertical axis (Worthless Rate):</strong> The percentage of options that expired worthless (stock stayed above the strike price for puts)
                  </li>
                  <li>
                    <strong>Horizontal axis (Days to Expiry):</strong> Organized in time ranges (e.g., 0-14 days, 15-25 days, 36+ days)
                  </li>
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm"><strong>Interpreting Results:</strong> If the green bar is significantly higher than the red bar, recovery candidates are substantially safer. The difference tells you exactly how much safer these options are.</p>
                <p className="text-xs text-muted-foreground mt-2 italic">Example: Recovery Candidates at 85% worthless vs. Baseline at 60% = a 25 percentage point advantage</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* How to Use the Recovery Chart */}
        <Card>
          <div
            className="p-6 cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-start"
            onClick={() => toggleSection('recoveryUse')}
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">How to Use This Chart</h3>
              <p className="text-sm text-muted-foreground">
                {expandedSections.recoveryUse ? 'Click to collapse' : 'Click to expand'}
              </p>
            </div>
            {expandedSections.recoveryUse ? (
              <ChevronUp className="h-5 w-5 mt-1 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 mt-1 flex-shrink-0" />
            )}
          </div>
          {expandedSections.recoveryUse && (
            <CardContent className="pt-0 space-y-4">
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-green-600 flex-shrink-0">1.</span>
                  <div>
                    <strong>Select Your Strategy Parameters:</strong>
                    <ul className="mt-2 ml-4 space-y-1 text-xs">
                      <li>• Choose a Historical Peak Threshold (80%, 85%, 90%, or 95%)</li>
                      <li>• Choose a Probability Method that matches your pricing approach</li>
                      <li>• Select your target Current Probability range (60-70%, 70-80%, etc.)</li>
                      <li>• Optionally filter by specific stock to see individual stock performance</li>
                    </ul>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-600 flex-shrink-0">2.</span>
                  <span><strong>Monitor Probability Peaks:</strong> Keep historical records of the highest probability each option has reached during its life</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-600 flex-shrink-0">3.</span>
                  <span><strong>Write on the Dip:</strong> When a 90%+ probability option drops to 60-70%, consider writing it—it's statistically much safer than a typical 60-70% option</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-600 flex-shrink-0">4.</span>
                  <span><strong>Focus on Time Horizon:</strong> The recovery advantage tends to be strongest with 36+ calendar days to expiration</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-600 flex-shrink-0">5.</span>
                  <span><strong>Use Stock Filtering:</strong> Identify which stocks show the strongest recovery candidate effect</span>
                </li>
              </ol>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-sm mb-2">Strongest Results:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 36+ days to expiry with current probability of 60-70%</li>
                  <li>• Historical peak at 90%+</li>
                  <li>• Advantage: Often 20-40 percentage points higher worthless rate</li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Recovery Advantage Analysis Chart */}
        <Card>
          <CardContent className="pt-6">
            <RecoveryComparisonChart stocks={stocks} chartData={chartData} stockChartData={stockChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Practical Trading Recommendations */}
      <Card>
        <div
          className="p-6 cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-start"
          onClick={() => toggleSection('practical')}
        >
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Practical Trading Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              {expandedSections.practical ? 'Click to collapse' : 'Click to expand'}
            </p>
          </div>
          {expandedSections.practical ? (
            <ChevronUp className="h-5 w-5 mt-1 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 mt-1 flex-shrink-0" />
          )}
        </div>
        {expandedSections.practical && (
          <CardContent className="pt-0 space-y-6">
            <div>
              <h4 className="font-semibold mb-3">For Put Option Writing</h4>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                  <span><strong>Use the Winner Method:</strong> The calibration analysis identifies which probability method is most accurate. Use that method for position sizing decisions.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                  <span><strong>Combine Both Insights:</strong> Check calibration accuracy first (validation report), then look for recovery candidates (probability recovery report). Write options that are both accurate in probability AND have positive historical bias.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                  <div>
                    <strong>Time Horizon Strategy:</strong>
                    <ul className="mt-2 ml-4 space-y-1 text-xs">
                      <li>• 36+ days to expiry: Recovery candidates show strongest advantage</li>
                      <li>• 15-35 days: Still positive advantage, moderate</li>
                      <li>• Under 15 days: Advantage decreases but still present</li>
                    </ul>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
                  <span><strong>Stock Selection:</strong> Use stock filtering to find which stocks have the best recovery candidate advantage AND best probability calibration.</span>
                </li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Risk Management</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-3">
                  <span className="text-amber-600 font-bold flex-shrink-0">⚠</span>
                  <span><strong>Never rely solely on probability:</strong> Always use appropriate position sizing</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-amber-600 font-bold flex-shrink-0">⚠</span>
                  <span><strong>Account for tail risk:</strong> Historical backtests don't capture unprecedented market events</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-amber-600 font-bold flex-shrink-0">⚠</span>
                  <span><strong>Monitor portfolio Greeks:</strong> Don't just watch the probability percentage</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-amber-600 font-bold flex-shrink-0">⚠</span>
                  <span><strong>Diversify:</strong> Spread positions across different stocks and time horizons</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-amber-600 font-bold flex-shrink-0">⚠</span>
                  <span><strong>Review regularly:</strong> Market conditions change, so validate assumptions periodically</span>
                </li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* FAQs */}
      <Card>
        <div
          className="p-6 cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-start"
          onClick={() => toggleSection('faqs')}
        >
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Frequently Asked Questions</h3>
            <p className="text-sm text-muted-foreground">
              {expandedSections.faqs ? 'Click to collapse' : 'Click to expand'}
            </p>
          </div>
          {expandedSections.faqs ? (
            <ChevronUp className="h-5 w-5 mt-1 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 mt-1 flex-shrink-0" />
          )}
        </div>
        {expandedSections.faqs && (
          <CardContent className="pt-0 space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Q: What are "calendar days" vs. "business days"?</h4>
              <p className="text-sm text-muted-foreground">
                Calendar days count every day (7 per week). Business days only count weekdays (5 per week). Our analysis uses calendar days, which is more consistent for options that expire on specific calendar dates.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">Q: Why do recovery candidates perform better?</h4>
              <p className="text-sm text-muted-foreground">
                When an option drops from 90% to 70% probability, market conditions haven't fundamentally changed—something external did. Options that have repeatedly proved safe (reaching 90%+) then dipped tend to prove safe again. This is a mean-reversion phenomenon in options pricing.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">Q: Should I only trade recovery candidates?</h4>
              <p className="text-sm text-muted-foreground">
                Recovery candidates show a statistical advantage, but sample sizes vary by scenario, the advantage diminishes with shorter time horizons, and market conditions can change. Use it as one factor among many in your decision-making.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">Q: How often should I rerun these analyses?</h4>
              <p className="text-sm text-muted-foreground">
                We recommend: Monthly review of calibration to ensure methods remain accurate; Quarterly updates to recovery candidate analysis with new expired options; Continuous monitoring for major market regime changes.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">Q: Can I use these probabilities for other options strategies?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, the calibration analysis applies to any strategy using probability predictions. However, call options may have different calibration patterns, different strike selections may show different results, and you should always validate with your specific strategy parameters.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">Q: What does an Expected Calibration Error of 0.32% mean?</h4>
              <p className="text-sm text-muted-foreground">
                It means predictions are off by only 0.32 percentage points on average. This is exceptional—most probability models have errors of 2-5%. A well-calibrated model means you can trust the probabilities for consistent trading.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Summary */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-3">Key Takeaway</h3>
          <p className="text-base leading-relaxed">
            These two charts provide complementary insights: The <strong>Calibration Chart</strong> shows you which probability prediction methods are most reliable, and the <strong>Recovery Analysis Chart</strong> shows you which options are statistically safer based on their price history. Together, they give you confidence in both <strong>how to price it</strong> (calibrated probabilities) and <strong>what to trade</strong> (recovery candidates). For the most confident trades, look for options that satisfy both criteria: good recovery candidate advantage AND accurate probability calibration.
          </p>
          <p className="text-sm text-muted-foreground mt-4 italic">
            Remember: Past performance does not guarantee future results. Always use appropriate position sizing and risk management.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
