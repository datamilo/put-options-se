import React from 'react';

export const KeyInsightsSummary: React.FC = () => {
  return (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
        💡 Key Insights: The Premium Collection Sweet Spot
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Two Independent Models:</strong> When predicting 70-80% probability, Probability Optimization Model achieved 83.8% accuracy (options actually expired worthless), TA ML Model achieved 76.6%. Different testing methodologies explain the difference: V2.1 optimizes weights on tracked options (20K sample); TA Model validates on future unseen data (637K sample) using walk-forward testing.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Data-Driven Metrics:</strong> Actual Worthless % varies by model and prediction range. Review the detailed tables below for comprehensive performance data.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Statistical Precision:</strong> Large sample sizes (636K+ for TA ML Model, 20K+ for Probability Model at 70-80%)
            provide high confidence in the estimates. Confidence intervals show the range where true Actual Worthless % likely falls.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Risk Assessment:</strong> Lower Actual Worthless % indicates higher risk. Evaluate model performance across prediction ranges to support your trading decisions.
          </p>
        </div>
      </div>

<p className="text-xs text-gray-600 dark:text-gray-400 italic">
        Source: Validated testing on 1.8M+ Swedish equity option records (April 2024 - January 2026).
      </p>
    </div>
  );
};
