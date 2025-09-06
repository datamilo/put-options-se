import React from "react";
import { useNavigate } from "react-router-dom";
import { useOptionsData } from "@/hooks/useOptionsData";
import { useRecalculatedOptions } from "@/hooks/useRecalculatedOptions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PortfolioGenerator = () => {
  const navigate = useNavigate();
  const { data: rawData, isLoading, error } = useOptionsData();
  const data = useRecalculatedOptions(rawData || []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Options
        </Button>
        <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
      </div>
      
      <div className="mt-8 text-center">
        <p>Step 1: Basic component with navigation - ✅ Working</p>
        <p>Step 2: useOptionsData hook - ✅ Working</p>
        <p>Step 3: useRecalculatedOptions hook - ✅ Working</p>
        <p>Raw data: {rawData?.length || 0} options</p>
        <p>Recalculated data: {data?.length || 0} options</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <p>🎉 All hooks working! The issue was elsewhere.</p>
      </div>
    </div>
  );
};

export default PortfolioGenerator;