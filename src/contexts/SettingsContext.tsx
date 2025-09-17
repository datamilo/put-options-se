import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  const userUpdateRef = useRef(false);
  const lastUserValueRef = useRef<{ underlyingValue: number; transactionCost: number }>({ underlyingValue: 100000, transactionCost: 150 });
  const hasInitializedRef = useRef(false);

  // Sync with user preferences, fallback to localStorage for non-authenticated users
  useEffect(() => {
    if (!isLoading) {
      console.log('SettingsContext: useEffect running', { 
        calculationSettings, 
        underlyingValue, 
        transactionCost,
        userUpdate: userUpdateRef.current,
        hasInitialized: hasInitializedRef.current,
        lastUserValue: lastUserValueRef.current
      });
      
      // Only sync from database on initial load or if the database value matches what the user last set
      if (!hasInitializedRef.current || !userUpdateRef.current) {
        // Initial load - sync from database if available, otherwise localStorage
        if (calculationSettings.underlyingValue !== 100000 || calculationSettings.transactionCost !== 150) {
          // User has saved preferences - update if they're different from current state
          if (calculationSettings.underlyingValue !== underlyingValue && !userUpdateRef.current) {
            console.log('SettingsContext: Initial sync - updating underlying value from DB:', calculationSettings.underlyingValue);
            setUnderlyingValueState(calculationSettings.underlyingValue);
            lastUserValueRef.current.underlyingValue = calculationSettings.underlyingValue;
          }
          if (calculationSettings.transactionCost !== transactionCost && !userUpdateRef.current) {
            console.log('SettingsContext: Initial sync - updating transaction cost from DB:', calculationSettings.transactionCost);
            setTransactionCostState(calculationSettings.transactionCost);
            lastUserValueRef.current.transactionCost = calculationSettings.transactionCost;
          }
        } else if (!hasInitializedRef.current) {
          // Fallback to localStorage for initial load if no database values
          const savedUnderlyingValue = localStorage.getItem('underlyingValue');
          if (savedUnderlyingValue) {
            const parsed = parseInt(savedUnderlyingValue, 10);
            if (!isNaN(parsed) && parsed > 0 && parsed !== underlyingValue) {
              console.log('SettingsContext: Initial sync - updating underlying value from localStorage:', parsed);
              setUnderlyingValueState(parsed);
              lastUserValueRef.current.underlyingValue = parsed;
            }
          }

          const savedTransactionCost = localStorage.getItem('transactionCost');
          if (savedTransactionCost) {
            const parsed = parseInt(savedTransactionCost, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed !== transactionCost) {
              console.log('SettingsContext: Initial sync - updating transaction cost from localStorage:', parsed);
              setTransactionCostState(parsed);
              lastUserValueRef.current.transactionCost = parsed;
            }
          }
        }
        
        hasInitializedRef.current = true;
      }
    }
  }, [calculationSettings, isLoading]);

  // Save to database and local state
  const setUnderlyingValue = (value: number) => {
    console.log('SettingsContext: User setting underlying value to', value, 'Previous value was:', underlyingValue);
    userUpdateRef.current = true; // Flag that this is a user-initiated update
    setUnderlyingValueState(value);
    lastUserValueRef.current.underlyingValue = value; // Track the user's choice
    
    // Always save to localStorage as backup
    localStorage.setItem('underlyingValue', value.toString());
    
    // Try to save to database if user is authenticated
    saveCalculationSettings({
      underlyingValue: value,
      transactionCost
    });
    console.log('SettingsContext: Updated both localStorage and database with underlying value:', value);
  };

  const setTransactionCost = (value: number) => {
    console.log('SettingsContext: User setting transaction cost to', value, 'Previous value was:', transactionCost);
    userUpdateRef.current = true; // Flag that this is a user-initiated update
    setTransactionCostState(value);
    lastUserValueRef.current.transactionCost = value; // Track the user's choice
    
    // Always save to localStorage as backup
    localStorage.setItem('transactionCost', value.toString());
    
    // Try to save to database if user is authenticated
    saveCalculationSettings({
      underlyingValue,
      transactionCost: value
    });
    console.log('SettingsContext: Updated both localStorage and database with transaction cost:', value);
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