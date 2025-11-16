import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import {
  ProbabilityValidationData,
  ValidationMetrics,
  CalibrationData,
  MethodPerformance,
  CalibrationPoint
} from '@/types/probabilityValidation';

export const useProbabilityValidationData = () => {
  const [data, setData] = useState<ProbabilityValidationData[]>([]);
  const [metrics, setMetrics] = useState<ValidationMetrics[]>([]);
  const [calibrationData, setCalibrationData] = useState<CalibrationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCSVFromGitHub = useCallback(async (filename: string) => {
    console.log('📥 Loading Validation CSV:', filename);
    setIsLoading(true);
    setError(null);

    const urls = [
      `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/${filename}?${Date.now()}`,
      `https://raw.githubusercontent.com/datamilo/put-options-se/main/public/data/${filename}?${Date.now()}`,
      `${window.location.origin}${import.meta.env.BASE_URL}data/${filename}?${Date.now()}`
    ];

    let lastError: Error | null = null;

    for (const url of urls) {
      try {
        console.log('🔗 Trying URL:', url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim().length === 0) {
          throw new Error('Empty CSV file received');
        }

        console.log('✅ Successfully loaded Validation CSV from:', url);

        const parseResult = await new Promise<ProbabilityValidationData[]>((resolve, reject) => {
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            delimiter: '|',
            transformHeader: (header) => header.trim(),
            transform: (value, field) => {
              const numericFields = [
                'PredictedProb',
                'ActualRate',
                'Count',
                'CalibrationError',
                'Brier_Score',
                'AUC_ROC',
                'Log_Loss',
                'Expected_Calibration_Error'
              ];

              if (typeof field === 'string' && numericFields.includes(field)) {
                const num = parseFloat(value);
                return isNaN(num) ? 0 : num;
              }
              return value;
            },
            complete: (results) => {
              if (results.errors.length > 0) {
                console.warn('⚠️ CSV parsing warnings:', results.errors);
              }

              const parsedData = results.data as ProbabilityValidationData[];
              console.log(`✅ Parsed ${parsedData.length} validation records`);
              resolve(parsedData);
            },
            error: (error) => {
              console.error('❌ CSV parsing error:', error);
              reject(error);
            }
          });
        });

        setData(parseResult);

        // Split into metrics and calibration data
        const metricsData = parseResult.filter(row => row.DataType === 'metrics') as ValidationMetrics[];
        const calibData = parseResult.filter(row =>
          row.DataType === 'calibration_aggregated' ||
          row.DataType === 'calibration_by_dte' ||
          row.DataType === 'calibration_by_stock'
        ) as CalibrationData[];

        setMetrics(metricsData);
        setCalibrationData(calibData);

        setIsLoading(false);
        return parseResult;

      } catch (err) {
        lastError = err as Error;
        console.warn(`⚠️ Failed to load from ${url}:`, err);
        continue;
      }
    }

    // All URLs failed
    const errorMessage = lastError?.message || 'Failed to load validation CSV from all sources';
    console.error('❌ All CSV load attempts failed:', errorMessage);
    setError(errorMessage);
    setIsLoading(false);
    throw lastError;
  }, []);

  useEffect(() => {
    loadCSVFromGitHub('validation_report_data.csv').catch(err => {
      console.error('Failed to load validation data:', err);
    });
  }, [loadCSVFromGitHub]);

  // Helper functions to transform data for charts
  const getMethodPerformance = useCallback((): MethodPerformance[] => {
    return metrics.map(m => ({
      method: m.ProbMethod,
      brierScore: m.Brier_Score,
      aucRoc: m.AUC_ROC,
      logLoss: m.Log_Loss,
      calibrationError: m.Expected_Calibration_Error,
      sampleSize: m.Count
    }));
  }, [metrics]);

  const getCalibrationPoints = useCallback((filterType?: 'aggregated' | 'by_dte' | 'by_stock', filterValue?: string): CalibrationPoint[] => {
    let filtered = calibrationData;

    if (filterType === 'aggregated') {
      filtered = calibrationData.filter(d => d.DataType === 'calibration_aggregated');
    } else if (filterType === 'by_dte' && filterValue) {
      filtered = calibrationData.filter(d => d.DataType === 'calibration_by_dte' && d.DTE_Bin === filterValue);
    } else if (filterType === 'by_stock' && filterValue) {
      filtered = calibrationData.filter(d => d.DataType === 'calibration_by_stock' && d.Stock === filterValue);
    }

    return filtered.map(d => ({
      predicted: d.PredictedProb,
      actual: d.ActualRate,
      count: d.Count,
      method: d.ProbMethod
    }));
  }, [calibrationData]);

  return {
    data,
    metrics,
    calibrationData,
    isLoading,
    error,
    getMethodPerformance,
    getCalibrationPoints,
    reload: () => loadCSVFromGitHub('validation_report_data.csv')
  };
};
