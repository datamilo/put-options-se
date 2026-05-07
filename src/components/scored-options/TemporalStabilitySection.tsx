import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TemporalFoldData } from '@/types/calibration';
import { formatNordicDecimal, formatNordicNumber, formatNordicPercentagePoints } from '@/utils/numberFormatting';
import { useTranslation } from 'react-i18next';

interface TemporalStabilitySectionProps {
  folds: TemporalFoldData[];
}

export const TemporalStabilitySection: React.FC<TemporalStabilitySectionProps> = ({ folds }) => {
  const { t } = useTranslation('pages');
  const [isExpanded, setIsExpanded] = useState(false);

  const getDeviationColor = (deviation: number): string => {
    if (Math.abs(deviation) < 2) return 'text-gray-700 dark:text-gray-300';
    if (deviation > 0) return 'text-green-700 dark:text-green-400';
    return 'text-red-700 dark:text-red-400';
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors w-full"
      >
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
        <span>{t('scoredOptions.temporalStability.title')}</span>
      </button>

      {isExpanded && (
        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t('scoredOptions.temporalStability.description')}
          </p>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-semibold">{t('scoredOptions.temporalStability.colFold')}</TableHead>
                  <TableHead className="text-left font-semibold">{t('scoredOptions.temporalStability.colTestPeriod')}</TableHead>
                  <TableHead className="text-center font-semibold">{t('scoredOptions.temporalStability.colActualWorthless')}</TableHead>
                  <TableHead className="text-center font-semibold">{t('scoredOptions.temporalStability.colSampleSize')}</TableHead>
                  <TableHead className="text-center font-semibold">{t('scoredOptions.temporalStability.colDeviation')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folds.map((fold) => (
                  <TableRow key={fold.fold}>
                    <TableCell className="text-center font-semibold text-gray-900 dark:text-gray-100">
                      {fold.fold}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {fold.testPeriod}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-amber-600 dark:text-amber-400">
                      {formatNordicDecimal(fold.hitRate * 100, 1)}%
                    </TableCell>
                    <TableCell className="text-center text-gray-700 dark:text-gray-300">
                      {formatNordicNumber(fold.sampleCount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-semibold ${getDeviationColor(fold.deviation)}`}>
                          {fold.deviation > 0 ? '+' : ''}{formatNordicPercentagePoints(fold.deviation, 1)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 bg-white dark:bg-gray-800 rounded p-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('scoredOptions.temporalStability.keyObservations')}
            </p>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li>
                <strong>{t('scoredOptions.temporalStability.obs1Title')}</strong>{' '}
                {t('scoredOptions.temporalStability.obs1Text')}
              </li>
              <li>
                <strong>{t('scoredOptions.temporalStability.obs2Title')}</strong>{' '}
                {t('scoredOptions.temporalStability.obs2Text')}
              </li>
              <li>
                <strong>{t('scoredOptions.temporalStability.obs3Title')}</strong>{' '}
                {t('scoredOptions.temporalStability.obs3Text')}
              </li>
              <li>
                <strong>{t('scoredOptions.temporalStability.obs4Title')}</strong>{' '}
                {t('scoredOptions.temporalStability.obs4Text')}
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
