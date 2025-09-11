import { useMemo } from 'react';
import { OptionData } from '@/types/options';
import { useOptionsData } from './useOptionsData';
import { useIVData } from './useIVData';
import { useSettings } from '@/contexts/SettingsContext';

export const useEnrichedOptionsData = () => {
  const { data: optionsData, isLoading: isOptionsLoading, error: optionsError, ...optionsMethods } = useOptionsData();
  const { data: ivData, isLoading: isIVLoading, error: ivError } = useIVData();
  const { underlyingValue } = useSettings();

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

      // Calculate potential loss at lower bound using Python logic
      let potentialLossAtLowerBound = 0;
      if (matchingIVData?.LowerBoundClosestToStrike) {
        const numberOfContracts = option.NumberOfContractsBasedOnLimit || 0;
        
        // Step 1: UnderlyingValue_LowerBound_ClosestToStrike = Number Of Contracts * Lower Bound Closest To Strike * 100
        const underlyingValueLowerBound = numberOfContracts * matchingIVData.LowerBoundClosestToStrike * 100;
        
        // Step 2: Underlying Stock Value = Number Of Contracts * Strike Price * 100
        const underlyingStockValue = numberOfContracts * option.StrikePrice * 100;
        
        // Step 3: Loss_LowerBound_ClosestToStrike = UnderlyingValue_LowerBound_ClosestToStrike - Underlying Stock Value
        const lossLowerBound = underlyingValueLowerBound - underlyingStockValue;
        
        // Step 4: Potential Loss At Lower Bound = Premium + Loss_LowerBound_ClosestToStrike
        potentialLossAtLowerBound = option.Premium + lossLowerBound;
        
        // Step 5: If result >= Premium, cap it at the Premium
        if (potentialLossAtLowerBound >= option.Premium) {
          potentialLossAtLowerBound = option.Premium;
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
  }, [optionsData, ivData, underlyingValue]);

  return {
    data: enrichedData,
    isLoading: isOptionsLoading || isIVLoading,
    error: optionsError || ivError,
    ...optionsMethods
  };
};