import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVolatilityData } from '@/hooks/useVolatilityData';
import { VolatilityStatsChart } from '@/components/volatility/VolatilityStatsChart';
import { VolatilityDataTable } from '@/components/volatility/VolatilityDataTable';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VolatilityAnalysis = () => {
  const navigate = useNavigate();
  const { volatilityData, volatilityStats, isLoading, error } = useVolatilityData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading volatility analysis data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Main Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate some summary statistics for display
  const totalEvents = volatilityData.length;
  const avgVolatility = volatilityStats.reduce((sum, stat) => sum + stat.mean_abs_change, 0) / volatilityStats.length;
  const highVolatilityStocks = volatilityStats.filter(stat => stat.mean_abs_change > avgVolatility).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/')} variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Options
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Event Volatility Analysis</h1>
                <p className="text-muted-foreground">Stock price behavior around corporate events</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {totalEvents.toLocaleString()} events analyzed
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Corporate events analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Volatility</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgVolatility.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Mean absolute price change
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Volatility Stocks</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highVolatilityStocks}</div>
              <p className="text-xs text-muted-foreground">
                Above average volatility
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Volatility Statistics Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Volatility Statistics Visualization</CardTitle>
            <p className="text-sm text-muted-foreground">
              Interactive charts showing price volatility patterns during corporate events
            </p>
          </CardHeader>
          <CardContent>
            <VolatilityStatsChart data={volatilityStats} />
          </CardContent>
        </Card>

        {/* Event Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Event Data Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete event-by-event data with filtering and sorting capabilities
            </p>
          </CardHeader>
          <CardContent>
            <VolatilityDataTable data={volatilityData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};