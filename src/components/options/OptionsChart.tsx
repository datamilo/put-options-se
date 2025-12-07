import { OptionData } from "@/types/options";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface OptionsChartProps {
  data: OptionData[];
}

export const OptionsChart = ({ data }: OptionsChartProps) => {
  const [selectedProbFields, setSelectedProbFields] = useState<string[]>(['ProbWorthless_Bayesian_IsoCal']);
  
  const probabilityFields = [
    { value: '1_2_3_ProbOfWorthless_Weighted', label: 'PoW - Weighted Average' },
    { value: 'ProbWorthless_Bayesian_IsoCal', label: 'PoW - Bayesian Calibrated' },
    { value: '1_ProbOfWorthless_Original', label: 'PoW - Original Black-Scholes' },
    { value: '2_ProbOfWorthless_Calibrated', label: 'PoW - Bias Corrected' },
    { value: '3_ProbOfWorthless_Historical_IV', label: 'PoW - Historical IV' },
  ];

  const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'];
  
  const scatterData = data.map(option => {
    const dataPoint: any = {
      name: option.OptionName,
      x: option.Premium,
      z: option.DaysToExpiry,
      stockName: option.StockName,
    };
    
    // Add selected probability fields as separate y values
    selectedProbFields.forEach(field => {
      dataPoint[field] = option[field as keyof OptionData] as number;
    });
    
    return dataPoint;
  });

  // Use Bayesian field first, then weighted field as fallback
  const riskDistribution = data.reduce((acc, option) => {
    const probValue = option.ProbWorthless_Bayesian_IsoCal ?? option['1_2_3_ProbOfWorthless_Weighted'];
    const riskLevel = 
      probValue <= 0.6 ? 'High Risk' :
      probValue < 0.8 ? 'Medium Risk' : 'Low Risk';
    
    acc[riskLevel] = (acc[riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskData = Object.entries(riskDistribution).map(([risk, count]) => ({
    risk,
    count,
  }));

  const toggleProbField = (field: string) => {
    setSelectedProbFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  return (
    <Tabs defaultValue="scatter" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="scatter">Risk vs Premium</TabsTrigger>
        <TabsTrigger value="distribution">Risk Distribution</TabsTrigger>
      </TabsList>
      
      <TabsContent value="scatter">
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Premium vs Probability of Worthless</CardTitle>
            <div className="space-y-2">
              <Label>Select Probability Fields:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {probabilityFields.map((field) => (
                  <div key={field.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.value}
                      checked={selectedProbFields.includes(field.value)}
                      onCheckedChange={() => toggleProbField(field.value)}
                    />
                    <label htmlFor={field.value} className="text-sm cursor-pointer">
                      {field.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Premium" 
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis 
                  type="number" 
                  name="Prob of Worthless"
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <div className="font-semibold text-foreground mb-2">
                            {data.stockName} - {data.name}
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">Premium:</span> {Number(data.x).toLocaleString('sv-SE')}
                            </div>
                            {selectedProbFields.map((field) => (
                              <div key={field} className="text-sm">
                                <span className="font-medium">{field}:</span> {(Number(data[field]) * 100).toFixed(2)}%
                              </div>
                            ))}
                            <div className="text-sm">
                              <span className="font-medium">Days to Expiry:</span> {data.z}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {selectedProbFields.map((field, index) => (
                  <Scatter 
                    key={field}
                    name={field} 
                    data={scatterData}
                    dataKey={field} 
                    fill={colors[index % colors.length]} 
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="distribution">
        <Card>
          <CardHeader>
            <CardTitle>Options Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="risk" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};