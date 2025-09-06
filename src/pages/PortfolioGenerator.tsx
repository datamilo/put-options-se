import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { OptionData } from "@/types/options";
import { useOptionsData } from "@/hooks/useOptionsData";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PortfolioGenerator = () => {
  console.log('🎯 PortfolioGenerator component starting render');
  const navigate = useNavigate();
  console.log('🎯 Navigation hook loaded');

  // Test useOptionsData hook
  try {
    const { data: rawData, isLoading, error } = useOptionsData();
    console.log('📊 Options data:', { rawDataLength: rawData?.length, isLoading, error });
    
    if (error) {
      return (
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Button>
            <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
          </div>
          <div className="text-center text-red-500">
            Error loading options data: {error}
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Button>
            <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
          </div>
          <div className="text-center">
            Loading options data...
          </div>
        </div>
      );
    }

    // Test manual recalculation instead of useRecalculatedOptions hook
    try {
      const { underlyingValue, transactionCost } = useSettings();
      console.log('📊 Settings loaded:', { underlyingValue, transactionCost });

      // Manual recalculation (bypassing the problematic hook)
      const recalculatedData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];
        
        return rawData.map(option => {
          const numberOfContractsBasedOnLimit = Math.round((underlyingValue / option.StrikePrice) / 100);
          const bidAskMidPrice = (option.Bid + (option.Ask || option.Bid)) / 2;
          const recalculatedPremium = Math.round((bidAskMidPrice * numberOfContractsBasedOnLimit * 100) - transactionCost);

          return {
            ...option,
            Premium: recalculatedPremium,
            NumberOfContractsBasedOnLimit: numberOfContractsBasedOnLimit,
            Bid_Ask_Mid_Price: bidAskMidPrice,
          };
        });
      }, [rawData, underlyingValue, transactionCost]);

      console.log('📊 Manual recalculation successful:', { dataLength: recalculatedData?.length });

      return (
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Button>
            <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
          </div>
          
          <div className="text-center">
            <p>Options data loaded successfully: {rawData?.length || 0} options</p>
            <p>Recalculated data: {recalculatedData?.length || 0} options</p>
            <p>✅ Manual recalculation working! Issue was in useRecalculatedOptions hook.</p>
          </div>
        </div>
      );
    } catch (error) {
      console.error('❌ Error in manual recalculation:', error);
      return (
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Button>
            <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
          </div>
          <div className="text-center text-red-500">
            Error in manual recalculation: {String(error)}
          </div>
        </div>
      );
    }
  } catch (error) {
    console.error('❌ Error in useOptionsData:', error);
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
          <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
        </div>
        <div className="text-center text-red-500">
          Error in useOptionsData hook: {String(error)}
        </div>
      </div>
    );
  }
};

export default PortfolioGenerator;