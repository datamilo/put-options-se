import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import {
  ProbabilityValidationData,
  ValidationMetrics,
  CalibrationData,
  MethodPerformance,
  CalibrationPoint
} from '@/types/probabilityValidation';
import { normalizeProbMethod } from '@/utils/probabilityMethods';

interface ValidationSingleton {
  data: ProbabilityValidationData[];
  metrics: ValidationMetrics[];
  calibrationData: CalibrationData[];
  loaded: boolean;
  error: string | null;
}

const validationSingleton: ValidationSingleton = {
  data: [],
  metrics: [],
  calibrationData: [],
  loaded: false,
  error: null,
};

export const useProbabilityValidationData = () => {
  const [data, setData] = useState<ProbabilityValidationData[]>(validationSingleton.data);
  const [metrics, setMetrics] = useState<ValidationMetrics[]>(validationSingleton.metrics);
  const [calibrationData, setCalibrationData] = useState<CalibrationData[]>(validationSingleton.calibrationData);
  const [isLoading, setIsLoading] = useState(!validationSingleton.loaded);
  const [error, setError] = useState<string | null>(validationSingleton.error);

  const loadCSVFromGitHub = useCallback(async (filename: string, forceReload = false) => {
    if (validationSingleton.loaded && !forceReload) {
      setData(validationSingleton.data);
      setMetrics(validationSingleton.metrics);
      setCalibrationData(validationSingleton.calibrationData);
      setIsLoading(false);
      setError(validationSingleton.error);
      return validationSingleton.data;
    }

    setIsLoading(true);
    setError(null);

    const urls = [
      `https://cdn.jsdelivr.net/gh/datamilo/put-options-se@main/data/${filename}`,
      `${window.location.origin}${import.meta.env.BASE_URL}data/${filename}`,
    ];

    let lastError: Error | null = null;

    for (const url of urls) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim().length === 0) {
          throw new Error('Empty CSV file received');
        }

        const parseResult = await new Promise<ProbabilityValidationData[]>((resolve, reject) => {
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            delimiter: '|',
            transformHeader: (header) => header.trim(),
            transform: (value, field) => {
              const numericFields = [
                'PredictedProb', 'ActualRate', 'Count', 'CalibrationError',
                'Brier_Score', 'AUC_ROC', 'Log_Loss', 'Expected_Calibration_Error'
              ];

              if (typeof field === 'string' && numericFields.includes(field)) {
                const num = parseFloat(value);
                return isNaN(num) ? 0 : num;
              }

              if (field === 'ProbMethod') {
                return normalizeProbMethod(value);
              }

              return value;
            },
            complete: (results) => {
              resolve(results.data as ProbabilityValidationData[]);
            },
            error: (err) => {
              reject(err);
            }
          });
        });

        const metricsData = parseResult.filter(row => row.DataType === 'metrics') as ValidationMetrics[];
        const calibData = parseResult.filter(row =>
          row.DataType === 'calibration_aggregated' ||
          row.DataType === 'calibration_by_stock' ||
          row.DataType === 'calibration_by_stock_and_dte'
        ) as CalibrationData[];

        validationSingleton.data = parseResult;
        validationSingleton.metrics = metricsData;
        validationSingleton.calibrationData = calibData;
        validationSingleton.loaded = true;
        validationSingleton.error = null;

        setData(parseResult);
        setMetrics(metricsData);
        setCalibrationData(calibData);
        setIsLoading(false);
        return parseResult;

      } catch (err) {
        lastError = err as Error;
        continue;
      }
    }

    const errorMessage = lastError?.message || 'Failed to load validation CSV from all sources';
    validationSingleton.error = errorMessage;
    setError(errorMessage);
    setIsLoading(false);
    throw lastError;
  }, []);

  useEffect(() => {
    loadCSVFromGitHub('validation_report_data.csv').catch(() => {});
  }, [loadCSVFromGitHub]);

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
    reload: () => {
      validationSingleton.loaded = false;
      return loadCSVFromGitHub('validation_report_data.csv', true);
    },
  };
};
