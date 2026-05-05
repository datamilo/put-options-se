import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatNordicDecimal, formatNordicNumber } from '@/utils/numberFormatting';
import { useTranslation } from 'react-i18next';

type ActiveTab = 'v21' | 'v3';

export const LossAnalysisMetrics: React.FC = () => {
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
              {t('scoredOptions.lossAnalysis.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('scoredOptions.lossAnalysis.subtitle')}
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
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900 space-y-8">

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
              {t('scoredOptions.lossAnalysis.tabProbOptimization')}
            </button>
            <button
              onClick={() => setActiveTab('v3')}
              className={`px-4 py-3 font-semibold transition-colors ${
                activeTab === 'v3'
                  ? 'text-gray-900 dark:text-gray-100 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('scoredOptions.lossAnalysis.tabTAML')}
            </button>
          </div>

          {/* V2.1 Loss Analysis Tab */}
          {activeTab === 'v21' && (
            <div className="space-y-6">
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left font-semibold">{t('scoredOptions.lossAnalysis.colScoreBucket')}</TableHead>
                      <TableHead className="text-center font-semibold">{t('scoredOptions.lossAnalysis.colSampleSize')}</TableHead>
                      <TableHead className="text-center font-semibold">{t('scoredOptions.lossAnalysis.colAvgLoss')}</TableHead>
                      <TableHead className="text-center font-semibold">{t('scoredOptions.lossAnalysis.colMedianLoss')}</TableHead>
                      <TableHead className="text-center font-semibold">{t('scoredOptions.lossAnalysis.colMinLoss')}</TableHead>
                      <TableHead className="text-center font-semibold">{t('scoredOptions.lossAnalysis.col95thPct')}</TableHead>
                      <TableHead className="text-center font-semibold">{t('scoredOptions.lossAnalysis.colMaxLoss')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">&lt;50%</TableCell>
                      <TableCell className="text-center">{formatNordicNumber(47103)}</TableCell>
                      <TableCell className="text-center font-semibold">11,62%</TableCell>
                      <TableCell className="text-center">9,43%</TableCell>
                      <TableCell className="text-center">0,00%</TableCell>
                      <TableCell className="text-center">30,69%</TableCell>
                      <TableCell className="text-center">56,19%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">50-60%</TableCell>
                      <TableCell className="text-center">{formatNordicNumber(40959)}</TableCell>
                      <TableCell className="text-center font-semibold">7,57%</TableCell>
                      <TableCell className="text-center">5,77%</TableCell>
                      <TableCell className="text-center">0,00%</TableCell>
                      <TableCell className="text-center">20,55%</TableCell>
                      <TableCell className="text-center">49,00%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">60-70%</TableCell>
                      <TableCell className="text-center">{formatNordicNumber(63043)}</TableCell>
                      <TableCell className="text-center font-semibold">7,26%</TableCell>
                      <TableCell className="text-center">5,10%</TableCell>
                      <TableCell className="text-center">0,00%</TableCell>
                      <TableCell className="text-center">21,60%</TableCell>
                      <TableCell className="text-center">56,79%</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50 dark:bg-blue-950">
                      <TableCell className="font-medium">70-80%</TableCell>
                      <TableCell className="text-center">{formatNordicNumber(67616)}</TableCell>
                      <TableCell className="text-center font-semibold">5,70%</TableCell>
                      <TableCell className="text-center">3,80%</TableCell>
                      <TableCell className="text-center">0,00%</TableCell>
                      <TableCell className="text-center">17,48%</TableCell>
                      <TableCell className="text-center">45,25%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">80-100%</TableCell>
                      <TableCell className="text-center">{formatNordicNumber(45002)}</TableCell>
                      <TableCell className="text-center font-semibold">4,63%</TableCell>
                      <TableCell className="text-center">3,07%</TableCell>
                      <TableCell className="text-center">0,00%</TableCell>
                      <TableCell className="text-center">14,14%</TableCell>
                      <TableCell className="text-center">39,39%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('scoredOptions.lossAnalysis.dataSourceV21')}
              </p>
            </div>
          )}

          {/* TA Model V3 Loss Analysis Tab */}
          {activeTab === 'v3' && (
            <div className="space-y-6">
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left font-semibold">{t('scoredOptions.lossAnalysis.colPredictedRange')}</TableHead>
                      <TableHead className="text-center font-semibold">{t('scoredOptions.lossAnalysis.colAvgLoss')}</TableHead>
                      <TableHead className="text-center font-semibold">{t('scoredOptions.lossAnalysis.colMedianLoss')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">90%+</TableCell>
                      <TableCell className="text-center font-semibold">6,44%</TableCell>
                      <TableCell className="text-center">4,41%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">80-90%</TableCell>
                      <TableCell className="text-center font-semibold">6,64%</TableCell>
                      <TableCell className="text-center">4,33%</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50 dark:bg-blue-950">
                      <TableCell className="font-medium">70-80%</TableCell>
                      <TableCell className="text-center font-semibold">6,64%</TableCell>
                      <TableCell className="text-center">4,62%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">60-70%</TableCell>
                      <TableCell className="text-center font-semibold">7,23%</TableCell>
                      <TableCell className="text-center">4,85%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">50-60%</TableCell>
                      <TableCell className="text-center font-semibold">8,19%</TableCell>
                      <TableCell className="text-center">5,90%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">&lt;50%</TableCell>
                      <TableCell className="text-center font-semibold">12,16%</TableCell>
                      <TableCell className="text-center">10,38%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('scoredOptions.lossAnalysis.dataSourceV3')}
              </p>
            </div>
          )}

          {/* Loss Distribution Summary - Always Visible */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('scoredOptions.lossAnalysis.distributionSummaryTitle')}
            </h4>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left font-semibold">{t('scoredOptions.lossAnalysis.colMetric')}</TableHead>
                    <TableHead className="text-center font-semibold">{t('scoredOptions.lossAnalysis.colProbOptimization')}</TableHead>
                    <TableHead className="text-center font-semibold">{t('scoredOptions.lossAnalysis.colTAModelV3')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{t('scoredOptions.lossAnalysis.rowHitRate')}</TableCell>
                    <TableCell className="text-center">62,51%</TableCell>
                    <TableCell className="text-center">70,16%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{t('scoredOptions.lossAnalysis.rowITMFailureRate')}</TableCell>
                    <TableCell className="text-center">37,49%</TableCell>
                    <TableCell className="text-center">29,84%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{t('scoredOptions.lossAnalysis.rowAvgLossWhenITM')}</TableCell>
                    <TableCell className="text-center font-semibold">5,70%</TableCell>
                    <TableCell className="text-center font-semibold">6,64%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{t('scoredOptions.lossAnalysis.rowMedianLossWhenITM')}</TableCell>
                    <TableCell className="text-center">3,80%</TableCell>
                    <TableCell className="text-center">4,62%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Loss Scaling by Confidence Summary */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('scoredOptions.lossAnalysis.lossScalingTitle')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900 dark:text-gray-100">{t('scoredOptions.lossAnalysis.probOptModel')}</h5>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>{t('scoredOptions.lossAnalysis.lowestConfidence')}</span>
                    <span className="font-semibold">11,62%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('scoredOptions.lossAnalysis.highestConfidenceV21')}</span>
                    <span className="font-semibold">4,63%</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2">
                    <span>{t('scoredOptions.lossAnalysis.ratio')}</span>
                    <span className="font-semibold">2.51x</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900 dark:text-gray-100">{t('scoredOptions.lossAnalysis.taModelV3')}</h5>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>{t('scoredOptions.lossAnalysis.lowestConfidence')}</span>
                    <span className="font-semibold">12,16%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('scoredOptions.lossAnalysis.highestConfidenceV3')}</span>
                    <span className="font-semibold">6,44%</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2">
                    <span>{t('scoredOptions.lossAnalysis.ratio')}</span>
                    <span className="font-semibold">1.89x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
