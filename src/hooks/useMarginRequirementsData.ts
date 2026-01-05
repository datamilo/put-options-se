import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';

export interface MarginRequirementsData {
  OptionName: string;
  Prob_Normal_2SD_Decline_Pct: number;
  Hist_Worst_Decline_Pct: number;
  SRI_Base: number;
  Event_Buffer: number;
  Final_SRI: number;
  OTM_Amount: number;
  Margin_A_Broker_Proxy: number;
  Margin_B_Historical_Floor: number;
  Margin_Floor_15pct: number;
  Est_Margin_SEK: number;
  Net_Premium_After_Costs: number;
  Annualized_ROM_Pct: number;
}

// Create a singleton instance to prevent multiple loading attempts
let marginDataSingleton: {
  data: MarginRequirementsData[];
  isLoading: boolean;
  error: string | null;
  loaded: boolean;
} = {
  data: [],
  isLoading: false,
  error: null,
  loaded: false
};

export const useMarginRequirementsData = () => {
  const [data, setData] = useState<MarginRequirementsData[]>(marginDataSingleton.data);
  const [isLoading, setIsLoading] = useState(marginDataSingleton.isLoading);
  const [error, setError] = useState<string | null>(marginDataSingleton.error);

  console.log('🔍 useMarginRequirementsData hook called, singleton loaded:', marginDataSingleton.loaded, 'data length:', marginDataSingleton.data.length);

  const loadMarginDataFromGitHub = useCallback(async () => {
    // If already loaded successfully, don't reload
    if (marginDataSingleton.loaded && marginDataSingleton.data.length > 0) {
      console.log('🚀 Margin data already loaded in singleton, using cached data:', marginDataSingleton.data.length);
      setData(marginDataSingleton.data);
      setIsLoading(false);
      setError(marginDataSingleton.error);
      return;
    }

    console.log('📥 Loading margin requirements data...');
    setIsLoading(true);
    marginDataSingleton.isLoading = true;
    setError(null);
    marginDataSingleton.error = null;

    // Try multiple fallback URLs for better reliability on GitHub Pages
    const urls = [
      `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/margin_requirements.csv?${Date.now()}`,
      `${window.location.origin}${import.meta.env.BASE_URL}data/margin_requirements.csv?${Date.now()}`
    ];

    let lastError: Error | null = null;

    for (const url of urls) {
      try {
        console.log('🔗 Trying margin requirements URL:', url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim().length === 0) {
          throw new Error('Empty CSV file received');
        }

        console.log('✅ Successfully loaded margin requirements CSV from:', url);

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          delimiter: '|',
          transformHeader: (header) => header.trim(),
          transform: (value, field) => {
            const fieldName = String(field || '');
            const numericFields = [
              'Prob_Normal_2SD_Decline_Pct', 'Hist_Worst_Decline_Pct', 'SRI_Base', 'Event_Buffer',
              'Final_SRI', 'OTM_Amount', 'Margin_A_Broker_Proxy', 'Margin_B_Historical_Floor',
              'Margin_Floor_15pct', 'Est_Margin_SEK', 'Net_Premium_After_Costs', 'Annualized_ROM_Pct'
            ];

            if (numericFields.includes(fieldName) && value !== '') {
              const num = parseFloat(String(value));
              return isNaN(num) ? 0 : num;
            }
            return String(value || '').trim();
          },
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('Margin CSV parsing warnings:', results.errors);
              const criticalErrors = results.errors.filter(e => e.type === 'Delimiter' || e.type === 'Quotes');
              if (criticalErrors.length > 0) {
                setError(`Margin CSV parsing errors: ${criticalErrors.map(e => e.message).join(', ')}`);
                setIsLoading(false);
                marginDataSingleton.isLoading = false;
                return;
              }
            }

            if (results.data && results.data.length > 0) {
              console.log(`✅ Parsed ${results.data.length} margin requirements rows from CSV - STORING IN SINGLETON`);
              const parsedData = results.data as MarginRequirementsData[];

              // Store in singleton to prevent re-loading
              marginDataSingleton.data = parsedData;
              marginDataSingleton.loaded = true;
              marginDataSingleton.isLoading = false;
              marginDataSingleton.error = null;

              // Update component state
              setData(parsedData);
              setIsLoading(false);
              setError(null);
              return; // Successfully loaded, exit the retry loop
            } else {
              throw new Error('No margin requirements data found in CSV');
            }
          },
          error: (error) => {
            throw new Error(`Failed to parse margin CSV: ${error.message}`);
          }
        });

        // If we get here, parsing was successful, so we can break
        break;

      } catch (error) {
        console.warn(`❌ Failed to load margin data from ${url}:`, error);
        lastError = error as Error;
        continue;
      }
    }

    // Only set error if no successful load happened
    if (!marginDataSingleton.loaded || marginDataSingleton.data.length === 0) {
      console.warn('❌ All margin CSV loading attempts failed, current singleton data length:', marginDataSingleton.data.length);
      const errorMsg = `Failed to load margin requirements data from any source. Last error: ${lastError?.message}`;
      setError(errorMsg);
      marginDataSingleton.error = errorMsg;
    }

    setIsLoading(false);
    marginDataSingleton.isLoading = false;
  }, []);

  useEffect(() => {
    console.log('🚀 useMarginRequirementsData useEffect triggered, singleton loaded:', marginDataSingleton.loaded, 'data length:', marginDataSingleton.data.length);

    // Use singleton data if available
    if (marginDataSingleton.loaded && marginDataSingleton.data.length > 0) {
      console.log('📋 Using cached margin data from singleton:', marginDataSingleton.data.length);
      setData(marginDataSingleton.data);
      setIsLoading(marginDataSingleton.isLoading);
      setError(marginDataSingleton.error);
      return;
    }

    let mounted = true;

    const loadData = async () => {
      if (!mounted) {
        console.log('⚠️ Component unmounted, aborting margin data load');
        return;
      }

      console.log('📥 Starting margin data load...');
      try {
        await loadMarginDataFromGitHub();
      } catch (error) {
        console.warn('❌ useEffect: All margin CSV loading attempts failed:', error);
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
    loadMarginDataFromGitHub,
    setData: (newData: MarginRequirementsData[]) => {
      setData(newData);
      marginDataSingleton.data = newData;
      marginDataSingleton.loaded = newData.length > 0;
    }
  };
};
