import * as XLSX from 'xlsx';
import { ScoredOptionData } from '@/types/scoredOptions';

interface ExportOptions {
  filename: string;
  data: ScoredOptionData[];
}

export const exportScoredOptionsToExcel = ({ filename, data }: ExportOptions) => {
  // Format value for Excel - keep numbers as numbers, handle NaN
  const formatValue = (value: any): string | number | null => {
    // Handle null, undefined, and NaN - return null for Excel to show as empty
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }

    // Boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Return everything else as-is (strings as strings, numbers as numbers)
    return value;
  };

  // Build export data
  const exportData = data.map((option) => ({
    date: formatValue(option.date),
    stock_name: formatValue(option.stock_name),
    option_name: formatValue(option.option_name),
    strike_price: formatValue(option.strike_price),
    expiry_date: formatValue(option.expiry_date),
    days_to_expiry: formatValue(option.days_to_expiry),
    premium: formatValue(option.premium),
    current_probability: formatValue(option.current_probability),
    // V2.1 Model
    v21_score: formatValue(option.v21_score),
    v21_bucket: formatValue(option.v21_bucket),
    v21_historical_peak: formatValue(option.v21_historical_peak),
    v21_support_strength: formatValue(option.v21_support_strength),
    // TA Model
    ta_probability: formatValue(option.ta_probability),
    ta_bucket: formatValue(option.ta_bucket),
    // Stock-level technical indicators
    RSI_14: formatValue(option.RSI_14),
    RSI_Slope: formatValue(option.RSI_Slope),
    MACD_Hist: formatValue(option.MACD_Hist),
    MACD_Slope: formatValue(option.MACD_Slope),
    BB_Position: formatValue(option.BB_Position),
    Dist_SMA50: formatValue(option.Dist_SMA50),
    Vol_Ratio: formatValue(option.Vol_Ratio),
    ADX_14: formatValue(option.ADX_14),
    ADX_Slope: formatValue(option.ADX_Slope),
    ATR_14: formatValue(option.ATR_14),
    Stochastic_K: formatValue(option.Stochastic_K),
    Stochastic_D: formatValue(option.Stochastic_D),
    // Contract-level indicators
    Sigma_Distance: formatValue(option.Sigma_Distance),
    Greeks_Delta: formatValue(option.Greeks_Delta),
    Greeks_Vega: formatValue(option.Greeks_Vega),
    Greeks_Theta: formatValue(option.Greeks_Theta),
    // Model agreement
    models_agree: formatValue(option.models_agree),
    agreement_strength: formatValue(option.agreement_strength),
    combined_score: formatValue(option.combined_score),
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
    { wch: 10 }, // ADX_14
    { wch: 11 }, // ADX_Slope
    { wch: 10 }, // ATR_14
    { wch: 12 }, // Stochastic_K
    { wch: 12 }, // Stochastic_D
    { wch: 14 }, // Sigma_Distance
    { wch: 11 }, // Greeks_Delta
    { wch: 11 }, // Greeks_Vega
    { wch: 11 }, // Greeks_Theta
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
