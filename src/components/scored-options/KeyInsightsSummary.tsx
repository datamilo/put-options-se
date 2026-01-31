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
            <strong>Model Convergence:</strong> Both the Probability Optimization Model and TA ML Model
            independently predict a <strong>77% hit rate</strong> at the 70-80% prediction range. This dual
            confirmation from two different methodologies validates the prediction accuracy at the premium zone.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Risk-Return Optimization:</strong> The 70-80% range is optimal because it balances
            acceptable hit rate (77%) with significantly higher premiums (5-10x multiplier) compared to
            conservative ranges (80%+ with 1x premiums).
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Confidence Intervals:</strong> At 70-80%, the confidence intervals are tight
            ([77.0% - 77.2%] for the TA ML Model with 583K+ samples), indicating high statistical precision. This
            narrow range reflects robust prediction stability across diverse market conditions.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Expected Value Calculation:</strong> Expected Return = (77% × Premium Multiplier) -
            (23% × Loss). The 77% hit rate provides sufficient win rate to overcome the 23% loss rate while
            benefiting from higher premiums.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded p-3 space-y-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Understanding These Tables:</p>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
          <li>
            <strong>Hit Rate:</strong> Percentage of options in each prediction range that actually expired worthless
          </li>
          <li>
            <strong>Sample Size:</strong> Number of predictions used to calculate the hit rate (larger = more reliable)
          </li>
          <li>
            <strong>95% CI (Confidence Interval):</strong> Range where the true hit rate is 95% likely to fall. Tight
            CIs indicate precise, reliable estimates.
          </li>
          <li>
            <strong>Color Coding:</strong> Green (80%+ hit rate) = Conservative, Amber (70-80%) = Optimal Premium Zone,
            Red (&lt;70%) = Elevated Risk
          </li>
        </ul>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 italic">
        Source: Walk-forward validated backtesting on 1.8M+ Swedish equity option records (April 2024 - January 2026).
        See{' '}
        <a
          href="https://github.com/datamilo/put-options-se/blob/main/INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          INVESTOR_GUIDE
        </a>{' '}
        for complete methodology and details.
      </p>
    </div>
  );
};
