import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { calibrationMetricsData } from '@/data/calibrationMetrics';
import { BucketCalibrationTable } from './BucketCalibrationTable';
import { TemporalStabilitySection } from './TemporalStabilitySection';
import { KeyInsightsSummary } from './KeyInsightsSummary';
import { useTranslation } from 'react-i18next';

type ActiveTab = 'v21' | 'v3';

export const CalibrationMetrics: React.FC = () => {
  const { t } = useTranslation('pages');
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
              {t('scoredOptions.calibration.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('scoredOptions.calibration.subtitle')}
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
          {t('scoredOptions.calibration.tabProbOptimization')}
        </button>
        <button
          onClick={() => setActiveTab('v3')}
          className={`px-4 py-3 font-semibold transition-colors ${
            activeTab === 'v3'
              ? 'text-gray-900 dark:text-gray-100 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t('scoredOptions.calibration.tabTAML')}
        </button>
      </div>

      {/* Probability Optimization Model Tab */}
      {activeTab === 'v21' && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('scoredOptions.calibration.v21Desc1')}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{t('scoredOptions.calibration.testingApproach')}</strong> {t('scoredOptions.calibration.v21Testing')}
            </p>
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('scoredOptions.calibration.dataRequirementTitle')}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                {t('scoredOptions.calibration.v21DataRequirement')}
              </p>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
              {t('scoredOptions.calibration.whyDifferentSizes')}
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t('scoredOptions.calibration.whyDifferentSizesDesc')}
            </p>
          </div>
          <BucketCalibrationTable
            title={t('scoredOptions.calibration.v21TableTitle')}
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
              {t('scoredOptions.calibration.v3Desc1')}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{t('scoredOptions.calibration.testingApproach')}</strong> {t('scoredOptions.calibration.v3Testing')}
            </p>
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('scoredOptions.calibration.dataRequirementTitle')}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                {t('scoredOptions.calibration.v3DataRequirement')}
              </p>
            </div>
          </div>
          <BucketCalibrationTable
            title={t('scoredOptions.calibration.v3TableTitle')}
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
