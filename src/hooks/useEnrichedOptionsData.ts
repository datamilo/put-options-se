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

  const ivMap = useMemo(
    () => new Map(ivData.map(iv => [iv.OptionName, iv])),
    [ivData]
  );

  const enrichedData = useMemo(() => {
    if (!optionsData.length) {
      return optionsData;
    }

    return optionsData.map(option => {
      const matchingIVData = ivMap.get(option.OptionName);

      let potentialLossAtLowerBound: number | null = null;
      if (matchingIVData?.LowerBoundClosestToStrike) {
        const numberOfContracts = option.NumberOfContractsBasedOnLimit || 0;
        const underlyingValueInvestment = option.StrikePrice * numberOfContracts * 100;
        const underlyingValueLowerBoundClosestToStrike = numberOfContracts * matchingIVData.LowerBoundClosestToStrike * 100;
        const lossLowerBoundClosestToStrike = underlyingValueLowerBoundClosestToStrike - underlyingValueInvestment;
        potentialLossAtLowerBound = option.Premium + lossLowerBoundClosestToStrike;
        if (potentialLossAtLowerBound >= 0) {
          potentialLossAtLowerBound = 0;
        } else {
          potentialLossAtLowerBound = potentialLossAtLowerBound - (potentialLossAtLowerBound * 0.000075 + transactionCost);
        }
      }

      return {
        ...option,
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
        PotentialLossAtLowerBound: potentialLossAtLowerBound,
      };
    });
  }, [optionsData, ivMap, underlyingValue, transactionCost]);

  return {
    data: enrichedData,
    isLoading: isOptionsLoading || isIVLoading,
    error: optionsError || ivError,
    ...optionsMethods
  };
};