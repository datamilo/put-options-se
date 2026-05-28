import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTimestamps } from "@/hooks/useTimestamps";
import { OptionData } from "@/types/options";
import { OptionsTableDS, CheckMark, COLUMN_KEYS, COLUMN_LABELS } from "@/components/options/OptionsTableDS";
import { OptionsChart } from "@/components/options/OptionsChart";
import { useEnrichedOptionsData } from "@/hooks/useEnrichedOptionsData";
import { useStockData } from "@/hooks/useStockData";
import { useMainPagePreferences } from "@/hooks/useMainPagePreferences";
import { useAnalytics } from "@/hooks/useAnalytics";
import { exportToExcel } from "@/utils/excelExport";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  usePageTitle('Options Analysis');
  const { t } = useTranslation('pages');
  const [searchParams] = useSearchParams();

  const { data, isLoading, error, loadMockData } = useEnrichedOptionsData();
  const { getLowPriceForPeriod } = useStockData();
  const { settings: savedFilters, isLoading: isLoadingPreferences, saveSettings: saveFilterSettings } = useMainPagePreferences();
  const { timestamps } = useTimestamps();
  const { trackFilterChange, trackExport } = useAnalytics();

  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [selectedExpiryDates, setSelectedExpiryDates] = useState<string[]>([]);
  const urlParamsProcessed = useRef(false);
  const [strikeBelowPeriod, setStrikeBelowPeriod] = useState<number | null>(() => {
    const period = searchParams.get('strikeBelowPeriod');
    return period ? parseInt(period, 10) : null;
  });
  const [sortField, setSortField] = useState<string | null>(
    () => searchParams.get('sortField') || null
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    const dir = searchParams.get('sortDirection');
    return dir === 'asc' ? 'asc' : 'desc';
  });

  const [view, setView] = useState<'table' | 'charts'>('table');
  const [isMaximized, setIsMaximized] = useState(false);
  const [openChip, setOpenChip] = useState<string | null>(null);
  const [stockSearch, setStockSearch] = useState("");
  const [expirySearch, setExpirySearch] = useState("");

  const filterRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!filterRailRef.current?.contains(e.target as Node)) {
        setOpenChip(null);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const timePeriodOptions = [
    { label: t('index.timePeriods.1w'), days: 7 },
    { label: t('index.timePeriods.1m'), days: 30 },
    { label: t('index.timePeriods.3m'), days: 90 },
    { label: t('index.timePeriods.6m'), days: 180 },
    { label: t('index.timePeriods.9m'), days: 270 },
    { label: t('index.timePeriods.1y'), days: 365 },
  ];

  // URL params for sharing (initial load only)
  useEffect(() => {
    if (urlParamsProcessed.current || !data.length) return;
    const hasUrlParams = searchParams.has('stocks') || searchParams.has('expiryDates');
    if (hasUrlParams) {
      const stocks = searchParams.get('stocks');
      const dates = searchParams.get('expiryDates');
      if (stocks) {
        try {
          const result = JSON.parse(decodeURIComponent(stocks));
          if (Array.isArray(result)) setSelectedStocks(result);
        } catch {
          setSelectedStocks(stocks.split(',').filter(Boolean));
        }
      }
      if (dates) {
        try {
          const result = JSON.parse(decodeURIComponent(dates));
          if (Array.isArray(result)) setSelectedExpiryDates(result);
        } catch {
          setSelectedExpiryDates(dates.split(',').filter(Boolean));
        }
      }
      urlParamsProcessed.current = true;
    }
  }, [data.length, searchParams]);

  // Load saved preferences
  useEffect(() => {
    if (urlParamsProcessed.current) return;
    if (data.length === 0 || isLoadingPreferences) return;

    const availableStocks = [...new Set(data.map(o => o.StockName))];
    const availableExpiryDates = [...new Set(data.map(o => o.ExpiryDate))];

    const validSavedStocks = savedFilters.selectedStocks.filter(s => availableStocks.includes(s));
    const validSavedExpiryDates = savedFilters.selectedExpiryDates.filter(d => availableExpiryDates.includes(d));

    let expiryDatesToUse = validSavedExpiryDates;
    if (expiryDatesToUse.length === 0) {
      const defaultDate = calculateDefaultExpiryDate(availableExpiryDates);
      if (defaultDate) expiryDatesToUse = [defaultDate];
    }

    setSelectedStocks(validSavedStocks);
    setSelectedExpiryDates(expiryDatesToUse);
    setStrikeBelowPeriod(savedFilters.strikeBelowPeriod || null);
  }, [data, isLoadingPreferences, savedFilters]);

  const calculateDefaultExpiryDate = (availableExpiryDates: string[]) => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const firstFriday = new Date(nextMonth);
    const daysUntilFriday = (5 - firstFriday.getDay() + 7) % 7;
    firstFriday.setDate(firstFriday.getDate() + daysUntilFriday);
    const thirdFriday = new Date(firstFriday);
    thirdFriday.setDate(thirdFriday.getDate() + 14);

    let closestDate = availableExpiryDates[0];
    let smallestDiff = Infinity;
    availableExpiryDates.forEach(dateStr => {
      const diff = Math.abs(new Date(dateStr).getTime() - thirdFriday.getTime());
      if (diff < smallestDiff) { smallestDiff = diff; closestDate = dateStr; }
    });
    return closestDate;
  };

  const resetToDefault = () => {
    const availableExpiryDates = [...new Set(data.map(o => o.ExpiryDate))];
    const defaultDate = calculateDefaultExpiryDate(availableExpiryDates);
    setSelectedStocks([]);
    setSelectedExpiryDates(defaultDate ? [defaultDate] : []);
    setStrikeBelowPeriod(null);
    toast.success(t('index.toast.filtersReset'));
  };

  // Save preferences (debounced)
  useEffect(() => {
    if (!isLoadingPreferences && data.length > 0 && !urlParamsProcessed.current) {
      const id = setTimeout(() => {
        saveFilterSettings({
          selectedStocks,
          selectedExpiryDates,
          selectedRiskLevels: [],
          strikePriceFilter: 'all',
          strikeBelowPeriod,
        });
      }, 500);
      return () => clearTimeout(id);
    }
  }, [selectedStocks, selectedExpiryDates, strikeBelowPeriod, isLoadingPreferences, data.length, saveFilterSettings]);

  const lowPricesCache = useMemo(() => {
    if (strikeBelowPeriod === null) return new Map<string, number | null>();
    const cache = new Map<string, number | null>();
    [...new Set(data.map(o => o.StockName))].forEach(name => {
      cache.set(name, getLowPriceForPeriod(name, strikeBelowPeriod));
    });
    return cache;
  }, [data, strikeBelowPeriod, getLowPriceForPeriod]);

  const filteredData = useMemo(() => {
    return data.filter(option => {
      if (selectedStocks.length > 0 && !selectedStocks.includes(option.StockName)) return false;
      if (selectedExpiryDates.length > 0 && !selectedExpiryDates.includes(option.ExpiryDate)) return false;
      if (strikeBelowPeriod !== null) {
        const low = lowPricesCache.get(option.StockName);
        if (low == null || option.StrikePrice > low) return false;
      }
      return true;
    });
  }, [data, selectedStocks, selectedExpiryDates, strikeBelowPeriod, lowPricesCache]);

  const filteredStocks = useMemo(() => {
    let opts = data;
    if (selectedExpiryDates.length > 0) opts = opts.filter(o => selectedExpiryDates.includes(o.ExpiryDate));
    if (strikeBelowPeriod !== null) {
      opts = opts.filter(o => {
        const low = lowPricesCache.get(o.StockName);
        return low != null && o.StrikePrice <= low;
      });
    }
    return [...new Set(opts.map(o => o.StockName))]
      .filter(s => s.toLowerCase().includes(stockSearch.toLowerCase()))
      .sort();
  }, [data, selectedExpiryDates, strikeBelowPeriod, lowPricesCache, stockSearch]);

  const filteredExpiryDates = useMemo(() => {
    let opts = data;
    if (selectedStocks.length > 0) opts = opts.filter(o => selectedStocks.includes(o.StockName));
    if (strikeBelowPeriod !== null) {
      opts = opts.filter(o => {
        const low = lowPricesCache.get(o.StockName);
        return low != null && o.StrikePrice <= low;
      });
    }
    return [...new Set(opts.map(o => o.ExpiryDate))]
      .filter(d => d.toLowerCase().includes(expirySearch.toLowerCase()))
      .sort();
  }, [data, selectedStocks, strikeBelowPeriod, lowPricesCache, expirySearch]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleOptionClick = (option: OptionData) => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    window.open(`${base}/option/${encodeURIComponent(option.OptionName)}?${searchParams.toString()}`, '_blank');
  };

  const handleStockClick = (stockName: string) => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    window.open(`${base}/stock/${encodeURIComponent(stockName)}?${searchParams.toString()}`, '_blank');
  };

  const handleExportCSV = () => {
    trackExport('export_excel_clicked', { export_type: 'xlsx', data_source: 'options_table', row_count: filteredData.length });
    exportToExcel({ filename: 'swedish-put-options', visibleColumns: COLUMN_KEYS.filter(k => !k.startsWith('_')) as (keyof OptionData)[], data: filteredData });
    toast.success(t('index.toast.dataExported'));
  };

  const toggleExpiry = (date: string) => {
    const newValue = selectedExpiryDates.includes(date)
      ? selectedExpiryDates.filter(d => d !== date)
      : [...selectedExpiryDates, date];
    trackFilterChange('filter_expiry_changed', { filter_type: 'expiry_dates', old_value: selectedExpiryDates, new_value: newValue, page: 'index' });
    setSelectedExpiryDates(newValue);
  };

  const toggleStock = (stock: string) => {
    const newValue = selectedStocks.includes(stock)
      ? selectedStocks.filter(s => s !== stock)
      : [...selectedStocks, stock];
    trackFilterChange('filter_stocks_changed', { filter_type: 'stocks', old_value: selectedStocks, new_value: newValue, page: 'index' });
    setSelectedStocks(newValue);
  };

  const expiryChipLabel = selectedExpiryDates.length === 0
    ? "Any"
    : selectedExpiryDates.length === 1
    ? selectedExpiryDates[0]
    : `${selectedExpiryDates.length} dates`;

  const stockChipLabel = selectedStocks.length === 0
    ? "All"
    : selectedStocks.length === 1
    ? selectedStocks[0]
    : `${selectedStocks.length} stocks`;

  const strikeChipLabel = strikeBelowPeriod === null
    ? "None"
    : timePeriodOptions.find(o => o.days === strikeBelowPeriod)?.label ?? "Active";

  const checkSlot = (selected: boolean) => (
    <span style={{ width: 14, height: 14, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
      {selected && <CheckMark />}
    </span>
  );

  const allExpirySelected = selectedExpiryDates.length > 0 && selectedExpiryDates.length === filteredExpiryDates.length;
  const allStocksSelected = selectedStocks.length > 0 && selectedStocks.length === filteredStocks.length;

  return (
    <div className={`page${view === 'table' ? ' page--fill' : ''}`}>
      {!isMaximized && (
        <div className="page-head">
          <div>
            <p className="eyebrow">01 · Discover</p>
            <h1 className="page-title">{t('index.title')}</h1>
            {timestamps && (
              <div className="timestamps">
                {timestamps.optionsData?.lastUpdated && (
                  <span>Options · {timestamps.optionsData.lastUpdated}</span>
                )}
                {timestamps.stockData?.lastUpdated && (
                  <span>Stocks · {timestamps.stockData.lastUpdated}</span>
                )}
                {timestamps.analysisCompleted?.lastUpdated && (
                  <span>Analysis · {timestamps.analysisCompleted.lastUpdated}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-3)', padding: '40px 0' }}>
          Loading…
        </p>
      )}

      {error && !isLoading && data.length === 0 && (
        <div style={{ padding: '40px 0' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--neg)' }}>{error}</p>
          <button
            type="button"
            className="btn-ghost"
            style={{ marginTop: 12 }}
            onClick={() => { loadMockData(); toast.success(t('index.toast.mockDataLoaded')); }}
          >
            Load sample data
          </button>
        </div>
      )}

      {data.length > 0 && (
        <>
          {/* Filter rail */}
          {!isMaximized && <div className="filter-rail" ref={filterRailRef}>

            {/* Expiry chip */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="filter-chip"
                data-active={selectedExpiryDates.length > 0 ? "true" : undefined}
                onClick={() => setOpenChip(openChip === 'expiry' ? null : 'expiry')}
              >
                <span className="chip-k">Expiry</span><span className="chip-v">{expiryChipLabel}</span>
                <ChevronDown size={10} strokeWidth={1.5} />
              </button>
              {openChip === 'expiry' && (
                <div className="filter-popover">
                  <input
                    className="popover-search"
                    placeholder="Search dates…"
                    value={expirySearch}
                    onChange={e => setExpirySearch(e.target.value)}
                  />
                  <div className="popover-item" onClick={() => setSelectedExpiryDates(allExpirySelected ? [] : filteredExpiryDates)}>
                    {checkSlot(allExpirySelected)}
                    <span>{allExpirySelected ? "Clear all" : "Select all"}</span>
                    <span className="pi-mono">{selectedExpiryDates.length}/{filteredExpiryDates.length}</span>
                  </div>
                  <div className="popover-divider" />
                  {filteredExpiryDates.map(date => (
                    <div key={date} className="popover-item" onClick={() => toggleExpiry(date)}>
                      {checkSlot(selectedExpiryDates.includes(date))}
                      {date}
                    </div>
                  ))}
                  {filteredExpiryDates.length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--ink-3)', padding: '8px 4px', fontFamily: 'var(--font-mono)' }}>No dates</p>
                  )}
                </div>
              )}
            </div>

            {/* Stock chip */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="filter-chip"
                data-active={selectedStocks.length > 0 ? "true" : undefined}
                onClick={() => setOpenChip(openChip === 'stocks' ? null : 'stocks')}
              >
                <span className="chip-k">Stock</span><span className="chip-v">{stockChipLabel}</span>
                <ChevronDown size={10} strokeWidth={1.5} />
              </button>
              {openChip === 'stocks' && (
                <div className="filter-popover">
                  <input
                    className="popover-search"
                    placeholder="Search stocks…"
                    value={stockSearch}
                    onChange={e => setStockSearch(e.target.value)}
                  />
                  <div className="popover-item" onClick={() => setSelectedStocks(allStocksSelected ? [] : filteredStocks)}>
                    {checkSlot(allStocksSelected)}
                    <span>{allStocksSelected ? "Clear all" : "Select all"}</span>
                    <span className="pi-mono">{selectedStocks.length}/{filteredStocks.length}</span>
                  </div>
                  <div className="popover-divider" />
                  {filteredStocks.map(stock => (
                    <div key={stock} className="popover-item" onClick={() => toggleStock(stock)}>
                      {checkSlot(selectedStocks.includes(stock))}
                      {stock}
                    </div>
                  ))}
                  {filteredStocks.length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--ink-3)', padding: '8px 4px', fontFamily: 'var(--font-mono)' }}>No stocks</p>
                  )}
                </div>
              )}
            </div>

            {/* Strike Below chip */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="filter-chip"
                data-active={strikeBelowPeriod !== null ? "true" : undefined}
                onClick={() => setOpenChip(openChip === 'strike' ? null : 'strike')}
              >
                <span className="chip-k">Strike Below</span><span className="chip-v">{strikeChipLabel}</span>
                <ChevronDown size={10} strokeWidth={1.5} />
              </button>
              {openChip === 'strike' && (
                <div className="filter-popover">
                  <div
                    className="popover-item"
                    onClick={() => { setStrikeBelowPeriod(null); setOpenChip(null); }}
                  >
                    {checkSlot(strikeBelowPeriod === null)}
                    None
                  </div>
                  {timePeriodOptions.map(opt => (
                    <div
                      key={opt.days}
                      className="popover-item"
                      onClick={() => {
                        trackFilterChange('filter_strike_below_period_changed', {
                          filter_type: 'strike_below_period',
                          old_value: strikeBelowPeriod,
                          new_value: opt.days,
                          page: 'index',
                        });
                        setStrikeBelowPeriod(opt.days);
                        setOpenChip(null);
                      }}
                    >
                      {checkSlot(strikeBelowPeriod === opt.days)}
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className="btn-ghost" onClick={resetToDefault}>
              Reset
            </button>
            <button type="button" className="btn-outline" onClick={handleExportCSV}>
              Export
            </button>
          </div>}

          {/* Tabs */}
          <div className="tabs">
            <button
              type="button"
              className="tab"
              data-on={view === 'table' ? 'true' : undefined}
              onClick={() => setView('table')}
            >
              Table
              <span className="tab-count">{filteredData.length}</span>
            </button>
            <button
              type="button"
              className="tab"
              data-on={view === 'charts' ? 'true' : undefined}
              onClick={() => { setView('charts'); setIsMaximized(false); }}
            >
              Charts
            </button>
          </div>

          {view === 'table' ? (
            <div className="table-region">
              <div className="results-meta">
                <div className="meta-l">
                  Showing <strong>{filteredData.length}</strong> of {data.length} options
                  {selectedExpiryDates.length === 1 && <> · expiry <strong>{selectedExpiryDates[0]}</strong></>}
                  {selectedStocks.length > 0 && <> · <strong>{selectedStocks.length}</strong> stock{selectedStocks.length > 1 ? 's' : ''}</>}
                </div>
                <div>
                  Sort: <strong>{sortField ? (COLUMN_LABELS[sortField] ?? sortField) : 'None'}</strong> · {sortDirection === 'asc' ? '↑' : '↓'}
                </div>
              </div>
              <OptionsTableDS
                data={filteredData}
                sortField={sortField}
                sortDir={sortDirection}
                onSort={handleSort}
                onRowClick={handleOptionClick}
                onStockClick={handleStockClick}
                isMaximized={isMaximized}
                onToggleMaximize={() => setIsMaximized(m => !m)}
              />
            </div>
          ) : (
            <OptionsChart data={filteredData} />
          )}

        </>
      )}
    </div>
  );
};

export default Index;
