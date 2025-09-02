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
  const { underlyingValue } = useSettings();

  return useMemo(() => {
    return options.map(option => {
      // Recalculate based on the new underlying value
      const numberOfContractsBasedOnLimit = Math.round((underlyingValue / option.StrikePrice) / 100);
      const bidAskMidPrice = (option.Bid + (option.Ask || option.Bid)) / 2;
      
      // Assuming courtage is 0 for now (can be made configurable later)
      const courtage = 0;
      const recalculatedPremium = Math.round((bidAskMidPrice * numberOfContractsBasedOnLimit * 100) - courtage);

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
      };
    });
  }, [options, underlyingValue]);
};