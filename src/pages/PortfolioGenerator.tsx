import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OptionData } from "@/types/options";
import { useOptionsData } from "@/hooks/useOptionsData";
import { useRecalculatedOptions } from "@/hooks/useRecalculatedOptions";
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

    // Now test useRecalculatedOptions hook
    try {
      const data = useRecalculatedOptions(rawData || []);
      console.log('📊 Recalculated data:', { dataLength: data?.length });

  // Test if basic component renders
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
        <p>Recalculated data: {data?.length || 0} options</p>
        <p>✅ All hooks working! Ready to add full functionality.</p>
      </div>
    </div>
  );
    } catch (error) {
      console.error('❌ Error in useRecalculatedOptions:', error);
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
            Error in useRecalculatedOptions hook: {String(error)}
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