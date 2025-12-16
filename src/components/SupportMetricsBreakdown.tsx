import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupportLevelMetric } from '@/hooks/useSupportLevelMetrics';
import { Progress } from '@/components/ui/progress';

interface SupportMetricsBreakdownProps {
  metrics: SupportLevelMetric;
  rollingPeriod: number;
}

export const SupportMetricsBreakdown: React.FC<SupportMetricsBreakdownProps> = ({ metrics, rollingPeriod }) => {
  // Calculate Support Strength Score components
  // Based on the formula from documentation:
  // - Support Stability: 30% weight
  // - Days Since Last Break (normalized): 25% weight
  // - Break Frequency (trading days per break): 25% weight
  // - Drop Consistency (inverse of std deviation): 20% weight

  const stabilityComponent = (metrics.support_stability_pct / 100) * 30;

  // Normalize days since break (cap at 365 days = 100%)
  const daysSinceBreak = metrics.days_since_last_break ?? 365;
  const normalizedDaysSinceBreak = Math.min(daysSinceBreak / 365, 1) * 100;
  const daysSinceBreakComponent = (normalizedDaysSinceBreak / 100) * 25;

  // Break frequency - higher trading days per break is better
  // Normalize: assume 200 trading days per break is excellent (100%)
  const normalizedFrequency = Math.min(metrics.trading_days_per_break / 200, 1) * 100;
  const frequencyComponent = (normalizedFrequency / 100) * 25;

  // Drop consistency - inverse of std deviation (lower std dev is better)
  // Normalize: 0% std dev = 100%, 5%+ std dev = 0%
  const normalizedConsistency = Math.max(0, (5 - metrics.drop_std_dev_pct) / 5) * 100;
  const consistencyComponent = (normalizedConsistency / 100) * 20;

  const calculatedTotal = stabilityComponent + daysSinceBreakComponent + frequencyComponent + consistencyComponent;

  // Pattern classification logic
  const getPatternClassificationReason = (): { rule: string; condition: string; met: boolean }[] => {
    const rules = [
      {
        rule: 'never_breaks',
        condition: 'Stability ≥ 99.5%',
        met: metrics.support_stability_pct >= 99.5,
        value: `${metrics.support_stability_pct.toFixed(2)}%`
      },
      {
        rule: 'exhausted_cascade',
        condition: 'Current Consecutive ≥ 80% of Max',
        met: metrics.current_consecutive_breaks >= (metrics.max_consecutive_breaks * 0.8),
        value: `${metrics.current_consecutive_breaks} ≥ ${(metrics.max_consecutive_breaks * 0.8).toFixed(1)}`
      },
      {
        rule: 'shallow_breaker',
        condition: 'Median Drop < 2%',
        met: (metrics.median_drop_per_break_pct ?? 0) > -2 && (metrics.median_drop_per_break_pct ?? 0) < 0,
        value: `${(metrics.median_drop_per_break_pct ?? 0).toFixed(2)}%`
      },
      {
        rule: 'volatile',
        condition: 'Stability < 70% AND Median Drop < -5%',
        met: metrics.support_stability_pct < 70 && (metrics.median_drop_per_break_pct ?? 0) < -5,
        value: `Stability: ${metrics.support_stability_pct.toFixed(1)}%, Drop: ${(metrics.median_drop_per_break_pct ?? 0).toFixed(2)}%`
      },
      {
        rule: 'stable',
        condition: 'Stability ≥ 85% AND Total Breaks < 10',
        met: metrics.support_stability_pct >= 85 && metrics.total_breaks < 10,
        value: `Stability: ${metrics.support_stability_pct.toFixed(1)}%, Breaks: ${metrics.total_breaks}`
      },
      {
        rule: 'predictable_cycles',
        condition: 'Default (none of above met)',
        met: true,
        value: 'Falls through to default'
      }
    ];

    return rules;
  };

  const patternRules = getPatternClassificationReason();
  const matchedRule = patternRules.find(r => r.met && r.rule === metrics.pattern_type);

  // Trend calculation breakdown
  const getTrendBreakdown = () => {
    // The trend compares first half vs second half stability
    // "improving" = second half stability > first half + 5%
    // "weakening" = second half stability < first half - 5%
    // "stable" = within 5% range

    // We don't have the raw first/second half data, but we can show what the trend means
    if (metrics.stability_trend === 'improving') {
      return {
        description: 'Second half stability exceeds first half by >5%',
        meaning: 'Support is strengthening recently',
        visual: 'upward'
      };
    } else if (metrics.stability_trend === 'weakening') {
      return {
        description: 'Second half stability is >5% lower than first half',
        meaning: 'Support is deteriorating recently',
        visual: 'downward'
      };
    } else {
      return {
        description: 'Second half stability within ±5% of first half',
        meaning: 'Support behavior is consistent',
        visual: 'flat'
      };
    }
  };

  const trendInfo = getTrendBreakdown();

  return (
    <div className="bg-muted/30 p-6 space-y-6">
      {/* Support Strength Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Support Strength Score: {metrics.support_strength_score.toFixed(1)}/100</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* Component 1: Stability */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">1. Support Stability (30% weight)</span>
                <span className="text-muted-foreground">
                  {metrics.support_stability_pct.toFixed(2)}% × 0.30 = {stabilityComponent.toFixed(2)}
                </span>
              </div>
              <Progress value={stabilityComponent / 30 * 100} className="h-2" />
            </div>

            {/* Component 2: Days Since Break */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">2. Days Since Break (25% weight)</span>
                <span className="text-muted-foreground">
                  {daysSinceBreak}d → {normalizedDaysSinceBreak.toFixed(1)}% × 0.25 = {daysSinceBreakComponent.toFixed(2)}
                </span>
              </div>
              <Progress value={daysSinceBreakComponent / 25 * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Normalized: {daysSinceBreak} days ÷ 365 max = {normalizedDaysSinceBreak.toFixed(1)}%
              </p>
            </div>

            {/* Component 3: Break Frequency */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">3. Break Frequency (25% weight)</span>
                <span className="text-muted-foreground">
                  {metrics.trading_days_per_break.toFixed(1)} days/break → {normalizedFrequency.toFixed(1)}% × 0.25 = {frequencyComponent.toFixed(2)}
                </span>
              </div>
              <Progress value={frequencyComponent / 25 * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Normalized: {metrics.trading_days_per_break.toFixed(1)} ÷ 200 target = {normalizedFrequency.toFixed(1)}%
              </p>
            </div>

            {/* Component 4: Drop Consistency */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">4. Drop Consistency (20% weight)</span>
                <span className="text-muted-foreground">
                  StdDev {metrics.drop_std_dev_pct.toFixed(2)}% → {normalizedConsistency.toFixed(1)}% × 0.20 = {consistencyComponent.toFixed(2)}
                </span>
              </div>
              <Progress value={consistencyComponent / 20 * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Normalized: (5% - {metrics.drop_std_dev_pct.toFixed(2)}%) ÷ 5% = {normalizedConsistency.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between font-semibold">
              <span>Total Calculated Score:</span>
              <span>{calculatedTotal.toFixed(2)}/100</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Actual Score from Data:</span>
              <span>{metrics.support_strength_score.toFixed(2)}/100</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Classification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Pattern: <span className={
              metrics.pattern_type === 'never_breaks' ? 'text-green-700' :
              metrics.pattern_type === 'exhausted_cascade' ? 'text-blue-600' :
              metrics.pattern_type === 'shallow_breaker' ? 'text-green-600' :
              metrics.pattern_type === 'volatile' ? 'text-red-600' :
              'text-gray-600'
            }>{metrics.pattern_type?.replace(/_/g, ' ')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Pattern is assigned based on first matching rule (evaluated in order):
          </p>
          <div className="space-y-2">
            {patternRules.map((rule, idx) => (
              <div
                key={rule.rule}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  rule.rule === metrics.pattern_type
                    ? 'bg-primary/10 border-primary'
                    : 'bg-background border-border'
                }`}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2">
                  {rule.rule === metrics.pattern_type ? '✓' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{rule.rule.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-muted-foreground">{rule.condition}</div>
                  <div className="text-xs mt-1">
                    <span className={rule.met ? 'text-green-600' : 'text-muted-foreground'}>
                      {rule.value}
                    </span>
                    {rule.rule === metrics.pattern_type && (
                      <span className="ml-2 font-semibold text-primary">← Matched!</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stability Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Trend: <span className={
              metrics.stability_trend === 'improving' ? 'text-green-600' :
              metrics.stability_trend === 'weakening' ? 'text-red-600' :
              'text-gray-600'
            }>
              {metrics.stability_trend === 'improving' ? '↑' : metrics.stability_trend === 'weakening' ? '↓' : '→'} {metrics.stability_trend}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium mb-2">First Half of Period</div>
              <div className="h-16 bg-muted rounded flex items-end justify-center relative">
                <div
                  className={`w-full transition-all ${
                    trendInfo.visual === 'upward' ? 'bg-blue-300' :
                    trendInfo.visual === 'downward' ? 'bg-blue-500' :
                    'bg-blue-400'
                  }`}
                  style={{
                    height: trendInfo.visual === 'upward' ? '60%' :
                            trendInfo.visual === 'downward' ? '90%' : '75%'
                  }}
                />
              </div>
            </div>
            <div className="flex-shrink-0 text-2xl">
              {metrics.stability_trend === 'improving' ? '→' : metrics.stability_trend === 'weakening' ? '→' : '→'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium mb-2">Second Half of Period</div>
              <div className="h-16 bg-muted rounded flex items-end justify-center relative">
                <div
                  className={`w-full transition-all ${
                    trendInfo.visual === 'upward' ? 'bg-green-500' :
                    trendInfo.visual === 'downward' ? 'bg-red-300' :
                    'bg-blue-400'
                  }`}
                  style={{
                    height: trendInfo.visual === 'upward' ? '90%' :
                            trendInfo.visual === 'downward' ? '60%' : '75%'
                  }}
                />
              </div>
            </div>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>Calculation:</strong> {trendInfo.description}</p>
            <p><strong>Meaning:</strong> {trendInfo.meaning}</p>
          </div>
        </CardContent>
      </Card>

      {/* Consecutive Breaks Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consecutive Breaks Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Max Consecutive */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Historical Maximum</span>
                <span className="font-bold">{metrics.max_consecutive_breaks} breaks</span>
              </div>
              <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-orange-500 flex items-center justify-center text-white text-xs font-bold"
                  style={{ width: '100%' }}
                >
                  Max: {metrics.max_consecutive_breaks}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Worst-case scenario: {metrics.max_consecutive_breaks} consecutive breaks in one cluster
              </p>
            </div>

            {/* Current Consecutive */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Current Consecutive</span>
                <span className={`font-bold ${metrics.current_consecutive_breaks > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {metrics.current_consecutive_breaks} breaks
                </span>
              </div>
              <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                {metrics.current_consecutive_breaks > 0 ? (
                  <div
                    className="absolute inset-y-0 left-0 bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: `${(metrics.current_consecutive_breaks / metrics.max_consecutive_breaks) * 100}%` }}
                  >
                    Current: {metrics.current_consecutive_breaks}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-green-700 text-xs font-bold">
                    No active cluster - Support holding ✓
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.current_consecutive_breaks > 0
                  ? `Active cluster with ${metrics.current_consecutive_breaks} breaks (${((metrics.current_consecutive_breaks / metrics.max_consecutive_breaks) * 100).toFixed(0)}% of max)`
                  : 'No breaks in recent cluster (last cluster ended >30 days ago)'
                }
              </p>
            </div>

            {/* Exhausted Cascade Check */}
            {metrics.current_consecutive_breaks >= (metrics.max_consecutive_breaks * 0.8) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 text-xl">ℹ️</div>
                  <div className="flex-1">
                    <div className="font-semibold text-blue-900 text-sm">Exhausted Cascade Pattern Detected!</div>
                    <div className="text-xs text-blue-700 mt-1">
                      Current breaks ({metrics.current_consecutive_breaks}) ≥ 80% of historical max ({metrics.max_consecutive_breaks}).
                      This suggests the cascade may be near exhaustion - potential rebound candidate.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Breaks in Period:</span>
              <span className="font-semibold">{metrics.total_breaks}</span>
            </div>
            <div className="flex justify-between">
              <span>Number of Clusters:</span>
              <span className="font-semibold">{metrics.num_clusters}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Days Between Breaks:</span>
              <span className="font-semibold">{metrics.avg_days_between_breaks?.toFixed(1) ?? 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Summary for {rollingPeriod}-Day Period</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Rolling Low</div>
            <div className="font-semibold">{metrics.rolling_low?.toFixed(2)} kr</div>
          </div>
          <div>
            <div className="text-muted-foreground">Current Price</div>
            <div className="font-semibold">{metrics.current_price.toFixed(2)} kr</div>
          </div>
          <div>
            <div className="text-muted-foreground">Distance to Support</div>
            <div className="font-semibold">{metrics.distance_to_support_pct?.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Support Stability</div>
            <div className="font-semibold">{metrics.support_stability_pct.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Median Drop/Break</div>
            <div className="font-semibold">{metrics.median_drop_per_break_pct?.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Days Since Last Break</div>
            <div className="font-semibold">{metrics.days_since_last_break ?? 'N/A'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
