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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface OptionsChartProps {
  data: OptionData[];
}

export const OptionsChart = ({ data }: OptionsChartProps) => {
  const { t } = useTranslation('pages');
  const [selectedProbFields, setSelectedProbFields] = useState<string[]>(['ProbWorthless_Bayesian_IsoCal']);

  const probabilityFields = [
    { value: '1_2_3_ProbOfWorthless_Weighted', label: t('recommendations.explanation.methodWeighted') },
    { value: 'ProbWorthless_Bayesian_IsoCal', label: t('recommendations.explanation.methodBayesian') },
    { value: '1_ProbOfWorthless_Original', label: t('recommendations.explanation.methodOriginal') },
    { value: '2_ProbOfWorthless_Calibrated', label: t('recommendations.explanation.methodCalibrated') },
    { value: '3_ProbOfWorthless_Historical_IV', label: t('recommendations.explanation.methodHistoricalIV') },
  ];

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const scatterData = data.map(option => {
    const dataPoint: any = {
      name: option.OptionName,
      x: option.Premium,
      z: option.DaysToExpiry,
      stockName: option.StockName,
    };

    selectedProbFields.forEach(field => {
      dataPoint[field] = option[field as keyof OptionData] as number;
    });

    return dataPoint;
  });

  const getPowLabel = (fieldValue: string): string => {
    const field = probabilityFields.find(f => f.value === fieldValue);
    return field ? field.label : fieldValue;
  };

  const toggleProbField = (field: string) => {
    setSelectedProbFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <CardTitle>{t('optionsChart.scatterTitle')}</CardTitle>
        <div className="space-y-2">
          <Label>{t('optionsChart.selectProbFields')}</Label>
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
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name={t('optionDetails.kpi.premium')}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              type="number"
              name={t('optionsChart.probAxisName')}
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
                          <span className="font-medium">{t('optionsChart.tooltipPremium')}</span> {Number(data.x).toLocaleString('sv-SE')}
                        </div>
                        {selectedProbFields.map((field) => (
                          <div key={field} className="text-sm">
                            <span className="font-medium">{getPowLabel(field)}:</span> {(Number(data[field]) * 100).toFixed(2)}%
                          </div>
                        ))}
                        <div className="text-sm">
                          <span className="font-medium">{t('optionsChart.tooltipDaysToExpiry')}</span> {data.z}
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
                name={getPowLabel(field)}
                data={scatterData}
                dataKey={field}
                fill={colors[index % colors.length]}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
