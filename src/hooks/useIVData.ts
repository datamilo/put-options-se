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

    // Try multiple fallback URLs for better reliability
    const urls = [
      `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/IV_PotentialDecline.csv?${Date.now()}`,
      `https://datamilo.github.io/put-options-se/data/IV_PotentialDecline.csv?${Date.now()}`,
      `${window.location.origin}${import.meta.env.BASE_URL}data/IV_PotentialDecline.csv?${Date.now()}`
    ];

    let lastError: Error | null = null;

    for (const url of urls) {
      try {
        console.log('🔗 Trying IV URL:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        
        if (!csvText || csvText.trim().length === 0) {
          throw new Error('Empty CSV file received');
        }

        console.log('✅ Successfully loaded IV CSV from:', url);

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
          if (results.errors.length > 0) {
            console.warn('IV CSV parsing warnings:', results.errors);
            // Only fail if there are critical errors, not warnings
            const criticalErrors = results.errors.filter(e => e.type === 'Delimiter' || e.type === 'Quotes');
            if (criticalErrors.length > 0) {
              setError(`IV CSV parsing errors: ${criticalErrors.map(e => e.message).join(', ')}`);
              setIsLoading(false);
              return;
            }
          }
          
          if (results.data && results.data.length > 0) {
            console.log(`✅ Parsed ${results.data.length} IV rows from CSV`);
            setData(results.data as IVData[]);
            setIsLoading(false);
            return; // Successfully loaded, exit the retry loop
          } else {
            throw new Error('No IV data found in CSV');
          }
        },
        error: (error) => {
          throw new Error(`Failed to parse IV CSV: ${error.message}`);
        }
      });
      
      } catch (error) {
        console.warn(`❌ Failed to load IV data from ${url}:`, error);
        lastError = error as Error;
        continue;
      }
    }
    
    // If all URLs failed, set error and empty data
    console.warn('❌ All IV CSV loading attempts failed');
    setError(`Failed to load IV data from any source. Last error: ${lastError?.message}`);
    setData([]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!mounted) return;
      
      // Only load if we don't already have data
      if (data.length > 0) {
        console.log('📋 IV data already loaded, skipping reload');
        return;
      }
      
      try {
        await loadIVDataFromGitHub();
      } catch (error) {
        console.warn('❌ All IV CSV loading attempts failed:', error);
        if (mounted) {
          setData([]);
        }
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []); // Remove loadIVDataFromGitHub from dependencies to prevent re-runs

  return {
    data,
    isLoading,
    error,
    loadIVDataFromGitHub,
    setData
  };
};