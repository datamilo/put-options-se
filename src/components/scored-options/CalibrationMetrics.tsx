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
              Both models independently confirm 77% hit rate at 70-80% prediction range
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

      {/* V2.1 Tab */}
      {activeTab === 'v21' && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              The Probability Optimization Model uses a 3-factor weighted composite: Current Probability (60%),
              Historical Peak (30%), and Support Strength (10%). This table shows actual historical hit rates by prediction range.
              Hit rates are based on verified data from comprehensive_premium_zone_analysis.csv (1.86M options analyzed).
            </p>
          </div>
          <BucketCalibrationTable
            title="Probability Optimization Model - Hit Rates by Score Range"
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
              The TA ML Model uses machine learning with 17 empirically-learned features: 12 stock-level technical
              indicators and 5 contract-level features including Options Greeks. This table shows actual historical hit rates by prediction range.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Validation approach:</strong> Hit rates are based on 1.59M walk-forward validated predictions,
              where the model made predictions on data it never trained on. This out-of-sample testing provides
              evidence of the model's predictive capability on unseen future periods.
            </p>
          </div>
          <BucketCalibrationTable
            title="TA ML Model - Hit Rates by Predicted Range (Walk-Forward Validated)"
            buckets={calibrationMetricsData.v3Buckets}
            modelType="v3"
          />
          {calibrationMetricsData.v3TemporalFolds && (
            <TemporalStabilitySection folds={calibrationMetricsData.v3TemporalFolds} />
          )}
        </div>
      )}

        {/* Data Quality Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-green-50 dark:bg-green-950 rounded p-3 space-y-2">
            <p className="font-semibold text-green-900 dark:text-green-100 text-sm">✓ Multiple Models</p>
            <p className="text-xs text-green-800 dark:text-green-200">
              Two independent analysis approaches for comparison
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 rounded p-3 space-y-2">
            <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">✓ Out-of-Sample Testing</p>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              1.59M predictions on future data never seen during training
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950 rounded p-3 space-y-2">
            <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">✓ Large Sample Sizes</p>
            <p className="text-xs text-amber-800 dark:text-amber-200">99K-583K+ options per range for statistical confidence</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 rounded p-3 space-y-2">
            <p className="font-semibold text-purple-900 dark:text-purple-100 text-sm">✓ Verified Data</p>
            <p className="text-xs text-purple-800 dark:text-purple-200">Hit rates from comprehensive historical analysis</p>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
