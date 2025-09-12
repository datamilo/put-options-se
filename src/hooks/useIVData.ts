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

// Create a singleton instance to prevent multiple loading attempts
let ivDataSingleton: {
  data: IVData[];
  isLoading: boolean;
  error: string | null;
  loaded: boolean;
} = {
  data: [],
  isLoading: false,
  error: null,
  loaded: false
};

export const useIVData = () => {
  const [data, setData] = useState<IVData[]>(ivDataSingleton.data);
  const [isLoading, setIsLoading] = useState(ivDataSingleton.isLoading);
  const [error, setError] = useState<string | null>(ivDataSingleton.error);

  console.log('🔍 useIVData hook called, singleton loaded:', ivDataSingleton.loaded, 'data length:', ivDataSingleton.data.length);

  const loadIVDataFromGitHub = useCallback(async () => {
    // If already loaded successfully, don't reload
    if (ivDataSingleton.loaded && ivDataSingleton.data.length > 0) {
      console.log('🚀 IV data already loaded in singleton, using cached data:', ivDataSingleton.data.length);
      setData(ivDataSingleton.data);
      setIsLoading(false);
      setError(ivDataSingleton.error);
      return;
    }

    console.log('📥 Loading IV data...');
    setIsLoading(true);
    ivDataSingleton.isLoading = true;
    setError(null);
    ivDataSingleton.error = null;

    // Try multiple fallback URLs for better reliability on GitHub Pages
    const urls = [
      `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/IV_PotentialDecline.csv?${Date.now()}`,
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
              const criticalErrors = results.errors.filter(e => e.type === 'Delimiter' || e.type === 'Quotes');
              if (criticalErrors.length > 0) {
                setError(`IV CSV parsing errors: ${criticalErrors.map(e => e.message).join(', ')}`);
                setIsLoading(false);
                ivDataSingleton.isLoading = false;
                return;
              }
            }
            
            if (results.data && results.data.length > 0) {
              console.log(`✅ Parsed ${results.data.length} IV rows from CSV - STORING IN SINGLETON`);
              const parsedData = results.data as IVData[];
              
              // Store in singleton to prevent re-loading
              ivDataSingleton.data = parsedData;
              ivDataSingleton.loaded = true;
              ivDataSingleton.isLoading = false;
              ivDataSingleton.error = null;
              
              // Update component state
              setData(parsedData);
              setIsLoading(false);
              setError(null);
              return; // Successfully loaded, exit the retry loop
            } else {
              throw new Error('No IV data found in CSV');
            }
          },
          error: (error) => {
            throw new Error(`Failed to parse IV CSV: ${error.message}`);
          }
        });
        
        // If we get here, parsing was successful, so we can break
        break;
        
      } catch (error) {
        console.warn(`❌ Failed to load IV data from ${url}:`, error);
        lastError = error as Error;
        continue;
      }
    }
    
    // Only set error if no successful load happened
    if (!ivDataSingleton.loaded || ivDataSingleton.data.length === 0) {
      console.warn('❌ All IV CSV loading attempts failed, current singleton data length:', ivDataSingleton.data.length);
      const errorMsg = `Failed to load IV data from any source. Last error: ${lastError?.message}`;
      setError(errorMsg);
      ivDataSingleton.error = errorMsg;
    }
    
    setIsLoading(false);
    ivDataSingleton.isLoading = false;
  }, []);

  useEffect(() => {
    console.log('🚀 useIVData useEffect triggered, singleton loaded:', ivDataSingleton.loaded, 'data length:', ivDataSingleton.data.length);
    
    // Use singleton data if available
    if (ivDataSingleton.loaded && ivDataSingleton.data.length > 0) {
      console.log('📋 Using cached IV data from singleton:', ivDataSingleton.data.length);
      setData(ivDataSingleton.data);
      setIsLoading(ivDataSingleton.isLoading);
      setError(ivDataSingleton.error);
      return;
    }

    let mounted = true;
    
    const loadData = async () => {
      if (!mounted) {
        console.log('⚠️ Component unmounted, aborting load');
        return;
      }
      
      console.log('📥 Starting IV data load...');
      try {
        await loadIVDataFromGitHub();
      } catch (error) {
        console.warn('❌ useEffect: All IV CSV loading attempts failed:', error);
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []); // No dependencies to prevent re-runs

  return {
    data,
    isLoading,
    error,
    loadIVDataFromGitHub,
    setData: (newData: IVData[]) => {
      setData(newData);
      ivDataSingleton.data = newData;
      ivDataSingleton.loaded = newData.length > 0;
    }
  };
};