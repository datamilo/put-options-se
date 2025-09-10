import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';

export interface IVData {
  Name: string;
  OptionName: string;
  Update_date: string;
  ExpiryDate: string;
  IV_ClosestToStrike: number;
  IV_UntilExpiryClosestToStrike: number;
  LowerBoundClosestToStrike: number;
  LowerBoundDistanceFromCurrentPrice: number;
  LowerBoundDistanceFromStrike: number;
  ImpliedDownPct: number;
  ToStrikePct: number;
  SafetyMultiple: number;
  SigmasToStrike: number;
  ProbAssignment: number;
  SafetyCategory: string;
  CushionMinusIVPct: number;
}

export const useIVData = () => {
  const [data, setData] = useState<IVData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIVDataFromGitHub = useCallback(async () => {
    console.log('📥 Loading IV data...');
    setIsLoading(true);
    setError(null);

    const githubUrl = `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/IV_PotentialDecline.csv?${Date.now()}`;

    try {
      const response = await fetch(githubUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch IV data from GitHub: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        delimiter: '|',
        transformHeader: (header) => header.trim(),
        transform: (value, field) => {
          const fieldName = String(field || '');
          const numericFields = [
            'IV_ClosestToStrike', 'IV_UntilExpiryClosestToStrike', 'LowerBoundClosestToStrike',
            'LowerBoundDistanceFromCurrentPrice', 'LowerBoundDistanceFromStrike', 'ImpliedDownPct',
            'ToStrikePct', 'SafetyMultiple', 'SigmasToStrike', 'ProbAssignment', 'CushionMinusIVPct'
          ];
          
          if (numericFields.includes(fieldName) && value !== '') {
            const num = parseFloat(String(value));
            return isNaN(num) ? 0 : num;
          }
          return String(value || '').trim();
        },
        complete: (results) => {
          console.log('✅ IV data loaded successfully:', results.data.length, 'rows');
          setData(results.data as IVData[]);
          setIsLoading(false);
        },
        error: (error) => {
          console.error('❌ Error parsing IV CSV:', error);
          setError(`Failed to parse IV CSV: ${error.message}`);
          setIsLoading(false);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error loading IV data:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIVDataFromGitHub();
  }, [loadIVDataFromGitHub]);

  return {
    data,
    isLoading,
    error,
    loadIVDataFromGitHub,
    setData
  };
};