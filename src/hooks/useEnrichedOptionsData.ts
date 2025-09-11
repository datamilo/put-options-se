import { useMemo } from 'react';
import { OptionData } from '@/types/options';
import { useOptionsData } from './useOptionsData';
import { useIVData } from './useIVData';
import { useSettings } from '@/contexts/SettingsContext';

export const useEnrichedOptionsData = () => {
  const { data: optionsData, isLoading: isOptionsLoading, error: optionsError, ...optionsMethods } = useOptionsData();
  const { data: ivData, isLoading: isIVLoading, error: ivError } = useIVData();
  const { underlyingValue, transactionCost } = useSettings();

  const enrichedData = useMemo(() => {
    if (!optionsData.length) {
      return optionsData;
    }

    console.log('🔄 Enriching options data with IV data...', {
      optionsDataLength: optionsData.length,
      ivDataLength: ivData.length
    });
    
    return optionsData.map(option => {
      // Find matching IV data by OptionName only (left join)
      const matchingIVData = ivData.find(iv => 
        iv.OptionName === option.OptionName
      );

      // If no matching IV data, we'll set all IV fields to null/undefined

      // Calculate potential loss at lower bound - should be negative or zero
      let potentialLossAtLowerBound = 0;
      if (matchingIVData?.LowerBoundClosestToStrike) {
        const numberOfContracts = option.NumberOfContractsBasedOnLimit || 0;
        
        // If Lower Bound Closest To Strike is above strike price, no loss occurs
        if (matchingIVData.LowerBoundClosestToStrike >= option.StrikePrice) {
          potentialLossAtLowerBound = 0;
        } else {
          // Calculate loss when stock declines to Lower Bound Closest To Strike
          const underlyingValueAtLowerBound = numberOfContracts * matchingIVData.LowerBoundClosestToStrike * 100;
          const underlyingStockValue = numberOfContracts * option.StrikePrice * 100;
          
          // Loss is negative when lower bound is below strike price
          potentialLossAtLowerBound = underlyingValueAtLowerBound - underlyingStockValue;
          
          // Subtract transaction cost for negative values
          if (potentialLossAtLowerBound < 0) {
            potentialLossAtLowerBound = potentialLossAtLowerBound - (Math.abs(potentialLossAtLowerBound) * 0.000075 + transactionCost);
          }
        }
      }

      return {
        ...option,
        // Add IV data fields (using null coalescing for left join behavior)
        IV_ClosestToStrike: matchingIVData?.IV_ClosestToStrike ?? undefined,
        IV_UntilExpiryClosestToStrike: matchingIVData?.IV_UntilExpiryClosestToStrike ?? undefined,
        LowerBoundClosestToStrike: matchingIVData?.LowerBoundClosestToStrike ?? undefined,
        LowerBoundDistanceFromCurrentPrice: matchingIVData?.LowerBoundDistanceFromCurrentPrice ?? undefined,
        LowerBoundDistanceFromStrike: matchingIVData?.LowerBoundDistanceFromStrike ?? undefined,
        ImpliedDownPct: matchingIVData?.ImpliedDownPct ?? undefined,
        ToStrikePct: matchingIVData?.ToStrikePct ?? undefined,
        SafetyMultiple: matchingIVData?.SafetyMultiple ?? undefined,
        SigmasToStrike: matchingIVData?.SigmasToStrike ?? undefined,
        ProbAssignment: matchingIVData?.ProbAssignment ?? undefined,
        SafetyCategory: matchingIVData?.SafetyCategory ?? undefined,
        CushionMinusIVPct: matchingIVData?.CushionMinusIVPct ?? undefined,
        // Add calculated field
        PotentialLossAtLowerBound: potentialLossAtLowerBound
      };
    });
  }, [optionsData, ivData, underlyingValue, transactionCost]);

  return {
    data: enrichedData,
    isLoading: isOptionsLoading || isIVLoading,
    error: optionsError || ivError,
    ...optionsMethods
  };
};