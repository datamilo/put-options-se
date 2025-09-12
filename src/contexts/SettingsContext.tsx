import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface SettingsContextType {
  underlyingValue: number;
  setUnderlyingValue: (value: number) => void;
  transactionCost: number;
  setTransactionCost: (value: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { calculationSettings, saveCalculationSettings, isLoading } = useUserPreferences();
  const [underlyingValue, setUnderlyingValueState] = useState<number>(100000);
  const [transactionCost, setTransactionCostState] = useState<number>(150);

  // Sync with user preferences, fallback to localStorage for non-authenticated users
  useEffect(() => {
    if (!isLoading) {
      if (calculationSettings.underlyingValue !== 100000 || calculationSettings.transactionCost !== 150) {
        // User has saved preferences
        setUnderlyingValueState(calculationSettings.underlyingValue);
        setTransactionCostState(calculationSettings.transactionCost);
      } else {
        // Fallback to localStorage for initial load or non-authenticated users
        const savedUnderlyingValue = localStorage.getItem('underlyingValue');
        if (savedUnderlyingValue) {
          const parsed = parseInt(savedUnderlyingValue, 10);
          if (!isNaN(parsed) && parsed > 0) {
            setUnderlyingValueState(parsed);
          }
        }

        const savedTransactionCost = localStorage.getItem('transactionCost');
        if (savedTransactionCost) {
          const parsed = parseInt(savedTransactionCost, 10);
          if (!isNaN(parsed) && parsed >= 0) {
            setTransactionCostState(parsed);
          }
        }
      }
    }
  }, [calculationSettings, isLoading]);

  // Save to database and local state
  const setUnderlyingValue = (value: number) => {
    console.log('SettingsContext: Setting underlying value to', value, 'Previous value was:', underlyingValue);
    setUnderlyingValueState(value);
    
    // Always save to localStorage as backup
    localStorage.setItem('underlyingValue', value.toString());
    
    // Try to save to database if user is authenticated
    saveCalculationSettings({
      underlyingValue: value,
      transactionCost
    });
    console.log('SettingsContext: Updated both localStorage and database with:', value);
  };

  const setTransactionCost = (value: number) => {
    setTransactionCostState(value);
    
    // Always save to localStorage as backup
    localStorage.setItem('transactionCost', value.toString());
    
    // Try to save to database if user is authenticated
    saveCalculationSettings({
      underlyingValue,
      transactionCost: value
    });
  };

  return (
    <SettingsContext.Provider value={{ 
      underlyingValue, 
      setUnderlyingValue,
      transactionCost,
      setTransactionCost 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};