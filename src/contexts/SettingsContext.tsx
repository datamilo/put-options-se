import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [underlyingValue, setUnderlyingValueState] = useState<number>(100000);
  const [transactionCost, setTransactionCostState] = useState<number>(150);

  // Load settings from localStorage on mount
  useEffect(() => {
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
  }, []);

  // Save to localStorage when values change
  const setUnderlyingValue = (value: number) => {
    setUnderlyingValueState(value);
    localStorage.setItem('underlyingValue', value.toString());
  };

  const setTransactionCost = (value: number) => {
    setTransactionCostState(value);
    localStorage.setItem('transactionCost', value.toString());
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