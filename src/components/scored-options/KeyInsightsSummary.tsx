import React from 'react';
import { useTranslation } from 'react-i18next';

export const KeyInsightsSummary: React.FC = () => {
  const { t } = useTranslation('pages');

  return (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
        {t('scoredOptions.keyInsights.title')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>{t('scoredOptions.keyInsights.twoModelsTitle')}</strong>{' '}
            {t('scoredOptions.keyInsights.twoModelsText')}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>{t('scoredOptions.keyInsights.dataMetricsTitle')}</strong>{' '}
            {t('scoredOptions.keyInsights.dataMetricsText')}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>{t('scoredOptions.keyInsights.statisticalPrecisionTitle')}</strong>{' '}
            {t('scoredOptions.keyInsights.statisticalPrecisionText')}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>{t('scoredOptions.keyInsights.riskAssessmentTitle')}</strong>{' '}
            {t('scoredOptions.keyInsights.riskAssessmentText')}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 italic">
        {t('scoredOptions.keyInsights.source')}
      </p>
    </div>
  );
};
