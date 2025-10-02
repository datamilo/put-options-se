import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthProvider';

export interface MainPageFilterSettings {
  selectedStocks: string[];
  selectedExpiryDates: string[];
  selectedRiskLevels: string[];
  strikePriceFilter: string;
}

const defaultSettings: MainPageFilterSettings = {
  selectedStocks: [],
  selectedExpiryDates: [],
  selectedRiskLevels: [],
  strikePriceFilter: 'all'
};

const STORAGE_KEY = 'mainPageFilterSettings';

export const useMainPagePreferences = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MainPageFilterSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings(parsed);
        }
      } catch (error) {
        console.error('Error loading main page settings from localStorage:', error);
      }
    };

    loadFromLocalStorage();
  }, []);

  // Load from Supabase if authenticated
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadFromSupabase = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preference_data')
          .eq('user_id', user.id)
          .eq('preference_type', 'main_page_filters')
          .maybeSingle();

        if (error) {
          console.error('Error loading main page settings from Supabase:', error);
          return;
        }

        if (data?.preference_data) {
          const loadedSettings = data.preference_data as any as MainPageFilterSettings;
          setSettings(loadedSettings);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedSettings));
        }
      } catch (error) {
        console.error('Error loading main page settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromSupabase();
  }, [user]);

  const saveSettings = async (newSettings: MainPageFilterSettings) => {
    setSettings(newSettings);
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }

    // Save to Supabase if authenticated
    if (user) {
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            preference_type: 'main_page_filters',
            preference_data: newSettings as any
          }, {
            onConflict: 'user_id,preference_type'
          });

        if (error) {
          console.error('Error saving main page settings to Supabase:', error);
        }
      } catch (error) {
        console.error('Error saving main page settings:', error);
      }
    }
  };

  return {
    settings,
    isLoading,
    saveSettings
  };
};
