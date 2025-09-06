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
import { ArrowLeft, Target } from "lucide-react";

const PortfolioGenerator = () => {
  const navigate = useNavigate();
  const { data: rawData, isLoading, error } = useOptionsData();
  const data = useRecalculatedOptions(rawData || []);
  const { getLowPriceForPeriod } = useStockData();

  // Form state
  const [totalPremiumTarget, setTotalPremiumTarget] = useState<number>(500);

  const handleOptionClick = (option: OptionData) => {
    const optionId = encodeURIComponent(option.OptionName);
    navigate(`/option/${optionId}`);
  };

  const handleStockClick = (stockName: string) => {
    navigate(`/stock/${encodeURIComponent(stockName)}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Options
        </Button>
        <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Portfolio Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="totalPremium">Total Premium to Receive (SEK) *</Label>
            <Input
              id="totalPremium"
              type="number"
              min="500"
              value={totalPremiumTarget}
              onChange={(e) => setTotalPremiumTarget(parseInt(e.target.value) || 500)}
              placeholder="Minimum 500"
            />
          </div>
          
          <div className="text-center">
            <p>Testing OptionsTable component with first 10 options...</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test - First 10 Options</CardTitle>
        </CardHeader>
        <CardContent>
          <OptionsTable
            data={data.slice(0, 10)}
            onRowClick={handleOptionClick}
            onStockClick={handleStockClick}
            sortField={null}
            sortDirection="asc"
            onSortChange={() => {}}
            columnFilters={[]}
            onColumnFiltersChange={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioGenerator;