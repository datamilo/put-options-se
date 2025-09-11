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
    if (!optionsData.length || !ivData.length) {
      return optionsData;
    }

    console.log('🔄 Enriching options data with IV data...');
    
    return optionsData.map(option => {
      // Find matching IV data by OptionName and closest date
      const matchingIVData = ivData.find(iv => 
        iv.OptionName === option.OptionName
      );

      if (!matchingIVData) {
        return option;
      }

      // Calculate potential loss at lower bound using Python logic
      let potentialLossAtLowerBound = 0;
      if (matchingIVData.LowerBoundClosestToStrike && underlyingValue) {
        const numberOfContracts = option.NumberOfContractsBasedOnLimit || 0;
        
        // Step 1: UnderlyingValue_LowerBound_ClosestToStrike = Number Of Contracts * Lower Bound Closest To Strike * 100
        const underlyingValueLowerBound = numberOfContracts * matchingIVData.LowerBoundClosestToStrike * 100;
        
        // Step 2: Loss_LowerBound_ClosestToStrike = UnderlyingValue_LowerBound_ClosestToStrike - Värde_Underliggande
        const lossLowerBound = underlyingValueLowerBound - underlyingValue;
        
        // Step 3: Potential Loss At Lower Bound = Premium + Loss_LowerBound_ClosestToStrike
        potentialLossAtLowerBound = option.Premium + lossLowerBound;
        
        // Step 4: If result >= Premium, cap it at the Premium
        if (potentialLossAtLowerBound >= option.Premium) {
          potentialLossAtLowerBound = option.Premium;
        }
      }

      return {
        ...option,
        // Add IV data fields
        IV_ClosestToStrike: matchingIVData.IV_ClosestToStrike,
        IV_UntilExpiryClosestToStrike: matchingIVData.IV_UntilExpiryClosestToStrike,
        LowerBoundClosestToStrike: matchingIVData.LowerBoundClosestToStrike,
        LowerBoundDistanceFromCurrentPrice: matchingIVData.LowerBoundDistanceFromCurrentPrice,
        LowerBoundDistanceFromStrike: matchingIVData.LowerBoundDistanceFromStrike,
        ImpliedDownPct: matchingIVData.ImpliedDownPct,
        ToStrikePct: matchingIVData.ToStrikePct,
        SafetyMultiple: matchingIVData.SafetyMultiple,
        SigmasToStrike: matchingIVData.SigmasToStrike,
        ProbAssignment: matchingIVData.ProbAssignment,
        SafetyCategory: matchingIVData.SafetyCategory,
        CushionMinusIVPct: matchingIVData.CushionMinusIVPct,
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