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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface OptionsChartProps {
  data: OptionData[];
}

export const OptionsChart = ({ data }: OptionsChartProps) => {
  const [selectedProbField, setSelectedProbField] = useState<string>('ProbOfWorthless');
  
  const probabilityFields = [
    { value: 'ProbFinal_Weighted', label: 'Prob Final Weighted' },
    { value: 'ProbWorthless_Bayesian_IsoCal', label: 'Prob Worthless Bayesian IsoCal' },
    { value: 'ProbOfWorthless', label: 'Prob of Worthless' },
    { value: 'ProbCalibrated', label: 'Prob Calibrated' },
    { value: 'EstimatedProbAboveStrike', label: 'Estimated Prob Above Strike' },
  ];

  const scatterData = data.map(option => ({
    name: option.OptionName,
    x: option.Premium,
    y: option[selectedProbField as keyof OptionData] as number,
    z: option.DaysToExpiry,
    stockName: option.StockName,
  }));

  const selectedFieldValue = selectedProbField as keyof OptionData;
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

  return (
    <Tabs defaultValue="scatter" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="scatter">Risk vs Premium</TabsTrigger>
        <TabsTrigger value="distribution">Risk Distribution</TabsTrigger>
      </TabsList>
      
      <TabsContent value="scatter">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Premium vs Probability of Worthless</CardTitle>
            <Select value={selectedProbField} onValueChange={setSelectedProbField}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {probabilityFields.map((field) => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  dataKey="y" 
                  name="Prob of Worthless"
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'y') return [`${(Number(value) * 100).toFixed(2)}%`, 'Risk Level'];
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
                <Scatter name="Options" dataKey="y" fill="hsl(var(--primary))" />
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