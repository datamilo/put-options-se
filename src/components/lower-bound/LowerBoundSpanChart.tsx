/**
 * Lower Bound Span Percentage Chart Component
 * Displays the prediction span percentage (min to max bound range) for each expiry date
 * Positioned directly below the Distribution chart with aligned x-axis for easy comparison
 */

import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { LowerBoundExpiryStatistic } from '@/types/lowerBound';

interface LowerBoundSpanChartProps {
  data: LowerBoundExpiryStatistic[];
  stock: string;
  isLoading?: boolean;
}

export const LowerBoundSpanChart: React.FC<LowerBoundSpanChartProps> = ({
  data,
  stock,
  isLoading = false,
}) => {
  // Get expiry stats for this stock and calculate span percentages
  const spanData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter((d) => d.Stock === stock)
      .map((stat) => {
        const minBound = parseFloat(stat.LowerBound_Min);
        const maxBound = parseFloat(stat.LowerBound_Max);

        // Calculate span percentage: ((max - min) / min) * 100
        let spanPercentage = 0;
        if (!isNaN(minBound) && !isNaN(maxBound) && minBound > 0) {
          spanPercentage = ((maxBound - minBound) / minBound) * 100;
        }

        return {
          expiryDate: stat.ExpiryDate,
          spanPercentage,
          minBound,
          maxBound,
        };
      })
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }, [data, stock]);

  const plotlyData = useMemo(() => {
    if (spanData.length === 0) return [];

    return [
      {
        x: spanData.map((d) => d.expiryDate),
        y: spanData.map((d) => d.spanPercentage),
        type: 'bar',
        name: 'Span %',
        marker: {
          color: 'rgb(76, 175, 80)',
          opacity: 0.8,
        },
        hovertemplate:
          '<b>%{x}</b><br>Span: %{y:.2f}%<extra></extra>',
      },
    ];
  }, [spanData]);

  const layout = useMemo(() => {
    if (spanData.length === 0) {
      return {
        title: 'Prediction Span Percentage (No data)',
        xaxis: { title: 'Expiry Date' },
        yaxis: { title: 'Span %' },
        height: 350,
        template: 'plotly_white',
      };
    }

    const minDate = spanData[0].expiryDate;
    const maxDate = spanData[spanData.length - 1].expiryDate;

    return {
      title: `<b>${stock} - Prediction Span Percentage by Expiry</b><br><sub>Span % = (Max Bound - Min Bound) / Min Bound × 100</sub>`,
      xaxis: {
        title: 'Expiry Date',
        range: [minDate, maxDate],
        tickformat: '%Y-%m-%d',
        nticks: 20,
        tickangle: -45,
      },
      yaxis: {
        title: 'Span Percentage (%)',
      },
      height: 350,
      template: 'plotly_white',
      hovermode: 'x unified',
      margin: {
        l: 60,
        r: 40,
        t: 80,
        b: 80,
      },
    };
  }, [spanData, stock]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
        <p className="text-slate-500">Loading span data...</p>
      </div>
    );
  }

  if (spanData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
        <p className="text-slate-500">No span data available for this stock</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Plot
        data={plotlyData}
        layout={layout}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
        }}
        style={{ width: '100%', height: '350px' }}
      />
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p>
          <strong>Span Percentage</strong> shows the range of predicted lower bounds as a percentage of the minimum value.
        </p>
        <p>
          <strong>Higher percentages</strong> indicate wider prediction ranges (more uncertainty about the actual bound).
        </p>
        <p>
          <strong>Lower percentages</strong> indicate tighter prediction ranges (more confidence in the bound estimate).
        </p>
      </div>
    </div>
  );
};
