import * as XLSX from 'xlsx';
import { ScoredOptionData } from '@/types/scoredOptions';
import {
  formatNordicNumber,
  formatNordicDecimal,
  formatNordicPercentage,
  formatNordicCurrency,
} from './numberFormatting';

interface ExportOptions {
  filename: string;
  data: ScoredOptionData[];
}

export const exportScoredOptionsToExcel = ({ filename, data }: ExportOptions) => {
  // Format column names for Excel headers
  const formatColumnName = (field: string) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Format value for Excel display
  const formatValue = (value: any, columnName: string): string | number | null => {
    // Handle null, undefined, and NaN
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }

    // Boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // String values (dates, text)
    if (typeof value === 'string') {
      return value;
    }

    // Numeric formatting based on column name
    if (typeof value === 'number') {
      // Premium and currency fields
      if (columnName === 'premium') {
        return formatNordicCurrency(value, 0);
      }

      // Score fields (0-100 range)
      if (columnName.includes('Score') || columnName.includes('score')) {
        return parseFloat(formatNordicDecimal(value, 2).replace(',', '.'));
      }

      // Probability fields (0-1 or percentage)
      if (
        columnName.includes('probability') ||
        columnName.includes('Probability')
      ) {
        // If value is between 0 and 1, convert to percentage
        if (value >= 0 && value <= 1) {
          return formatNordicPercentage(value, 2);
        }
        return formatNordicPercentage(value / 100, 2);
      }

      // Percentage fields
      if (columnName.includes('Pct') || columnName.includes('pct')) {
        return formatNordicPercentage(value / 100, 2);
      }

      // Days fields
      if (columnName.includes('Days') || columnName.includes('days')) {
        return Math.round(value);
      }

      // Strike price
      if (columnName === 'strike_price' || columnName === 'strikePrice') {
        return parseFloat(formatNordicDecimal(value, 2).replace(',', '.'));
      }

      // Technical indicators with decimal places
      if (
        [
          'RSI_14',
          'RSI_Slope',
          'MACD_Hist',
          'MACD_Slope',
          'BB_Position',
          'Dist_SMA50',
          'Vol_Ratio',
          'Sigma_Distance',
          'HV_annual',
        ].includes(columnName)
      ) {
        return parseFloat(formatNordicDecimal(value, 4).replace(',', '.'));
      }

      // Default: 2 decimal places
      return parseFloat(formatNordicDecimal(value, 2).replace(',', '.'));
    }

    return value;
  };

  // Build export data
  const exportData = data.map((option) => ({
    date: option.date,
    stock_name: option.stock_name,
    option_name: option.option_name,
    strike_price: formatValue(option.strike_price, 'strike_price'),
    expiry_date: option.expiry_date,
    days_to_expiry: formatValue(option.days_to_expiry, 'days_to_expiry'),
    premium: formatValue(option.premium, 'premium'),
    current_probability: formatValue(option.current_probability, 'current_probability'),
    v21_score: formatValue(option.v21_score, 'v21_score'),
    v21_bucket: option.v21_bucket,
    v21_historical_peak: formatValue(option.v21_historical_peak, 'v21_historical_peak'),
    v21_support_strength: formatValue(option.v21_support_strength, 'v21_support_strength'),
    ta_probability: formatValue(option.ta_probability, 'ta_probability'),
    ta_bucket: option.ta_bucket,
    RSI_14: formatValue(option.RSI_14, 'RSI_14'),
    RSI_Slope: formatValue(option.RSI_Slope, 'RSI_Slope'),
    MACD_Hist: formatValue(option.MACD_Hist, 'MACD_Hist'),
    MACD_Slope: formatValue(option.MACD_Slope, 'MACD_Slope'),
    BB_Position: formatValue(option.BB_Position, 'BB_Position'),
    Dist_SMA50: formatValue(option.Dist_SMA50, 'Dist_SMA50'),
    Vol_Ratio: formatValue(option.Vol_Ratio, 'Vol_Ratio'),
    Sigma_Distance: formatValue(option.Sigma_Distance, 'Sigma_Distance'),
    HV_annual: formatValue(option.HV_annual, 'HV_annual'),
    models_agree: formatValue(option.models_agree, 'models_agree'),
    agreement_strength: option.agreement_strength,
    combined_score: formatValue(option.combined_score, 'combined_score'),
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 12 }, // date
    { wch: 15 }, // stock_name
    { wch: 12 }, // option_name
    { wch: 13 }, // strike_price
    { wch: 12 }, // expiry_date
    { wch: 13 }, // days_to_expiry
    { wch: 12 }, // premium
    { wch: 18 }, // current_probability
    { wch: 11 }, // v21_score
    { wch: 12 }, // v21_bucket
    { wch: 18 }, // v21_historical_peak
    { wch: 18 }, // v21_support_strength
    { wch: 13 }, // ta_probability
    { wch: 12 }, // ta_bucket
    { wch: 10 }, // RSI_14
    { wch: 11 }, // RSI_Slope
    { wch: 12 }, // MACD_Hist
    { wch: 12 }, // MACD_Slope
    { wch: 12 }, // BB_Position
    { wch: 12 }, // Dist_SMA50
    { wch: 11 }, // Vol_Ratio
    { wch: 14 }, // Sigma_Distance
    { wch: 11 }, // HV_annual
    { wch: 12 }, // models_agree
    { wch: 18 }, // agreement_strength
    { wch: 13 }, // combined_score
  ];

  ws['!cols'] = columnWidths;

  // Create workbook and add sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Scored Options');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(wb, fullFilename);
};
