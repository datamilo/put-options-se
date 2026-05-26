import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { OptionData } from "@/types/options";
import { PortfolioOptionsTable } from "@/components/options/PortfolioOptionsTable";
import { useEnrichedOptionsData } from "@/hooks/useEnrichedOptionsData";
import { useRecalculatedOptions, RecalculatedOptionData } from "@/hooks/useRecalculatedOptions";
import { useStockData } from "@/hooks/useStockData";
import { useSettings } from "@/contexts/SettingsContext";
import { usePortfolioGeneratorPreferences } from "@/hooks/usePortfolioGeneratorPreferences";
import { useScoredOptionsData } from "@/hooks/useScoredOptionsData";
import { ScoredOptionData } from "@/types/scoredOptions";
import { useTimestamps } from "@/hooks/useTimestamps";
import { formatNordicNumber } from "@/utils/numberFormatting";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

const fmtSEK = (n: number) => n === 0 ? '0' : formatNordicNumber(Math.round(n));
const fmtPct = (n: number, dp = 1) => formatNordicNumber(n, dp) + '%';

const PortfolioGenerator = () => {
  usePageTitle('Portfolio Generator');
  const { t } = useTranslation('pages');
  const { data: rawData, isLoading, error } = useEnrichedOptionsData();
  const { getLowPriceForPeriod } = useStockData();
  const { transactionCost } = useSettings();
  const { settings, updateSetting, updateMultipleSettings, resetToDefaults, isLoading: preferencesLoading } = usePortfolioGeneratorPreferences();
  const { data: scoredOptionsData } = useScoredOptionsData();
  const { timestamps } = useTimestamps();

  const scoredDataMap = useMemo(() => {
    const map = new Map<string, ScoredOptionData>();
    if (scoredOptionsData) {
      for (const scored of scoredOptionsData) map.set(scored.option_name, scored);
    }
    return map;
  }, [scoredOptionsData]);

  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [totalPremiumInput, setTotalPremiumInput] = useState<string>(settings.totalPremiumTarget.toString());
  const [underlyingValueInput, setUnderlyingValueInput] = useState<string>(settings.portfolioUnderlyingValue.toString());
  const [maxTotalCapitalInput, setMaxTotalCapitalInput] = useState<string>(settings.maxTotalCapital?.toString() || "");

  useEffect(() => {
    setTotalPremiumInput(settings.totalPremiumTarget.toString());
    const currentInputValue = parseInt(underlyingValueInput) || 0;
    if (currentInputValue !== settings.portfolioUnderlyingValue) {
      setUnderlyingValueInput(settings.portfolioUnderlyingValue.toString());
    }
    setMaxTotalCapitalInput(settings.maxTotalCapital?.toString() || "");
  }, [settings]);

  const recalculateOptionsForPortfolio = (options: OptionData[], underlyingValue: number): RecalculatedOptionData[] => {
    return options.map(option => {
      const numberOfContractsBasedOnLimit = Math.round((underlyingValue / option.StrikePrice) / 100);
      const bidAskMidPrice = (option.Bid + (option.Ask || option.Bid)) / 2;
      const recalculatedPremium = Math.round((bidAskMidPrice * numberOfContractsBasedOnLimit * 100) - transactionCost);
      const calculatedUnderlyingValue = numberOfContractsBasedOnLimit * option.StrikePrice * 100;

      const calcLossAtDecline = (declinePct: number | undefined | null): number | undefined => {
        if (declinePct == null) return undefined;
        const stockAfter = option.StockPrice * (1 + declinePct);
        return Math.min(0, (stockAfter - option.StrikePrice) * numberOfContractsBasedOnLimit * 100);
      };

      const lossAtBadDecline = calcLossAtDecline(option.BadHistoricalDecline) ?? option.LossAtBadDecline;
      const lossAtWorstDecline = calcLossAtDecline(option.WorstHistoricalDecline) ?? option.LossAtWorstDecline;
      const lossAt100DayWorstDecline = calcLossAtDecline(option.Historical100DaysWorstDecline) ?? option.LossAt100DayWorstDecline;
      const lossAt_2008_100DayWorstDecline = calcLossAtDecline(option['2008_100DaysWorstDecline']) ?? option.LossAt_2008_100DayWorstDecline;
      const lossAt50DayWorstDecline = calcLossAtDecline(option.Historical50DaysWorstDecline) ?? option.LossAt50DayWorstDecline;
      const lossAt_2008_50DayWorstDecline = calcLossAtDecline(option['2008_50DaysWorstDecline']) ?? option.LossAt_2008_50DayWorstDecline;
      const lossLeastBad = Math.max(lossAtBadDecline, lossAtWorstDecline, lossAt100DayWorstDecline);
      const lossAtIV2sigmaDecline = calcLossAtDecline(option.IV_2sigma_Decline) ?? null;
      const lossAtCVaR10pctDecline = calcLossAtDecline(option.CVaR10pct_Decline) ?? null;

      let potentialLossAtLowerBound: number | null = (option as any).PotentialLossAtLowerBound ?? null;
      const lowerBoundClosestToStrike = (option as any).LowerBoundClosestToStrike;
      if (lowerBoundClosestToStrike) {
        const underlyingValueInvestment = option.StrikePrice * numberOfContractsBasedOnLimit * 100;
        const underlyingValueLowerBound = numberOfContractsBasedOnLimit * lowerBoundClosestToStrike * 100;
        const lossLowerBound = underlyingValueLowerBound - underlyingValueInvestment;
        potentialLossAtLowerBound = recalculatedPremium + lossLowerBound;
        if (potentialLossAtLowerBound >= 0) {
          potentialLossAtLowerBound = 0;
        } else {
          potentialLossAtLowerBound = potentialLossAtLowerBound - (potentialLossAtLowerBound * 0.000075 + transactionCost);
        }
      }

      let estTotalMargin: number | null = (option as any).EstTotalMargin ?? null;
      const estMarginSEK = (option as any).Est_Margin_SEK;
      if (estMarginSEK) estTotalMargin = Math.round(estMarginSEK * numberOfContractsBasedOnLimit);

      return {
        ...option,
        originalPremium: option.Premium,
        recalculatedPremium,
        recalculatedNumberOfContracts: numberOfContractsBasedOnLimit,
        recalculatedBid_Ask_Mid_Price: bidAskMidPrice,
        Premium: recalculatedPremium,
        NumberOfContractsBasedOnLimit: numberOfContractsBasedOnLimit,
        Bid_Ask_Mid_Price: bidAskMidPrice,
        Underlying_Value: calculatedUnderlyingValue,
        LossAtBadDecline: lossAtBadDecline,
        LossAtWorstDecline: lossAtWorstDecline,
        LossAt100DayWorstDecline: lossAt100DayWorstDecline,
        LossAt_2008_100DayWorstDecline: lossAt_2008_100DayWorstDecline,
        LossAt50DayWorstDecline: lossAt50DayWorstDecline,
        LossAt_2008_50DayWorstDecline: lossAt_2008_50DayWorstDecline,
        Loss_Least_Bad: lossLeastBad,
        LossAtIV2sigmaDecline: lossAtIV2sigmaDecline,
        LossAtCVaR10pctDecline: lossAtCVaR10pctDecline,
        PotentialLossAtLowerBound: potentialLossAtLowerBound,
        EstTotalMargin: estTotalMargin,
      };
    });
  };

  const data = useMemo(() => {
    return recalculateOptionsForPortfolio(rawData || [], settings.portfolioUnderlyingValue);
  }, [rawData, settings.portfolioUnderlyingValue, transactionCost]);

  const [sortField, setSortField] = useState<keyof OptionData | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSortChange = (field: keyof OptionData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const timePeriodOptions = [
    { label: t('index.timePeriods.1w'), days: 7 },
    { label: t('index.timePeriods.1m'), days: 30 },
    { label: t('index.timePeriods.3m'), days: 90 },
    { label: t('index.timePeriods.6m'), days: 180 },
    { label: t('index.timePeriods.9m'), days: 270 },
    { label: t('index.timePeriods.1y'), days: 365 },
  ];

  const probabilityFieldOptions = [
    { value: "ProbWorthless_Bayesian_IsoCal", label: t('charts:methods.bayesianCalibrated') },
    { value: "1_2_3_ProbOfWorthless_Weighted", label: t('charts:methods.weightedAverage') },
    { value: "1_ProbOfWorthless_Original", label: t('charts:methods.originalBlackScholes') },
    { value: "2_ProbOfWorthless_Calibrated", label: t('charts:methods.biasCorreected') },
    { value: "3_ProbOfWorthless_Historical_IV", label: t('charts:methods.historicalIV') },
  ];

  const optimizationStrategies = [
    { value: "returns",  abbr: "RTRN" },
    { value: "capital",  abbr: "CPTL" },
    { value: "balanced", abbr: "BALA" },
    { value: "scored",   abbr: "SCRD" },
  ] as const;

  const availableExpiryDates = useMemo(() => {
    return [...new Set(data.map(o => o.ExpiryDate))].sort();
  }, [data]);

  const availableStocks = useMemo(() => {
    return [...new Set(data.map(o => o.StockName))].sort();
  }, [data]);

  const validateTotalPremium = (value: string) => {
    const num = parseInt(value) || 500;
    const clamped = Math.max(500, Math.min(1000000, num));
    updateSetting('totalPremiumTarget', clamped);
    setTotalPremiumInput(clamped.toString());
  };

  const handleUnderlyingValueChange = (value: string) => setUnderlyingValueInput(value);

  const handleUnderlyingValueBlur = () => {
    if (isGeneratingPortfolio) return;
    const num = parseInt(underlyingValueInput) || 10000;
    const clamped = Math.max(10000, Math.min(1000000, num));
    updateSetting('portfolioUnderlyingValue', clamped);
    setUnderlyingValueInput(clamped.toString());
    if (settings.portfolioGenerated) {
      updateMultipleSettings({
        generatedPortfolio: [],
        portfolioGenerated: false,
        portfolioMessage: "",
        totalPotentialLoss: 0,
        totalUnderlyingValue: 0,
        portfolioUnderlyingValue: clamped,
      });
    }
  };

  const getProbabilityValue = (option: OptionData): number | null => {
    const primaryValue = option[settings.selectedProbabilityField as keyof OptionData] as number;
    const fallbackValue = option['1_2_3_ProbOfWorthless_Weighted'];
    if ((primaryValue == null || isNaN(primaryValue)) && (fallbackValue == null || isNaN(fallbackValue))) return null;
    return primaryValue || fallbackValue || 0;
  };

  const hasRequiredValues = (option: OptionData): boolean => {
    if (getProbabilityValue(option) === null) return false;
    const potentialLoss = (option as any).PotentialLossAtLowerBound;
    if (potentialLoss == null || isNaN(potentialLoss)) return false;
    if (!option.NumberOfContractsBasedOnLimit || option.NumberOfContractsBasedOnLimit <= 0) return false;
    return true;
  };

  const generatePortfolio = (useUnderlyingValue?: number) => {
    const effectiveUnderlyingValue = useUnderlyingValue || settings.portfolioUnderlyingValue;
    if (!data || data.length === 0) {
      updateSetting('portfolioMessage', 'No options data available for portfolio generation');
      return;
    }
    setIsGeneratingPortfolio(true);
    toast({ title: t('portfolioGenerator.toastGeneratingTitle'), description: t('portfolioGenerator.toastGeneratingDesc') });
    setTimeout(() => {
      try {
        const selectedOptions: OptionData[] = [];
        const usedStocks = new Set<string>();
        let totalPremium = 0;
        const recalculatedData = recalculateOptionsForPortfolio(rawData || [], effectiveUnderlyingValue);
        const isScored = settings.optimizationStrategy === 'scored';

        let filteredOptions = recalculatedData.filter(option => {
          if (isScored && !scoredDataMap.has(option.OptionName)) return false;
          if (!isScored && !hasRequiredValues(option)) return false;
          if (isScored && (!option.NumberOfContractsBasedOnLimit || option.NumberOfContractsBasedOnLimit <= 0)) return false;
          if (option.Premium <= 0) return false;
          if (settings.excludedStocks.includes(option.StockName)) return false;
          if (settings.strikeBelowPeriod) {
            const lowPrice = getLowPriceForPeriod(option.StockName, settings.strikeBelowPeriod);
            if (!lowPrice || option.StrikePrice > lowPrice) return false;
          }
          if (settings.selectedExpiryDate && option.ExpiryDate !== settings.selectedExpiryDate) return false;
          if (settings.minProbabilityWorthless || settings.maxProbabilityWorthless) {
            const prob = getProbabilityValue(option);
            if (prob === null) return false;
            if (settings.minProbabilityWorthless && prob < settings.minProbabilityWorthless / 100) return false;
            if (settings.maxProbabilityWorthless && prob > settings.maxProbabilityWorthless / 100) return false;
          }
          return true;
        });

        filteredOptions.forEach(option => {
          const capitalRequired = option.NumberOfContractsBasedOnLimit * option.StrikePrice * 100;
          (option as any).capitalRequired = capitalRequired;
          if (isScored) {
            const scored = scoredDataMap.get(option.OptionName)!;
            const v21 = scored.v21_score ?? 0;
            const ta = (scored.ta_probability ?? 0) * 100;
            const w = settings.v21Weight / 100;
            (option as any).scoredData = scored;
            (option as any).combined_score = scored.combined_score;
            (option as any).v21_score = scored.v21_score;
            (option as any).ta_probability = scored.ta_probability;
            (option as any).agreement_strength = scored.agreement_strength;
            (option as any).finalScore = w * v21 + (1 - w) * ta;
          } else {
            const prob = getProbabilityValue(option);
            const potentialLoss = Math.abs((option as any).PotentialLossAtLowerBound);
            const premium = option.Premium;
            const expectedValue = premium - (1 - prob!) * potentialLoss;
            const capitalEfficiencyScore = capitalRequired > 0 ? expectedValue / capitalRequired : 0;
            const riskAdjustedScore = potentialLoss > 0 ? (premium / potentialLoss) * prob! : prob!;
            let finalScore = 0;
            if (settings.optimizationStrategy === 'returns') finalScore = riskAdjustedScore;
            else if (settings.optimizationStrategy === 'capital') finalScore = capitalEfficiencyScore * (prob! * 2);
            else finalScore = (riskAdjustedScore * 0.6) + (capitalEfficiencyScore * 0.4);
            (option as any).expectedValue = expectedValue;
            (option as any).expectedValuePerCapital = capitalRequired > 0 ? expectedValue / capitalRequired : 0;
            (option as any).capitalEfficiencyScore = capitalEfficiencyScore;
            (option as any).riskAdjustedScore = riskAdjustedScore;
            (option as any).finalScore = finalScore;
          }
        });

        filteredOptions.sort((a, b) => {
          const scoreA = (a as any).finalScore || 0;
          const scoreB = (b as any).finalScore || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          if (settings.optimizationStrategy === 'capital') {
            return ((a as any).capitalRequired || 0) - ((b as any).capitalRequired || 0);
          }
          return ((b as any).expectedValuePerCapital || 0) - ((a as any).expectedValuePerCapital || 0);
        });

        let totalCapitalUsed = 0;
        for (const option of filteredOptions) {
          if (usedStocks.has(option.StockName)) continue;
          const optionCapital = (option as any).capitalRequired || 0;
          const premiumOk = totalPremium + option.Premium <= settings.totalPremiumTarget;
          const capitalOk = !settings.maxTotalCapital || totalCapitalUsed + optionCapital <= settings.maxTotalCapital;
          if (premiumOk && capitalOk) {
            selectedOptions.push(option);
            usedStocks.add(option.StockName);
            totalPremium += option.Premium;
            totalCapitalUsed += optionCapital;
          }
        }

        if (totalPremium < settings.totalPremiumTarget) {
          const remaining = filteredOptions.filter(o => {
            const cap = (o as any).capitalRequired || 0;
            return !usedStocks.has(o.StockName)
              && o.Premium <= settings.totalPremiumTarget - totalPremium
              && (!settings.maxTotalCapital || totalCapitalUsed + cap <= settings.maxTotalCapital);
          });
          for (const option of remaining) {
            const cap = (option as any).capitalRequired || 0;
            if (totalPremium + option.Premium <= settings.totalPremiumTarget && (!settings.maxTotalCapital || totalCapitalUsed + cap <= settings.maxTotalCapital)) {
              selectedOptions.push(option);
              usedStocks.add(option.StockName);
              totalPremium += option.Premium;
              totalCapitalUsed += cap;
            }
          }
        }

        const calculatedUnderlyingValue = selectedOptions.reduce((sum, o) => sum + (o.NumberOfContractsBasedOnLimit * o.StrikePrice * 100), 0);
        const totalPotentialLoss = selectedOptions.reduce((sum, o) => sum + ((o as any).PotentialLossAtLowerBound || 0), 0);

        let message = totalPremium < settings.totalPremiumTarget
          ? `Portfolio generated with ${totalPremium.toLocaleString('sv-SE')} SEK premium (${(settings.totalPremiumTarget - totalPremium).toLocaleString('sv-SE')} SEK below target).`
          : `Portfolio successfully generated with ${totalPremium.toLocaleString('sv-SE')} SEK premium.`;

        updateMultipleSettings({
          generatedPortfolio: selectedOptions,
          portfolioGenerated: true,
          portfolioMessage: message,
          totalUnderlyingValue: calculatedUnderlyingValue,
          totalPotentialLoss: totalPotentialLoss,
          portfolioUnderlyingValue: effectiveUnderlyingValue,
        });

        toast({ title: t('portfolioGenerator.toastGeneratedTitle'), description: t('portfolioGenerator.toastGeneratedDesc', { count: selectedOptions.length }) });
      } catch (err) {
        updateSetting('portfolioMessage', `Error generating portfolio: ${err}`);
        toast({ title: t('portfolioGenerator.toastErrorTitle'), description: t('portfolioGenerator.toastErrorDesc'), variant: "destructive" });
      } finally {
        setIsGeneratingPortfolio(false);
      }
    }, 100);
  };

  const handleOptionClick = (option: OptionData) => {
    const currentPath = window.location.pathname;
    const basePath = currentPath.includes('/put-options-se') ? '/put-options-se' : '';
    window.open(`${window.location.origin}${basePath}/option/${encodeURIComponent(option.OptionName)}`, '_blank');
  };

  const handleStockClick = (stockName: string) => {
    const currentPath = window.location.pathname;
    const basePath = currentPath.includes('/put-options-se') ? '/put-options-se' : '';
    window.open(`${window.location.origin}${basePath}/stock/${encodeURIComponent(stockName)}`, '_blank');
  };

  // KPI computations from generated portfolio
  const portfolioTotals = useMemo(() => {
    const portfolio = settings.generatedPortfolio;
    if (portfolio.length === 0) return { margin: 0, premium: 0, annRom: 0, avgPoW: 0 };
    const margin = portfolio.reduce((s, o) => s + ((o as any).EstTotalMargin ?? 0), 0);
    const premium = portfolio.reduce((s, o) => s + o.Premium, 0);
    const annRom = portfolio.reduce((s, o) => s + ((o as any).Annualized_ROM_Pct ?? 0), 0) / portfolio.length;
    const avgPoW = portfolio.reduce((s, o) => s + (o['1_2_3_ProbOfWorthless_Weighted'] ?? 0), 0) / portfolio.length;
    return { margin, premium, annRom, avgPoW };
  }, [settings.generatedPortfolio]);

  const minPowPct = settings.minProbabilityWorthless ?? 65;
  const maxPowPct = settings.maxProbabilityWorthless ?? null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">04 · Automated · Portfolio</p>
          <h1 className="page-title">{t('portfolioGenerator.title')}</h1>
          <p className="page-desc" style={{ maxWidth: '60ch' }}>
            Generate a diversified put-selling portfolio from the current options book, sized to your capital budget and risk tolerance.
          </p>
          {timestamps && (
            <div className="timestamps">
              {timestamps.optionsData?.lastUpdated && (
                <span>Options · {timestamps.optionsData.lastUpdated}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-3)', padding: '40px 0' }}>Loading…</p>
      )}

      {!isLoading && (
        <div className="pg-grid" style={{ gridTemplateColumns: settingsOpen ? '320px 1fr' : '1fr' }}>
          {/* ── Left: controls ── */}
          {settingsOpen && <aside className="pg-controls">

            {/* Capital */}
            <div className="pg-section">
              <div className="pg-section-title">Capital</div>

              <div className="input-row">
                <label>
                  {t('portfolioGenerator.labelTotalPremium')}
                  <span className="input-hint">kr · target</span>
                </label>
                <div className="input-affix" data-affix="kr">
                  <input
                    className="text-input"
                    type="number"
                    step="500"
                    value={totalPremiumInput}
                    onChange={e => setTotalPremiumInput(e.target.value)}
                    onBlur={e => validateTotalPremium(e.target.value)}
                    placeholder="500 – 1 000 000"
                  />
                </div>
              </div>

              <div className="input-row">
                <label>
                  {t('portfolioGenerator.labelUnderlyingValue')}
                  <span className="input-hint">kr · per position</span>
                </label>
                <div className="input-affix" data-affix="kr">
                  <input
                    className="text-input"
                    type="text"
                    inputMode="numeric"
                    value={underlyingValueInput}
                    onChange={e => handleUnderlyingValueChange(e.target.value)}
                    onBlur={handleUnderlyingValueBlur}
                    placeholder="10 000 – 1 000 000"
                  />
                </div>
              </div>

              <div className="input-row">
                <label>
                  {t('portfolioGenerator.labelMaxCapital')}
                  <span className="input-hint">optional</span>
                </label>
                <div className="input-affix" data-affix="kr">
                  <input
                    className="text-input"
                    type="number"
                    value={maxTotalCapitalInput}
                    onChange={e => setMaxTotalCapitalInput(e.target.value)}
                    onBlur={e => updateSetting('maxTotalCapital', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder={t('portfolioGenerator.placeholderMaxCapital')}
                  />
                </div>
              </div>
            </div>

            {/* Strategy */}
            <div className="pg-section">
              <div className="pg-section-title">Strategy</div>

              <div className="seg" style={{ width: '100%' }}>
                {optimizationStrategies.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    className="seg-btn"
                    data-on={settings.optimizationStrategy === s.value ? "true" : undefined}
                    style={{ flex: 1 }}
                    onClick={() => updateSetting('optimizationStrategy', s.value)}
                  >
                    {s.abbr}
                  </button>
                ))}
              </div>

              {settings.optimizationStrategy === 'scored' && (
                <div className="input-row" style={{ marginTop: 14 }}>
                  <label>
                    Prob Model weight
                    <span className="input-hint">{settings.v21Weight}% / {100 - settings.v21Weight}% TA</span>
                  </label>
                  <div className="slider-wrap">
                    <input
                      className="slider"
                      type="range"
                      min={0} max={100} step={5}
                      value={settings.v21Weight}
                      onChange={e => updateSetting('v21Weight', Number(e.target.value))}
                    />
                    <div className="slider-ticks">
                      <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="input-row" style={{ marginTop: 14 }}>
                <label>{t('portfolioGenerator.labelProbabilityField')}</label>
                <select
                  className="text-input"
                  style={{ paddingLeft: 10 }}
                  value={settings.selectedProbabilityField}
                  onChange={e => updateSetting('selectedProbabilityField', e.target.value)}
                >
                  {probabilityFieldOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Constraints */}
            <div className="pg-section">
              <div className="pg-section-title">Constraints</div>

              <div className="input-row">
                <label>
                  {t('portfolioGenerator.labelMinProbability')}
                  <span className="input-hint">{minPowPct}%</span>
                </label>
                <div className="slider-wrap">
                  <input
                    className="slider"
                    type="range"
                    min={50} max={99} step={1}
                    value={minPowPct}
                    onChange={e => updateSetting('minProbabilityWorthless', Number(e.target.value))}
                  />
                  <div className="slider-ticks">
                    <span>50%</span><span>75%</span><span>99%</span>
                  </div>
                </div>
              </div>

              <div className="input-row">
                <label>
                  {t('portfolioGenerator.labelMaxProbability')}
                  <span className="input-hint">{maxPowPct ?? 99}%</span>
                </label>
                <div className="slider-wrap">
                  <input
                    className="slider"
                    type="range"
                    min={50} max={99} step={1}
                    value={maxPowPct ?? 99}
                    onChange={e => updateSetting('maxProbabilityWorthless', Number(e.target.value))}
                  />
                  <div className="slider-ticks">
                    <span>50%</span><span>75%</span><span>99%</span>
                  </div>
                </div>
              </div>

              <div className="input-row">
                <label>
                  {t('portfolioGenerator.labelExpiryDate')}
                  <span className="input-hint">{data.filter(o => !settings.selectedExpiryDate || o.ExpiryDate === settings.selectedExpiryDate).length} options</span>
                </label>
                <select
                  className="text-input"
                  style={{ paddingLeft: 10 }}
                  value={settings.selectedExpiryDate}
                  onChange={e => updateSetting('selectedExpiryDate', e.target.value)}
                >
                  <option value="">{t('portfolioGenerator.allExpiryDates')}</option>
                  {availableExpiryDates.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="input-row">
                <label>{t('portfolioGenerator.labelStrikePriceBelow')}</label>
                <select
                  className="text-input"
                  style={{ paddingLeft: 10 }}
                  value={settings.strikeBelowPeriod ?? ''}
                  onChange={e => updateSetting('strikeBelowPeriod', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{t('portfolioGenerator.noFilter')}</option>
                  {timePeriodOptions.map(o => (
                    <option key={o.days} value={o.days}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-row">
                <label>
                  {t('portfolioGenerator.labelExcludeStocks')}
                  {settings.excludedStocks.length > 0 && (
                    <span className="input-hint">{settings.excludedStocks.length} excluded</span>
                  )}
                </label>
                <select
                  className="text-input"
                  style={{ paddingLeft: 10, height: 72 }}
                  multiple
                  value={settings.excludedStocks}
                  onChange={e => {
                    const selected = Array.from(e.target.selectedOptions, o => o.value);
                    updateSetting('excludedStocks', selected);
                  }}
                >
                  {availableStocks.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {settings.excludedStocks.length > 0 && (
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: 11, marginTop: 4, padding: '0 6px', height: 24 }}
                    onClick={() => updateSetting('excludedStocks', [])}
                  >
                    Clear exclusions
                  </button>
                )}
              </div>
            </div>

            {/* Generate */}
            <div className="pg-section">
              <button
                type="button"
                className="btn-primary"
                data-tone="accent"
                style={{ width: '100%', height: 38, fontSize: 13 }}
                onClick={() => {
                  const inputValue = parseInt(underlyingValueInput) || 100000;
                  const clamped = Math.max(10000, Math.min(1000000, inputValue));
                  if (!data || data.length === 0) return;
                  generatePortfolio(clamped);
                }}
                disabled={isGeneratingPortfolio || !data || data.length === 0}
              >
                {isGeneratingPortfolio ? t('portfolioGenerator.generating') : t('portfolioGenerator.generate')}
              </button>
            </div>
          </aside>}

          {/* ── Right: results ── */}
          <section className="pg-results">
            {/* Settings toggle */}
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, height: 28 }}
                onClick={() => setSettingsOpen(o => !o)}
              >
                {settingsOpen
                  ? <><PanelLeftClose size={14} strokeWidth={1.5} /> Hide settings</>
                  : <><PanelLeftOpen size={14} strokeWidth={1.5} /> Show settings</>
                }
              </button>
            </div>
            {/* KPI strip */}
            <div className="pg-kpis">
              <div className="kpi">
                <div className="kpi-k">Positions</div>
                <div className="kpi-v">{settings.generatedPortfolio.length || '—'}</div>
                <div className="kpi-sub">in portfolio</div>
              </div>
              <div className="kpi">
                <div className="kpi-k">Net premium</div>
                <div className="kpi-v">{portfolioTotals.premium > 0 ? fmtSEK(portfolioTotals.premium) : '—'}</div>
                <div className="kpi-sub">SEK · if all expire worthless</div>
              </div>

              <div className="kpi">
                <div className="kpi-k">Avg P(worthless)</div>
                <div className="kpi-v">{portfolioTotals.avgPoW > 0 ? fmtPct(portfolioTotals.avgPoW * 100) : '—'}</div>
                <div className="kpi-sub">across positions</div>
              </div>
              <div className="kpi">
                <div className="kpi-k">Total underlying</div>
                <div className="kpi-v">{settings.totalUnderlyingValue > 0 ? fmtSEK(settings.totalUnderlyingValue) : '—'}</div>
                <div className="kpi-sub">SEK · capital at work</div>
              </div>
              <div className="kpi">
                <div className="kpi-k">Risk of loss</div>
                <div className="kpi-v">{settings.totalPotentialLoss < 0 ? fmtSEK(settings.totalPotentialLoss) : '—'}</div>
                <div className="kpi-sub">SEK · at lower bound</div>
              </div>
            </div>

            {/* Portfolio message */}
            {settings.portfolioMessage && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)', marginBottom: 20 }}>
                {settings.portfolioMessage}
              </p>
            )}

            {/* Positions table */}
            {settings.portfolioGenerated && (
              <>
                <div className="pg-section-h">
                  <h2>Suggested positions</h2>
                </div>
                <PortfolioOptionsTable
                  data={settings.generatedPortfolio}
                  onRowClick={handleOptionClick}
                  onStockClick={handleStockClick}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  enableFiltering={false}
                  isScoredStrategy={settings.optimizationStrategy === 'scored'}
                  selectedProbabilityField={settings.selectedProbabilityField}
                />
              </>
            )}

            <div className="foot">
              <Link to="/" className="btn-ghost">← Back to Options</Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default PortfolioGenerator;
