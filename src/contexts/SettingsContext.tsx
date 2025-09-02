import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  underlyingValue: number;
  setUnderlyingValue: (value: number) => void;
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

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedValue = localStorage.getItem('underlyingValue');
    if (savedValue) {
      const parsed = parseInt(savedValue, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setUnderlyingValueState(parsed);
      }
    }
  }, []);

  // Save to localStorage when value changes
  const setUnderlyingValue = (value: number) => {
    setUnderlyingValueState(value);
    localStorage.setItem('underlyingValue', value.toString());
  };

  return (
    <SettingsContext.Provider value={{ underlyingValue, setUnderlyingValue }}>
      {children}
    </SettingsContext.Provider>
  );
};