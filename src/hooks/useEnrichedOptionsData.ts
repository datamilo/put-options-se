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

      if (!matchingIVData) {
        console.log('⚠️ No IV data found for option:', option.OptionName);
      }

      // Calculate potential loss at lower bound - following exact Python logic
      let potentialLossAtLowerBound = 0;
      if (matchingIVData?.LowerBoundClosestToStrike) {
        const numberOfContracts = option.NumberOfContractsBasedOnLimit || 0;
        
        // Debug Evolution AB specifically
        if (option.OptionName === 'EVO5U770') {
          console.log('🎯 Evolution AB Debug:', {
            optionName: option.OptionName,
            numberOfContracts,
            lowerBoundClosestToStrike: matchingIVData.LowerBoundClosestToStrike,
            underlyingValue,
            premium: option.Premium,
            expectedStep1: 3 * 762.7 * 100, // Should be 228810
            expectedStep2: 228810 - 231000, // Should be -2190
            expectedStep3: 1777 + (-2190) // Should be -413
          });
        }
        
        // Step 1: UnderlyingValue_LowerBound_ClosestToStrike = numberOfContracts * LowerBoundClosestToStrike * 100
        const underlyingValueLowerBoundClosestToStrike = numberOfContracts * matchingIVData.LowerBoundClosestToStrike * 100;
        
        // Step 2: Loss_LowerBound_ClosestToStrike = UnderlyingValue_LowerBound_ClosestToStrike - Underlying Value (Investment)
        const lossLowerBoundClosestToStrike = underlyingValueLowerBoundClosestToStrike - underlyingValue;
        
        // Step 3: Potential Loss At Lower Bound = Premium + Loss_LowerBound_ClosestToStrike
        potentialLossAtLowerBound = option.Premium + lossLowerBoundClosestToStrike;
        
        // Step 4: If negative, apply transaction cost calculation
        if (potentialLossAtLowerBound < 0) {
          potentialLossAtLowerBound = potentialLossAtLowerBound - (potentialLossAtLowerBound * 0.000075 + transactionCost);
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