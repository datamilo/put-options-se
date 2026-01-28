import { useEffect, useState, useMemo } from 'react';
import { ScoredOptionData, RawScoredOptionRow } from '@/types/scoredOptions';
import { useEnrichedOptionsData } from './useEnrichedOptionsData';

/**
 * Load scored options from CSV and enrich with website premium data
 *
 * CRITICAL: Premium field
 * - CSV contains stale/incorrect premium data
 * - Always use premium from useEnrichedOptionsData hook
 * - Join by matching option_name === OptionName
 */
export const useScoredOptionsData = () => {
  const [rawData, setRawData] = useState<ScoredOptionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: enrichedData } = useEnrichedOptionsData();

  // Helper to parse float and convert NaN to null
  const safeParseFloat = (value: string): number | null => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          'https://raw.githubusercontent.com/DataMilo/put-options-se/main/data/current_options_scored.csv'
        );

        if (!response.ok) {
          throw new Error(`Failed to load CSV: ${response.statusText}`);
        }

        const csv = await response.text();
        const lines = csv.trim().split('\n');

        if (lines.length < 2) {
          throw new Error('CSV file is empty or malformed');
        }

        // Parse header (pipe-delimited)
        const headers = lines[0].split('|').map((h) => h.trim());

        // Parse data rows
        const parsedData: ScoredOptionData[] = lines.slice(1).map((line) => {
          const values = line.split('|').map((v) => v.trim());
          const row = Object.fromEntries(
            headers.map((header, index) => [header, values[index]])
          ) as unknown as RawScoredOptionRow;

          return {
            date: row.date,
            stock_name: row.stock_name,
            option_name: row.option_name,
            strike_price: safeParseFloat(row.strike_price) || 0,
            expiry_date: row.expiry_date,
            days_to_expiry: parseInt(row.days_to_expiry, 10),
            current_probability: safeParseFloat(row.current_probability) || 0,
            v21_score: safeParseFloat(row.v21_score),
            v21_bucket: row.v21_bucket,
            v21_historical_peak: safeParseFloat(row.v21_historical_peak),
            v21_support_strength: safeParseFloat(row.v21_support_strength),
            ta_probability: safeParseFloat(row.ta_probability),
            ta_bucket: row.ta_bucket,
            RSI_14: safeParseFloat(row.RSI_14),
            RSI_Slope: safeParseFloat(row.RSI_Slope),
            MACD_Hist: safeParseFloat(row.MACD_Hist),
            MACD_Slope: safeParseFloat(row.MACD_Slope),
            BB_Position: safeParseFloat(row.BB_Position),
            Dist_SMA50: safeParseFloat(row.Dist_SMA50),
            Vol_Ratio: safeParseFloat(row.Vol_Ratio),
            Sigma_Distance: safeParseFloat(row.Sigma_Distance),
            HV_annual: safeParseFloat(row.HV_annual),
            models_agree: row.models_agree === 'True',
            agreement_strength: row.agreement_strength as 'Strong' | 'Moderate' | 'Weak',
            combined_score: safeParseFloat(row.combined_score) || 0,
            premium: 0, // Will be enriched below
          };
        });

        setRawData(parsedData);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error loading CSV';
        console.error('Error loading scored options CSV:', message);
        setError(message);
        setRawData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Enrich with premium data from website
  const data = useMemo(() => {
    if (rawData.length === 0 || !enrichedData || enrichedData.length === 0) {
      return rawData;
    }

    console.log('🔄 Enriching scored options with website premium data...', {
      scoredOptionsCount: rawData.length,
      enrichedDataCount: enrichedData.length,
    });

    return rawData.map((option) => {
      // Find matching option in enriched data by option name
      const matchingOption = enrichedData.find(
        (opt) => opt.OptionName === option.option_name
      );

      if (!matchingOption) {
        console.log('⚠️ No enriched data found for option:', option.option_name);
      }

      return {
        ...option,
        premium: matchingOption?.Premium || 0,
      };
    });
  }, [rawData, enrichedData]);

  return { data, isLoading, error };
};
