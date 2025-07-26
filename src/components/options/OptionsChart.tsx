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

interface OptionsChartProps {
  data: OptionData[];
}

export const OptionsChart = ({ data }: OptionsChartProps) => {
  const scatterData = data.map(option => ({
    name: option.OptionName,
    x: option.Premium,
    y: option.ProbOfWorthless,
    z: option.DaysToExpiry,
    stockName: option.StockName,
  }));

  const riskDistribution = data.reduce((acc, option) => {
    const riskLevel = 
      option.ProbOfWorthless < 0.3 ? 'High Risk' :
      option.ProbOfWorthless < 0.6 ? 'Medium Risk' : 'Low Risk';
    
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
          <CardHeader>
            <CardTitle>Premium vs Probability of Worthless</CardTitle>
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