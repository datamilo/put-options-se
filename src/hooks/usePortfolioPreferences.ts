import { useState, useEffect } from 'react';
import { useUserPreferences, ColumnPreference } from './useUserPreferences';

export const usePortfolioPreferences = () => {
  const { portfolioColumnPreferences, savePortfolioColumnPreferences, isLoading } = useUserPreferences();

  return {
    columnPreferences: portfolioColumnPreferences,
    isLoading,
    saveColumnPreferences: savePortfolioColumnPreferences
  };
};