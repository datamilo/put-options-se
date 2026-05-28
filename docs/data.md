# Data Reference

## CSV Data Files

All CSV files live in the `/data` folder and are served at runtime from GitHub raw content. Local files in `/data` serve as fallbacks.

| File | Size | Description | Consumer hook |
|------|------|-------------|---------------|
| `data.csv` | ~3.6 MB | Main options data (67 fields per contract) | `useOptionsData` |
| `stock_data.csv` | ~8.2 MB | OHLC stock price history | `useStockData` |
| `current_options_scored.csv` | varies | Dual-model Probability Optimization Model + TA ML Model Analysis scores | `useScoredOptionsData` |
| `recovery_report_data.csv` | ~3.6 MB | Probability recovery scenario analysis | `useProbabilityRecoveryData` |
| `validation_report_data.csv` | ~3.6 MB | Probability method validation data | `useProbabilityValidationData` |
| `hit_rate_trends_by_stock.csv` | ~248 KB | Lower bound monthly trends (1,071 rows) | `useLowerBoundData` |
| `all_stocks_daily_predictions.csv` | ~12 MB | Lower bound daily predictions (115,000+ rows) | `useLowerBoundData` |
| `all_stocks_expiry_stats.csv` | varies | Lower bound expiry statistics (2,681 rows) | `useLowerBoundData` |
| `probability_history.csv` | ~11 MB | Historical probability data | `useProbabilityHistory` |
| `IV_PotentialDecline.csv` | ~2.2 MB | IV-based decline predictions (daily, per stock) | `useIVData` |
| `Stock_Events_Volatility_Data.csv` | ~712 KB | Earnings and financial event volatility data | `useVolatilityData` |
| `Stocks_Monthly_Data.csv` | varies | Monthly aggregated stock performance | `useMonthlyStockData` |

Total data loaded at runtime: ~35+ MB across all pages combined. Each hook loads only its own files; no page loads all files.

---

## Data Timestamps

The file `last_updated.json` tracks when each data category was last refreshed.

### Three timestamp fields

| Field | Description |
|-------|-------------|
| `optionsData.lastUpdated` | When put options price data was downloaded |
| `stockData.lastUpdated` | When stock price data was downloaded |
| `analysisCompleted.lastUpdated` | When calculations and analysis were completed |

### Format

Timestamps are stored as `YYYY-MM-DD HH:mm:ss` and displayed as `YYYY-MM-DD HH:mm`.

### Implementation

- Hook: `useTimestamps` (`src/hooks/useTimestamps.ts`) — loads with fallback URLs, singleton-cached
- Component: `DataTimestamp` (`src/components/ui/data-timestamp.tsx`) — displays with clock icon

### Pages displaying timestamps

| Page | Fields shown |
|------|-------------|
| Options Dashboard (`/`) | All three timestamps |
| Stock Details (`/stock/:stockName`) | Stock data + analysis updated |
| Probability Analysis (`/probability-analysis`) | Options data + analysis updated |

---

## Probability Method Normalization

`recovery_report_data.csv` and `validation_report_data.csv` use normalized method names in the `ProbMethod` column (format: `"Weighted Average"` without prefix).

The normalization utility in `src/utils/probabilityMethods.ts` handles both old and new CSV formats transparently:

```typescript
normalizeProbMethod("PoW - Weighted Average")  // → "Weighted Average"
normalizeProbMethod("Weighted Average")         // → "Weighted Average"
getDisplayProbMethod("Weighted Average")        // → "PoW - Weighted Average"
```

Always call `normalizeProbMethod()` when reading `ProbMethod` from CSV data. Always call `getDisplayProbMethod()` before displaying method names in the UI.

### The Five Probability Methods

| Internal name | Display name |
|---------------|-------------|
| `Weighted Average` | PoW - Weighted Average |
| `Bayesian Calibrated` | PoW - Bayesian Calibrated |
| `Original Black-Scholes` | PoW - Original Black-Scholes |
| `Bias Corrected` | PoW - Bias Corrected |
| `Historical IV` | PoW - Historical IV |

---

## IV Data (Constant-Maturity)

`IV_PotentialDecline.csv` provides per-stock, per-day implied volatility data. Each day's IV is a constant-maturity 30-day implied volatility computed via variance interpolation between the two option expiry dates bracketing the 30-day target. This produces a time series free of the expiry-date discontinuities that arise from using single-contract IV directly.

Loaded by `useIVData`, joined into `useEnrichedOptionsData` for the Options Dashboard and Portfolio Generator.

---

## Scored Options Data (`current_options_scored.csv`)

Contains dual-model scores for options currently in the universe:
- `Probability_Optimization_Score` — probability-based score (may be `"-"` for options without sufficient history)
- `TA_Probability` — technical analysis model score (may be `"-"`)
- Various TA ML Model indicator fields used in the expanded row breakdown

When `Probability_Optimization_Score` or `TA_Probability` is `"-"`, the option is parsed with `null` for that field. Minimum-threshold filters automatically exclude null-valued options.
