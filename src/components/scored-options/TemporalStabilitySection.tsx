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

interface TemporalStabilitySectionProps {
  folds: TemporalFoldData[];
}

export const TemporalStabilitySection: React.FC<TemporalStabilitySectionProps> = ({ folds }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDeviationColor = (deviation: number): string => {
    if (Math.abs(deviation) < 2) return 'text-gray-700 dark:text-gray-300';
    if (deviation > 0) return 'text-green-700 dark:text-green-400';
    return 'text-red-700 dark:text-red-400';
  };

  const getDeviationWidth = (deviation: number): string => {
    // Scale from -15pp to +10pp to 0-100%
    const normalized = ((deviation + 15) / 25) * 100;
    return Math.max(0, Math.min(100, normalized)) + '%';
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
        <span>Temporal Stability Analysis (Per-Fold 70-80% Bucket)</span>
      </button>

      {isExpanded && (
        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            This analysis shows how the model's calibration at the 70-80% prediction range varied across
            different market periods. Each "fold" represents a distinct 3-month testing window in walk-forward validation.
          </p>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-semibold">Fold</TableHead>
                  <TableHead className="text-left font-semibold">Test Period</TableHead>
                  <TableHead className="text-center font-semibold">Actual Worthless %</TableHead>
                  <TableHead className="text-center font-semibold">Sample Size</TableHead>
                  <TableHead className="text-center font-semibold">Deviation from 77%</TableHead>
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
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Key Observations:</p>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li>
                <strong>Fold 1-4:</strong> Variation ranges from -12.3pp (Fold 2) to +7.0pp (Fold 3),
                showing how market regimes affect calibration
              </li>
              <li>
                <strong>Fold 2 Underperformance:</strong> Dec 2024 - Mar 2025 experienced significant degradation
                (64.7% actual vs 77% expected). This reflects a temporary market regime shift during this period.
              </li>
              <li>
                <strong>Recent Performance:</strong> Folds 4-5 (Jun 2025 - Jan 2026) show improvement to 79-81%,
                suggesting the model is well-calibrated for current market conditions.
              </li>
              <li>
                <strong>Overall Average:</strong> The 77% aggregate rate masks this variation. Users should understand
                that actual Actual Worthless percentages fluctuate with market regimes, though the long-term average remains stable.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
