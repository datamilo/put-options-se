import * as XLSX from 'xlsx';
import { RecommendedOption } from '@/types/recommendations';
import { formatNordicNumber, formatNordicDecimal, formatNordicPercentage } from './numberFormatting';

interface ExportOptions {
  filename: string;
  data: RecommendedOption[];
}

export const exportRecommendationsToExcel = ({ filename, data }: ExportOptions) => {
  // Format column names for Excel headers
  const formatColumnName = (field: string) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Flatten a single recommendation with all its score breakdown fields
  const flattenRecommendation = (option: RecommendedOption) => {
    const baseData: Record<string, any> = {
      rank: option.rank,
      optionName: option.optionName,
      stockName: option.stockName,
      strikePrice: option.strikePrice,
      currentPrice: option.currentPrice,
      expiryDate: option.expiryDate,
      daysToExpiry: option.daysToExpiry,
      premium: option.premium,
      rollingLow: option.rollingLow,
      distanceToSupportPct: option.distanceToSupportPct,
      daysSinceLastBreak: option.daysSinceLastBreak,
      supportStrengthScore: option.supportStrengthScore,
      patternType: option.patternType,
      currentProbability: option.currentProbability,
      historicalPeakProbability: option.historicalPeakProbability,
      recoveryAdvantage: option.recoveryAdvantage,
      currentProbBin: option.currentProbBin,
      dteBin: option.dteBin,
      monthlyPositiveRate: option.monthlyPositiveRate,
      monthlyAvgReturn: option.monthlyAvgReturn,
      typicalLowDay: option.typicalLowDay,
      currentMonthPerformance: option.currentMonthPerformance,
      monthsInHistoricalData: option.monthsInHistoricalData,
      worstMonthDrawdown: option.worstMonthDrawdown,
      financialReport: option.financialReport,
      xDay: option.xDay,
      compositeScore: option.compositeScore,
    };

    // Add flattened score breakdown fields
    const scoreBreakdownFactors = [
      'supportStrength',
      'daysSinceBreak',
      'recoveryAdvantage',
      'historicalPeak',
      'monthlySeasonality',
      'currentPerformance',
    ] as const;

    for (const factor of scoreBreakdownFactors) {
      const component = option.scoreBreakdown[factor];
      baseData[`${factor}_raw`] = component.raw;
      baseData[`${factor}_normalized`] = component.normalized;
      baseData[`${factor}_weighted`] = component.weighted;
      baseData[`${factor}_hasData`] = component.hasData ? 'Yes' : 'No';
    }

    return baseData;
  };

  // Get all column headers (both base and score breakdown fields)
  const baseColumns = [
    'rank',
    'optionName',
    'stockName',
    'strikePrice',
    'currentPrice',
    'expiryDate',
    'daysToExpiry',
    'premium',
    'rollingLow',
    'distanceToSupportPct',
    'daysSinceLastBreak',
    'supportStrengthScore',
    'patternType',
    'currentProbability',
    'historicalPeakProbability',
    'recoveryAdvantage',
    'currentProbBin',
    'dteBin',
    'monthlyPositiveRate',
    'monthlyAvgReturn',
    'typicalLowDay',
    'currentMonthPerformance',
    'monthsInHistoricalData',
    'worstMonthDrawdown',
    'financialReport',
    'xDay',
    'compositeScore',
  ];

  const scoreBreakdownColumns = [
    'supportStrength_raw',
    'supportStrength_normalized',
    'supportStrength_weighted',
    'supportStrength_hasData',
    'daysSinceBreak_raw',
    'daysSinceBreak_normalized',
    'daysSinceBreak_weighted',
    'daysSinceBreak_hasData',
    'recoveryAdvantage_raw',
    'recoveryAdvantage_normalized',
    'recoveryAdvantage_weighted',
    'recoveryAdvantage_hasData',
    'historicalPeak_raw',
    'historicalPeak_normalized',
    'historicalPeak_weighted',
    'historicalPeak_hasData',
    'monthlySeasonality_raw',
    'monthlySeasonality_normalized',
    'monthlySeasonality_weighted',
    'monthlySeasonality_hasData',
    'currentPerformance_raw',
    'currentPerformance_normalized',
    'currentPerformance_weighted',
    'currentPerformance_hasData',
  ];

  const allColumns = [...baseColumns, ...scoreBreakdownColumns];

  // Format value for Excel display
  const formatValue = (value: any, columnName: string): string | number | null => {
    // Handle null, undefined, and NaN
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      // Distance To Support Pct - already in 1-100 scale
      if (columnName === 'Distance To Support Pct') {
        return parseFloat(value.toFixed(1));
      }

      // Current Probability and Historical Peak Probability - keep as decimal (0-1 scale)
      if (columnName === 'Current Probability' || columnName === 'Historical Peak Probability') {
        return parseFloat(value.toFixed(3));
      }

      // Other probability fields that are 0-1 scale and need conversion to percentage
      if (columnName.includes('Probability') || columnName === 'Recovery Rate %') {
        return parseFloat((value * 100).toFixed(1));
      }

      // Monthly Positive Rate - already in 0-100 scale
      if (columnName === 'Monthly Positive Rate') {
        return parseFloat(value.toFixed(1));
      }

      // Current Month Performance - already in percentage scale
      if (columnName === 'Current Month Performance') {
        return parseFloat(value.toFixed(2));
      }

      // Support Strength Score - no decimals
      if (columnName === 'Support Strength Score') {
        return Math.round(value);
      }

      // Raw values from score breakdown (0-1 scale probabilities)
      if (columnName.includes('_raw') && value >= 0 && value <= 1) {
        return parseFloat((value * 100).toFixed(2));
      }

      // Normalized and weighted scores
      if (columnName.includes('_normalized') || columnName.includes('_weighted')) {
        return parseFloat(value.toFixed(2));
      }

      // Price and Strike values
      if (columnName.includes('Price') || columnName.includes('Strike') || columnName === 'Rolling Low') {
        return parseFloat(value.toFixed(2));
      }

      // General decimal numbers
      if (!Number.isInteger(value)) {
        return parseFloat(value.toFixed(2));
      }

      // Integer values
      return value;
    }

    return String(value);
  };

  // Create worksheet data
  const worksheetData = [
    // Header row
    allColumns.map((col) => formatColumnName(col)),
    // Data rows
    ...data.map((option) => {
      const flattened = flattenRecommendation(option);
      return allColumns.map((col) => formatValue(flattened[col], formatColumnName(col)));
    }),
  ];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for better readability
  const columnWidths = allColumns.map((col) => {
    const columnName = formatColumnName(col);
    const maxLength = Math.max(
      columnName.length,
      ...data.map((option) => {
        const flattened = flattenRecommendation(option);
        const value = flattened[col];
        return String(value || '').length;
      })
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });

  worksheet['!cols'] = columnWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recommendations');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = `${filename}_${timestamp}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, finalFilename);
};
