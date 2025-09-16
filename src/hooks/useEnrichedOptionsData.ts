import { useMemo } from 'react';
import { OptionData } from '@/types/options';
import { useOptionsData } from './useOptionsData';
import { useRecalculatedOptions } from './useRecalculatedOptions';
import { useIVData } from './useIVData';
import { useSettings } from '@/contexts/SettingsContext';

export const useEnrichedOptionsData = () => {
  const { data: rawOptionsData, isLoading: isOptionsLoading, error: optionsError, ...optionsMethods } = useOptionsData();
  const optionsData = useRecalculatedOptions(rawOptionsData);
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
      let potentialLossAtLowerBound: number | null = null;
      if (matchingIVData?.LowerBoundClosestToStrike) {
        const numberOfContracts = option.NumberOfContractsBasedOnLimit || 0;
        
        // Step 1: Calculate "Underlying Value (Investment)" = StrikePrice * Number Of Contracts * 100
        const underlyingValueInvestment = option.StrikePrice * numberOfContracts * 100;
        
        // Step 2: UnderlyingValue_LowerBound_ClosestToStrike = numberOfContracts * LowerBoundClosestToStrike * 100
        const underlyingValueLowerBoundClosestToStrike = numberOfContracts * matchingIVData.LowerBoundClosestToStrike * 100;
        
        // Step 3: Loss_LowerBound_ClosestToStrike = UnderlyingValue_LowerBound_ClosestToStrike - Underlying Value (Investment)
        const lossLowerBoundClosestToStrike = underlyingValueLowerBoundClosestToStrike - underlyingValueInvestment;
        
        // Step 4: Potential Loss At IV Lower Bound = Premium + Loss_LowerBound_ClosestToStrike
        potentialLossAtLowerBound = option.Premium + lossLowerBoundClosestToStrike;
        
        // Step 5: Set positive values to zero
        if (potentialLossAtLowerBound >= 0) {
          potentialLossAtLowerBound = 0;
        }
        
        // Step 6: Apply transaction cost to negative values
        if (potentialLossAtLowerBound < 0) {
          potentialLossAtLowerBound = potentialLossAtLowerBound - (potentialLossAtLowerBound * 0.000075 + transactionCost);
        }
        
        // Debug for HOLMB5U356 specifically
        if (option.OptionName === 'HOLMB5U356') {
          console.log('🎯 HOLMB5U356 Debug - Full Calculation:', {
            optionName: option.OptionName,
            strikePrice: option.StrikePrice,
            numberOfContracts,
            lowerBoundClosestToStrike: matchingIVData.LowerBoundClosestToStrike,
            premium: option.Premium,
            transactionCost,
            '1_underlyingValueInvestment': underlyingValueInvestment,
            '2_underlyingValueLowerBoundClosestToStrike': underlyingValueLowerBoundClosestToStrike,
            '3_lossLowerBoundClosestToStrike': lossLowerBoundClosestToStrike,
            '4_beforeTransactionCost': option.Premium + lossLowerBoundClosestToStrike,
            '5_potentialLossAtLowerBound_FINAL': potentialLossAtLowerBound,
            expectedResult: -2402.8272,
            expectedCalc_step1: 356.0 * 3 * 100,
            expectedCalc_step2: 3 * 345.9 * 100,
            expectedCalc_step3: (3 * 345.9 * 100) - (356.0 * 3 * 100),
            expectedCalc_step4: 726 + ((3 * 345.9 * 100) - (356.0 * 3 * 100)),
            expectedCalc_step5: (726 + ((3 * 345.9 * 100) - (356.0 * 3 * 100))) - ((726 + ((3 * 345.9 * 100) - (356.0 * 3 * 100))) * 0.000075 + 99)
          });
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