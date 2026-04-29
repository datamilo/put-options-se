import { useMemo } from 'react';
import { OptionData } from '@/types/options';
import { useOptionsData } from './useOptionsData';
import { useRecalculatedOptions } from './useRecalculatedOptions';
import { useIVData } from './useIVData';
import { useMarginRequirementsData } from './useMarginRequirementsData';
import { useSettings } from '@/contexts/SettingsContext';

export const useEnrichedOptionsData = () => {
  const { data: rawOptionsData, isLoading: isOptionsLoading, error: optionsError, ...optionsMethods } = useOptionsData();
  const optionsData = useRecalculatedOptions(rawOptionsData);
  const { data: ivData, isLoading: isIVLoading, error: ivError } = useIVData();
  const { data: marginData, isLoading: isMarginLoading, error: marginError } = useMarginRequirementsData();
  const { underlyingValue, transactionCost } = useSettings();

  // Pre-index into Maps for O(1) lookup instead of O(n) .find() per option
  const ivMap = useMemo(
    () => new Map(ivData.map(iv => [iv.OptionName, iv])),
    [ivData]
  );
  const marginMap = useMemo(
    () => new Map(marginData.map(m => [m.OptionName, m])),
    [marginData]
  );

  const enrichedData = useMemo(() => {
    if (!optionsData.length) {
      return optionsData;
    }

    return optionsData.map(option => {
      const matchingIVData = ivMap.get(option.OptionName);
      const matchingMarginData = marginMap.get(option.OptionName);

      // Calculate potential loss at lower bound - following exact Python logic
      let potentialLossAtLowerBound: number | null = null;
      if (matchingIVData?.LowerBoundClosestToStrike) {
        const numberOfContracts = option.NumberOfContractsBasedOnLimit || 0;

        // Step 1: Underlying Value (Investment) = StrikePrice * Number Of Contracts * 100
        const underlyingValueInvestment = option.StrikePrice * numberOfContracts * 100;

        // Step 2: UnderlyingValue_LowerBound_ClosestToStrike = numberOfContracts * LowerBoundClosestToStrike * 100
        const underlyingValueLowerBoundClosestToStrike = numberOfContracts * matchingIVData.LowerBoundClosestToStrike * 100;

        // Step 3: Loss_LowerBound_ClosestToStrike = UnderlyingValue_LowerBound - Underlying Value (Investment)
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
      }

      // Calculate estimated total margin requirement
      let estTotalMargin: number | null = null;
      if (matchingMarginData?.Est_Margin_SEK) {
        const numberOfContracts = option.NumberOfContractsBasedOnLimit || 0;
        estTotalMargin = Math.round(matchingMarginData.Est_Margin_SEK * numberOfContracts);
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
        // Add margin data fields (using null coalescing for left join behavior)
        Est_Margin_SEK: matchingMarginData?.Est_Margin_SEK ?? undefined,
        Prob_Normal_2SD_Decline_Pct: matchingMarginData?.Prob_Normal_2SD_Decline_Pct ?? undefined,
        Hist_Worst_Decline_Pct: matchingMarginData?.Hist_Worst_Decline_Pct ?? undefined,
        SRI_Base: matchingMarginData?.SRI_Base ?? undefined,
        Event_Buffer: matchingMarginData?.Event_Buffer ?? undefined,
        Final_SRI: matchingMarginData?.Final_SRI ?? undefined,
        OTM_Amount: matchingMarginData?.OTM_Amount ?? undefined,
        Margin_A_Broker_Proxy: matchingMarginData?.Margin_A_Broker_Proxy ?? undefined,
        Margin_B_Historical_Floor: matchingMarginData?.Margin_B_Historical_Floor ?? undefined,
        Margin_Floor_15pct: matchingMarginData?.Margin_Floor_15pct ?? undefined,
        Net_Premium_After_Costs: matchingMarginData?.Net_Premium_After_Costs ?? undefined,
        Annualized_ROM_Pct: matchingMarginData?.Annualized_ROM_Pct ?? undefined,
        // Add calculated fields
        PotentialLossAtLowerBound: potentialLossAtLowerBound,
        EstTotalMargin: estTotalMargin
      };
    });
  }, [optionsData, ivMap, marginMap, underlyingValue, transactionCost]);

  return {
    data: enrichedData,
    isLoading: isOptionsLoading || isIVLoading || isMarginLoading,
    error: optionsError || ivError || marginError,
    ...optionsMethods
  };
};