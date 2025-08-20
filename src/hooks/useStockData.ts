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
      
      // Load from local file
      const response = await fetch('/data/stock_data.csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        delimiter: '|',
        skipEmptyLines: true,
        transform: (value, field) => {
          if (field === 'close' || field === 'volume' || field === 'pct_change_close') {
            return parseFloat(value);
          }
          return value;
        },
        complete: (results) => {
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

  const getStockSummary = (stockName: string): StockSummary | null => {
    const stockData = getStockData(stockName);
    if (stockData.length === 0) return null;

    const latestData = stockData[stockData.length - 1];
    const previousData = stockData[stockData.length - 2];
    
    const priceChange = previousData ? latestData.close - previousData.close : 0;
    const priceChangePercent = previousData ? (priceChange / previousData.close) * 100 : 0;

    // Calculate 52-week high and low
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const recentData = stockData.filter(d => new Date(d.date) >= oneYearAgo);
    const prices = recentData.map(d => d.close);
    
    const highPrice52Week = Math.max(...prices);
    const lowPrice52Week = Math.min(...prices);

    // Calculate volatility (standard deviation of daily returns)
    const returns = recentData.slice(1).map((d, i) => 
      (d.close - recentData[i].close) / recentData[i].close
    );
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility

    return {
      name: stockName,
      currentPrice: latestData.close,
      priceChange,
      priceChangePercent,
      volume: latestData.volume,
      highPrice52Week,
      lowPrice52Week,
      volatility
    };
  };

  return {
    allStockData,
    isLoading,
    error,
    getStockData,
    getStockSummary,
    loadStockData
  };
};