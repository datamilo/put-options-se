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
  const [selectedProbFields, setSelectedProbFields] = useState<string[]>(['1_2_3_ProbOfWorthless_Weighted']);
  
  const probabilityFields = [
    { value: '1_2_3_ProbOfWorthless_Weighted', label: '1_2_3_ProbOfWorthless_Weighted' },
    { value: 'ProbWorthless_Bayesian_IsoCal', label: 'ProbWorthless_Bayesian_IsoCal' },
    { value: '1_ProbOfWorthless_Original', label: '1_ProbOfWorthless_Original' },
    { value: '2_ProbOfWorthless_Calibrated', label: '2_ProbOfWorthless_Calibrated' },
    { value: '3_ProbOfWorthless_Historical_IV', label: '3_ProbOfWorthless_Historical_IV' },
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

  // Use first selected field for risk distribution
  const selectedFieldValue = selectedProbFields[0] as keyof OptionData;
  const riskDistribution = data.reduce((acc, option) => {
    const probValue = option[selectedFieldValue] as number;
    const riskLevel = 
      probValue < 0.3 ? 'High Risk' :
      probValue < 0.6 ? 'Medium Risk' : 'Low Risk';
    
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
              <div className="grid grid-cols-2 gap-2">
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
                data={scatterData}
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
                  formatter={(value, name) => {
                    if (selectedProbFields.includes(name as string)) {
                      return [`${(Number(value) * 100).toFixed(2)}%`, name];
                    }
                    if (name === 'x') return [Number(value).toLocaleString(), 'Premium'];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `${payload[0].payload.stockName} - ${payload[0].payload.name}`;
                    }
                    return label;
                  }}
                />
                <Legend />
                {selectedProbFields.map((field, index) => (
                  <Scatter 
                    key={field}
                    name={field} 
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