import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthProvider';
import { toast } from 'sonner';

export interface ColumnPreference {
  key: string;
  visible: boolean;
  order: number;
}

export interface CalculationSettings {
  underlyingValue: number;
  transactionCost: number;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [columnPreferences, setColumnPreferences] = useState<ColumnPreference[]>([]);
  const [portfolioColumnPreferences, setPortfolioColumnPreferences] = useState<ColumnPreference[]>([]);
  const [calculationSettings, setCalculationSettings] = useState<CalculationSettings>({
    underlyingValue: 100000,
    transactionCost: 150
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from database
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('preference_type, preference_data')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading preferences:', error);
        return;
      }

      preferences?.forEach(pref => {
        if (pref.preference_type === 'column_preferences') {
          setColumnPreferences(pref.preference_data as any as ColumnPreference[]);
        } else if (pref.preference_type === 'portfolio_column_preferences') {
          setPortfolioColumnPreferences(pref.preference_data as any as ColumnPreference[]);
        } else if (pref.preference_type === 'calculation_settings') {
          setCalculationSettings(pref.preference_data as any as CalculationSettings);
        }
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveColumnPreferences = async (preferences: ColumnPreference[]) => {
    if (!user) {
      console.log('User not authenticated, skipping column preferences save');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preference_type: 'column_preferences',
          preference_data: preferences as any
        }, {
          onConflict: 'user_id,preference_type'
        });

      if (error) {
        toast.error('Failed to save column preferences');
        console.error('Error saving column preferences:', error);
        return;
      }

      setColumnPreferences(preferences);
      toast.success('Column preferences saved');
    } catch (error) {
      toast.error('Failed to save column preferences');
      console.error('Error saving column preferences:', error);
    }
  };

  const savePortfolioColumnPreferences = async (preferences: ColumnPreference[]) => {
    if (!user) {
      console.log('User not authenticated, skipping portfolio column preferences save');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preference_type: 'portfolio_column_preferences',
          preference_data: preferences as any
        }, {
          onConflict: 'user_id,preference_type'
        });

      if (error) {
        toast.error('Failed to save portfolio column preferences');
        console.error('Error saving portfolio column preferences:', error);
        return;
      }

      setPortfolioColumnPreferences(preferences);
      toast.success('Portfolio column preferences saved');
    } catch (error) {
      toast.error('Failed to save portfolio column preferences');
      console.error('Error saving portfolio column preferences:', error);
    }
  };

  const saveCalculationSettings = async (settings: CalculationSettings) => {
    if (!user) {
      console.log('User not authenticated, skipping calculation settings save');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preference_type: 'calculation_settings',
          preference_data: settings as any
        }, {
          onConflict: 'user_id,preference_type'
        });

      if (error) {
        toast.error('Failed to save calculation settings');
        console.error('Error saving calculation settings:', error);
        return;
      }

      setCalculationSettings(settings);
      toast.success('Calculation settings saved');
    } catch (error) {
      toast.error('Failed to save calculation settings');
      console.error('Error saving calculation settings:', error);
    }
  };

  return {
    columnPreferences,
    portfolioColumnPreferences,
    calculationSettings,
    isLoading,
    saveColumnPreferences,
    savePortfolioColumnPreferences,
    saveCalculationSettings,
    refreshPreferences: loadPreferences
  };
};