import * as XLSX from 'xlsx';
import { OptionData } from '@/types/options';
import { formatNumber } from '@/lib/utils';
import i18n from '@/i18n/index';

interface ExportOptions {
  filename: string;
  visibleColumns: (keyof OptionData)[];
  data: OptionData[];
}

export const exportToExcel = ({ filename, visibleColumns, data }: ExportOptions) => {
  const formatColumnName = (field: string): string => {
    const translated = i18n.t(`tables:options.fields.${field}`, { defaultValue: '' });
    if (translated) return translated;
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Create the worksheet data
  const worksheetData = [
    // Header row
    visibleColumns.map(col => formatColumnName(col)),
    // Data rows
    ...data.map(option =>
      visibleColumns.map(col => {
        const value = option[col];
        // Format the value for Excel display
        if (value === null || value === undefined) {
          return '-';
        }
        // For certain fields, apply number formatting
        if (typeof value === 'number') {
          return formatNumber(value, col);
        }
        return value;
      })
    )
  ];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for better readability
  const columnWidths = visibleColumns.map(col => {
    const columnName = formatColumnName(col);
    const maxLength = Math.max(
      columnName.length,
      ...data.map(option => {
        const value = option[col];
        return String(value || '').length;
      })
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });

  worksheet['!cols'] = columnWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Options Data');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = `${filename}_${timestamp}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, finalFilename);
};
