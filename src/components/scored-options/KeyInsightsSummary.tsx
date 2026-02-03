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
            <strong>Two Independent Models:</strong> The system uses two separate analytical approaches:
            Probability Optimization Model (83.8% hit rate at 70-80% range) and TA ML Model (76.6% hit rate at 70-80% range).
            Both provide independent estimates for comparison.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Data-Driven Metrics:</strong> The 70-80% prediction range shows different actual outcomes by model.
            Use the tables below to review hit rates and sample sizes across all prediction ranges.
            Users can sort and filter to identify patterns relevant to their investment criteria.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Statistical Precision:</strong> Large sample sizes (636K+ for TA ML Model, 20K+ for Probability Model at 70-80%)
            provide high confidence in the estimates. Confidence intervals show the range where true hit rates likely fall.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Risk Assessment:</strong> Hit rate indicates percentage of options predicted to expire worthless
            that actually do. Lower hit rates reflect higher risk. Users should evaluate their own risk tolerance
            when selecting prediction ranges to trade.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded p-3 space-y-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">How to Interpret the Data:</p>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
          <li>
            <strong>Hit Rate:</strong> Percentage of options in each prediction range that actually expired worthless
          </li>
          <li>
            <strong>Sample Size:</strong> Number of options analyzed to calculate hit rate (larger samples provide more reliable estimates)
          </li>
          <li>
            <strong>95% CI (Confidence Interval):</strong> Range where the true hit rate is 95% likely to fall. Narrow
            intervals indicate more precise estimates.
          </li>
          <li>
            <strong>Avg Premium:</strong> Average option premium (where available) for reference only
          </li>
        </ul>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 italic">
        Source: Validated testing on 1.8M+ Swedish equity option records (April 2024 - January 2026).
      </p>
    </div>
  );
};
