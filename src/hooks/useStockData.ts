import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { StockData, StockSummary } from '@/types/stock';

export const useStockData = () => {
  const [allStockData, setAllStockData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStockData();
  }, []);

  const loadStockData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try multiple fallback URLs for better reliability on GitHub Pages
      const urls = [
        `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/stock_data.csv?${Date.now()}`,
        `${window.location.origin}${import.meta.env.BASE_URL}data/stock_data.csv?${Date.now()}`
      ];
      
      let lastError: Error | null = null;
      let response: Response | null = null;
      
      for (const url of urls) {
        try {
          console.log('🔗 Trying stock data URL:', url);
          response = await fetch(url);
          if (response.ok) {
            console.log('✅ Successfully loaded CSV from:', url);
            break;
          }
        } catch (error) {
          console.warn('❌ Failed to load from:', url, error);
          lastError = error as Error;
        }
      }
      
      if (!response || !response.ok) {
        throw lastError || new Error('Failed to load stock data from any URL');
      }
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        delimiter: '|',
        skipEmptyLines: true,
        transform: (value, field) => {
          if (field === 'open' || field === 'high' || field === 'low' || field === 'close' || field === 'volume' || field === 'pct_change_close') {
            // Handle empty values in numeric fields
            if (value === '' || value === null || value === undefined) {
              return field === 'volume' ? 0 : null;
            }
            return parseFloat(value);
          }
          return value;
        },
        complete: (results) => {
          console.log('Raw CSV data loaded:', results.data.slice(0, 5)); // First 5 rows
          console.log('Total rows loaded:', results.data.length);
          
          // Debug: Check for AAK AB data specifically
          const aakData = results.data.filter((row: any) => row.name === 'AAK AB');
          console.log('AAK AB data found:', aakData.length, 'rows');
          console.log('Latest AAK AB entries:', aakData.slice(-5));
          
          setAllStockData(results.data as StockData[]);
          setIsLoading(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setError('Failed to parse stock data');
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error loading stock data:', error);
      setError('Failed to load stock data');
      setIsLoading(false);
    }
  };

  const getStockData = (stockName: string): StockData[] => {
    return allStockData
      .filter(data => data.name === stockName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getLowPriceForPeriod = (stockName: string, periodDays: number): number | null => {
    const stockData = getStockData(stockName);
    if (stockData.length === 0) return null;

    const periodAgo = new Date();
    periodAgo.setDate(periodAgo.getDate() - periodDays);

    const recentData = stockData.filter(d => new Date(d.date) >= periodAgo);
    if (recentData.length === 0) return null;

    const prices = recentData.map(d => d.low);
    return Math.min(...prices);
  };

  const getPriceRangeForPeriod = (stockName: string, periodDays: number): { high: number; low: number } | null => {
    const stockData = getStockData(stockName);
    if (stockData.length === 0) return null;

    const periodAgo = new Date();
    periodAgo.setDate(periodAgo.getDate() - periodDays);

    const recentData = stockData.filter(d => new Date(d.date) >= periodAgo);
    if (recentData.length === 0) return null;

    const highs = recentData.map(d => d.high);
    const lows = recentData.map(d => d.low);
    return {
      high: Math.max(...highs),
      low: Math.min(...lows)
    };
  };

  const getStockSummary = (stockName: string): StockSummary | null => {
    const stockData = getStockData(stockName);
    if (stockData.length === 0) return null;

    console.log(`Stock data for ${stockName}:`, stockData.slice(-5)); // Last 5 data points
    console.log(`Latest data for ${stockName}:`, stockData[stockData.length - 1]);

    const latestData = stockData[stockData.length - 1];
    const previousData = stockData[stockData.length - 2];

    const priceChange = previousData ? latestData.close - previousData.close : 0;
    const priceChangePercent = previousData ? (priceChange / previousData.close) * 100 : 0;

    // Calculate price changes for different periods
    const currentDate = new Date(latestData.date);

    // Last trading day of previous week (find last data point before current week's Monday)
    const startOfCurrentWeek = new Date(currentDate);
    const dayOfWeek = startOfCurrentWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - daysToMonday);
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    const previousWeekData = stockData
      .filter(d => new Date(d.date) < startOfCurrentWeek)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const priceChangePercentWeek = previousWeekData
      ? ((latestData.close - previousWeekData.close) / previousWeekData.close) * 100
      : 0;

    // Last trading day of previous month
    const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const previousMonthData = stockData
      .filter(d => new Date(d.date) < startOfCurrentMonth)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const priceChangePercentMonth = previousMonthData
      ? ((latestData.close - previousMonthData.close) / previousMonthData.close) * 100
      : 0;

    // Last trading day of previous year
    const startOfCurrentYear = new Date(currentDate.getFullYear(), 0, 1);
    const previousYearData = stockData
      .filter(d => new Date(d.date) < startOfCurrentYear)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const priceChangePercentYear = previousYearData
      ? ((latestData.close - previousYearData.close) / previousYearData.close) * 100
      : 0;

    // Calculate 52-week high and low using OHLC data
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentData = stockData.filter(d => new Date(d.date) >= oneYearAgo);
    const highs = recentData.map(d => d.high);
    const lows = recentData.map(d => d.low);

    const highPrice52Week = Math.max(...highs);
    const lowPrice52Week = Math.min(...lows);

    // Calculate volatility (standard deviation of daily returns)
    const returns = recentData.slice(1).map((d, i) => 
      (d.close - recentData[i].close) / recentData[i].close
    );
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility

    // Calculate median volume
    const volumes = recentData.map(d => d.volume).sort((a, b) => a - b);
    const medianVolume = volumes.length % 2 === 0 
      ? (volumes[volumes.length / 2 - 1] + volumes[volumes.length / 2]) / 2
      : volumes[Math.floor(volumes.length / 2)];

    return {
      name: stockName,
      currentPrice: latestData.close,
      priceChange,
      priceChangePercent,
      priceChangePercentWeek,
      priceChangePercentMonth,
      priceChangePercentYear,
      volume: latestData.volume,
      medianVolume,
      highPrice52Week,
      lowPrice52Week,
      volatility
    };
  };

  const getAllStockNames = (): string[] => {
    const uniqueNames = Array.from(new Set(allStockData.map(d => d.name)));
    return uniqueNames.sort();
  };

  return {
    allStockData,
    isLoading,
    error,
    getStockData,
    getStockSummary,
    getLowPriceForPeriod,
    getPriceRangeForPeriod,
    loadStockData,
    getAllStockNames
  };
};