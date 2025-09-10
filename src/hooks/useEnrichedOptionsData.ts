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

      // Calculate potential loss at lower bound
      let potentialLossAtLowerBound = 0;
      if (matchingIVData.LowerBoundClosestToStrike && underlyingValue) {
        // Calculate loss per share if stock drops to lower bound
        const lossPerShare = Math.max(0, option.StrikePrice - matchingIVData.LowerBoundClosestToStrike);
        // Calculate total loss based on number of contracts (100 shares per contract)
        const numberOfContracts = option.NumberOfContractsBasedOnLimit || 0;
        potentialLossAtLowerBound = lossPerShare * numberOfContracts * 100;
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