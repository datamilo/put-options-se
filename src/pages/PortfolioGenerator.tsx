import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { OptionData } from "@/types/options";
import { OptionsTable } from "@/components/options/OptionsTable";
import { useOptionsData } from "@/hooks/useOptionsData";
import { useRecalculatedOptions } from "@/hooks/useRecalculatedOptions";
import { useStockData } from "@/hooks/useStockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Target, AlertTriangle } from "lucide-react";
import { toast } from "sonner";


const PortfolioGenerator = () => {
  const navigate = useNavigate();
  const { data: rawData, isLoading, error } = useOptionsData();
  const data = useRecalculatedOptions(rawData || []);
  const { getLowPriceForPeriod } = useStockData();

  // Form state
  const [totalPremiumTarget, setTotalPremiumTarget] = useState<number>(500);

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
        <p>Step 4: All imports and useState - ✅ Working</p>
        <p>Raw data: {rawData?.length || 0} options</p>
        <p>Recalculated data: {data?.length || 0} options</p>
        <p>Target premium: {totalPremiumTarget}</p>
        <p>Next: Add form UI...</p>
      </div>
    </div>
  );
};

export default PortfolioGenerator;