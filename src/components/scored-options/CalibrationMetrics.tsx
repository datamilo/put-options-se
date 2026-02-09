import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { calibrationMetricsData } from '@/data/calibrationMetrics';
import { BucketCalibrationTable } from './BucketCalibrationTable';
import { TemporalStabilitySection } from './TemporalStabilitySection';
import { KeyInsightsSummary } from './KeyInsightsSummary';

type ActiveTab = 'v21' | 'v3';

export const CalibrationMetrics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('v21');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg">
      {/* Accordion Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Model Calibration & Accuracy
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              When models predict 70-80% probability: Probability Optimization achieves 83.8% accuracy, TA ML Model 72.42%. Both validated on 934K+ historical options.
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900 space-y-6">

      {/* Key Insights Summary */}
      <KeyInsightsSummary />

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('v21')}
          className={`px-4 py-3 font-semibold transition-colors ${
            activeTab === 'v21'
              ? 'text-gray-900 dark:text-gray-100 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Probability Optimization Model
        </button>
        <button
          onClick={() => setActiveTab('v3')}
          className={`px-4 py-3 font-semibold transition-colors ${
            activeTab === 'v3'
              ? 'text-gray-900 dark:text-gray-100 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          TA ML Model
        </button>
      </div>

      {/* Probability Optimization Model Tab */}
      {activeTab === 'v21' && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              The Probability Optimization Model combines three factors to estimate the likelihood an option will expire worthless (out-of-the-money). This table shows the historical accuracy of predictions at different probability levels, based on analysis of 72,469 options with known outcomes.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Testing approach:</strong> In-sample calibration on the Probability Tracking System (options actively tracked with complete historical snapshots). The 83.8% accuracy at 70-80% represents how well the formula works on this specific tracked dataset. Sample size of 19,830 at 70-80% is sufficient for high statistical confidence on tracked options.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">DATA REQUIREMENT DETAIL:</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Probability Optimization Model requires <strong>5 complex probability calculation methods</strong> (Black-Scholes + calibration + historical volatility + Bayesian + ensemble). This requires months of special historical probability tracking data. Of 1.86M historical options, only <strong>72,469 (3.9%)</strong> have complete: probability calculations + historical peak data + support metrics + known outcomes. This is why sample size is limited.
              </p>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Why Different Sample Sizes?
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Probability Optimization Model tests on 72,469 total options (Probability Tracking System) → 19,830 at 70-80%. TA Model tests on 1,860,935 total options (comprehensive historical database) → 636,639 at 70-80%. The 32x difference reflects different data sources: Probability Optimization is limited to tracked options, while TA Model accesses all Swedish equity options. Both use 27% of their respective datasets at 70-80%, showing identical market distribution.
            </p>
          </div>
          <BucketCalibrationTable
            title="Probability Optimization Model - Actual Worthless % by Score Range"
            buckets={calibrationMetricsData.v21Buckets}
            modelType="v21"
          />
        </div>
      )}

      {/* V3 Tab */}
      {activeTab === 'v3' && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              The TA ML Model uses machine learning to analyze 17 different signals about each option and the underlying stock to estimate the probability it will expire worthless. This table shows the historical accuracy of predictions at different probability levels.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Testing approach:</strong> Walk-forward temporal validation on the comprehensive historical database (all Swedish options, not just tracked ones). The model trains on historical data, then predicts on future periods it never saw. The 76.6% accuracy at 70-80% represents realistic expectation for new options the model hasn't encountered. Sample size of 636,639 at 70-80% provides extremely tight confidence intervals (±0.11 pp), proving the model generalizes well beyond training data.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">DATA REQUIREMENT DETAIL:</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                TA Model uses <strong>17 standard technical analysis features</strong> (RSI, MACD, ADX, Bollinger Bands, Greeks, etc.) calculated from standard daily price data. These work on <strong>any option with basic market data</strong>. Of 1.86M historical options, <strong>~1,860,935 (99%+)</strong> have complete technical feature data. No special probability tracking required, no months of historical data needed—just standard market data every stock has.
              </p>
            </div>
          </div>
          <BucketCalibrationTable
            title="TA ML Model - Actual Worthless % by Predicted Range"
            buckets={calibrationMetricsData.v3Buckets}
            modelType="v3"
          />
          {calibrationMetricsData.v3TemporalFolds && (
            <TemporalStabilitySection folds={calibrationMetricsData.v3TemporalFolds} />
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
};
