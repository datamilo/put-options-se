import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthProvider';
import { ScoredOptionsFilters } from '@/types/scoredOptions';

const defaultSettings: ScoredOptionsFilters = {
  expiryDate: '',
  stockNames: [],
  agreement: 'all',
  minScore: 70,
  minV21Score: 0,
  minTAProb: 0,
};

const STORAGE_KEY = 'scoredOptionsFilterSettings';

export const useScoredOptionsPreferences = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ScoredOptionsFilters>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedFromSupabase, setHasLoadedFromSupabase] = useState(false);

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
        console.error('Error loading scored options settings from localStorage:', error);
      }
    };

    loadFromLocalStorage();
  }, []);

  // Load from Supabase if authenticated
  useEffect(() => {
    if (!user || hasLoadedFromSupabase) {
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
          .eq('preference_type', 'scored_options_filters')
          .maybeSingle();

        if (error) {
          console.error('Error loading scored options settings from Supabase:', error);
          return;
        }

        if (data?.preference_data) {
          const loadedSettings = data.preference_data as any as ScoredOptionsFilters;
          console.log('🔄 useScoredOptionsPreferences - Loaded from Supabase:', loadedSettings);
          setSettings(loadedSettings);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedSettings));
        } else {
          console.log('🔄 useScoredOptionsPreferences - No saved preferences found in Supabase');
        }
      } catch (error) {
        console.error('Error loading scored options settings:', error);
      } finally {
        setIsLoading(false);
        setHasLoadedFromSupabase(true);
      }
    };

    loadFromSupabase();
  }, [user, hasLoadedFromSupabase]);

  const saveSettings = async (newSettings: ScoredOptionsFilters) => {
    console.log('💾 useScoredOptionsPreferences - Saving settings:', newSettings);
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
            preference_type: 'scored_options_filters',
            preference_data: newSettings as any,
          }, {
            onConflict: 'user_id,preference_type'
          });

        if (error) {
          console.error('Error saving scored options settings to Supabase:', error);
        } else {
          console.log('✅ useScoredOptionsPreferences - Successfully saved to Supabase');
        }
      } catch (error) {
        console.error('Error saving scored options settings:', error);
      }
    }
  };

  return {
    settings,
    isLoading,
    saveSettings,
  };
};
