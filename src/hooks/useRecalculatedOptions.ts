import { useMemo } from 'react';
import { OptionData } from '@/types/options';
import { useSettings } from '@/contexts/SettingsContext';

export interface RecalculatedOptionData extends OptionData {
  originalPremium: number;
  recalculatedPremium: number;
  recalculatedNumberOfContracts: number;
  recalculatedBid_Ask_Mid_Price: number;
}

export const useRecalculatedOptions = (options: OptionData[]): RecalculatedOptionData[] => {
  const { underlyingValue, transactionCost } = useSettings();

  return useMemo(() => {
    console.log('useRecalculatedOptions: Recalculating with underlyingValue:', underlyingValue, 'transactionCost:', transactionCost, 'options count:', options.length);
    return options.map(option => {
      // Recalculate based on the new underlying value
      const numberOfContractsBasedOnLimit = Math.round((underlyingValue / option.StrikePrice) / 100);
      const bidAskMidPrice = (option.Bid + (option.Ask || option.Bid)) / 2;
      
      // Use configurable transaction cost
      const recalculatedPremium = Math.round((bidAskMidPrice * numberOfContractsBasedOnLimit * 100) - transactionCost);

      // Calculate SEK loss fields for the new decline percentage fields
      const calcLossAtDecline = (declinePct: number | undefined | null): number | null => {
        if (declinePct == null) return null;
        const stockAfter = option.StockPrice * (1 + declinePct);
        return Math.min(0, (stockAfter - option.StrikePrice) * numberOfContractsBasedOnLimit * 100);
      };

      return {
        ...option,
        originalPremium: option.Premium,
        recalculatedPremium,
        recalculatedNumberOfContracts: numberOfContractsBasedOnLimit,
        recalculatedBid_Ask_Mid_Price: bidAskMidPrice,
        // Override the Premium field with the recalculated value
        Premium: recalculatedPremium,
        NumberOfContractsBasedOnLimit: numberOfContractsBasedOnLimit,
        Bid_Ask_Mid_Price: bidAskMidPrice,
        LossAtIV2sigmaDecline: calcLossAtDecline(option.IV_2sigma_Decline),
        LossAtCVaR10pctDecline: calcLossAtDecline(option.CVaR10pct_Decline),
      };
    });
  }, [options, underlyingValue, transactionCost]);
};