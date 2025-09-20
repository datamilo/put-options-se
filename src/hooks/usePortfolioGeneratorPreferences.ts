import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export interface PortfolioGeneratorSettings {
  totalPremiumTarget: number;
  strikeBelowPeriod: number | null;
  minProbabilityWorthless: number | null;
  selectedExpiryDate: string;
  portfolioUnderlyingValue: number;
  selectedProbabilityField: string;
  optimizationStrategy: 'returns' | 'capital' | 'balanced';
  maxTotalCapital: number | null;
  excludedStocks: string[];
  generatedPortfolio: any[];
  portfolioGenerated: boolean;
  totalUnderlyingValue: number;
  portfolioMessage: string;
  totalPotentialLoss: number;
}

const defaultSettings: PortfolioGeneratorSettings = {
  totalPremiumTarget: 500,
  strikeBelowPeriod: null,
  minProbabilityWorthless: null,
  selectedExpiryDate: "",
  portfolioUnderlyingValue: 100000,
  selectedProbabilityField: "ProbWorthless_Bayesian_IsoCal",
  optimizationStrategy: 'returns',
  maxTotalCapital: null,
  excludedStocks: [],
  generatedPortfolio: [],
  portfolioGenerated: false,
  totalUnderlyingValue: 0,
  portfolioMessage: "",
  totalPotentialLoss: 0,
};

export const usePortfolioGeneratorPreferences = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PortfolioGeneratorSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage initially
  useEffect(() => {
    const loadLocalStorageSettings = () => {
      const localSettings: PortfolioGeneratorSettings = {
        totalPremiumTarget: parseInt(localStorage.getItem('portfolioGenerator_totalPremiumTarget') || '500'),
        strikeBelowPeriod: localStorage.getItem('portfolioGenerator_strikeBelowPeriod') ? 
          parseInt(localStorage.getItem('portfolioGenerator_strikeBelowPeriod')!) : null,
        minProbabilityWorthless: localStorage.getItem('portfolioGenerator_minProbabilityWorthless') ? 
          parseInt(localStorage.getItem('portfolioGenerator_minProbabilityWorthless')!) : null,
        selectedExpiryDate: localStorage.getItem('portfolioGenerator_selectedExpiryDate') || "",
        portfolioUnderlyingValue: parseInt(localStorage.getItem('portfolioGenerator_underlyingStockValue') || '100000'),
        selectedProbabilityField: localStorage.getItem('portfolioGenerator_selectedProbabilityField') || "ProbWorthless_Bayesian_IsoCal",
        optimizationStrategy: (localStorage.getItem('portfolioGenerator_optimizationStrategy') as 'returns' | 'capital' | 'balanced') || 'returns',
        maxTotalCapital: localStorage.getItem('portfolioGenerator_maxTotalCapital') ? 
          parseInt(localStorage.getItem('portfolioGenerator_maxTotalCapital')!) : null,
        excludedStocks: localStorage.getItem('portfolioGenerator_excludedStocks') ? 
          JSON.parse(localStorage.getItem('portfolioGenerator_excludedStocks')!) : [],
        generatedPortfolio: localStorage.getItem('portfolioGenerator_generatedPortfolio') ? 
          JSON.parse(localStorage.getItem('portfolioGenerator_generatedPortfolio')!) : [],
        portfolioGenerated: localStorage.getItem('portfolioGenerator_portfolioGenerated') === 'true',
        totalUnderlyingValue: parseInt(localStorage.getItem('portfolioGenerator_totalUnderlyingValue') || '0'),
        portfolioMessage: localStorage.getItem('portfolioGenerator_portfolioMessage') || "",
        totalPotentialLoss: parseFloat(localStorage.getItem('portfolioGenerator_totalPotentialLoss') || '0'),
      };
      setSettings(localSettings);
    };

    loadLocalStorageSettings();
    setIsLoading(false);
  }, []);

  // Load settings from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadSupabaseSettings();
    }
  }, [user]);

  const loadSupabaseSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_data')
        .eq('user_id', user.id)
        .eq('preference_type', 'portfolio_generator')
        .maybeSingle();

      if (error) {
        console.error('Error loading portfolio generator preferences:', error);
        return;
      }

      if (data?.preference_data) {
        const supabaseSettings = data.preference_data as unknown as PortfolioGeneratorSettings;
        setSettings(supabaseSettings);
        // Also update localStorage for consistency
        saveToLocalStorage(supabaseSettings);
      }
    } catch (error) {
      console.error('Error loading portfolio generator preferences:', error);
    }
  };

  const saveToLocalStorage = (newSettings: PortfolioGeneratorSettings) => {
    localStorage.setItem('portfolioGenerator_totalPremiumTarget', newSettings.totalPremiumTarget.toString());
    localStorage.setItem('portfolioGenerator_strikeBelowPeriod', newSettings.strikeBelowPeriod?.toString() || '');
    localStorage.setItem('portfolioGenerator_minProbabilityWorthless', newSettings.minProbabilityWorthless?.toString() || '');
    localStorage.setItem('portfolioGenerator_selectedExpiryDate', newSettings.selectedExpiryDate);
    localStorage.setItem('portfolioGenerator_underlyingStockValue', newSettings.portfolioUnderlyingValue.toString());
    localStorage.setItem('portfolioGenerator_selectedProbabilityField', newSettings.selectedProbabilityField);
    localStorage.setItem('portfolioGenerator_optimizationStrategy', newSettings.optimizationStrategy);
    localStorage.setItem('portfolioGenerator_maxTotalCapital', newSettings.maxTotalCapital?.toString() || '');
    localStorage.setItem('portfolioGenerator_excludedStocks', JSON.stringify(newSettings.excludedStocks));
    localStorage.setItem('portfolioGenerator_generatedPortfolio', JSON.stringify(newSettings.generatedPortfolio));
    localStorage.setItem('portfolioGenerator_portfolioGenerated', newSettings.portfolioGenerated.toString());
    localStorage.setItem('portfolioGenerator_totalUnderlyingValue', newSettings.totalUnderlyingValue.toString());
    localStorage.setItem('portfolioGenerator_portfolioMessage', newSettings.portfolioMessage);
    localStorage.setItem('portfolioGenerator_totalPotentialLoss', newSettings.totalPotentialLoss.toString());
  };

  const saveSettings = async (newSettings: PortfolioGeneratorSettings) => {
    setSettings(newSettings);
    saveToLocalStorage(newSettings);

    if (user) {
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            preference_type: 'portfolio_generator',
            preference_data: newSettings as any
          }, {
            onConflict: 'user_id,preference_type'
          });

        if (error) {
          console.error('Error saving portfolio generator preferences:', error);
        }
      } catch (error) {
        console.error('Error saving portfolio generator preferences:', error);
      }
    }
  };

  const updateSetting = <K extends keyof PortfolioGeneratorSettings>(
    key: K,
    value: PortfolioGeneratorSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  return {
    settings,
    isLoading,
    updateSetting,
    saveSettings,
  };
};