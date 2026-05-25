import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { OptionData } from "@/types/options";
import { formatNumber } from "@/lib/utils";
import { FieldInfoTooltip } from "@/components/ui/field-info-tooltip";
import { ColumnManager } from "./ColumnManager";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Maximize2, Minimize2 } from "lucide-react";

interface Column {
  key: string;
  tKey: string;
  label: string;
  numeric: boolean;
  width: number;
  defaultVisible: boolean;
}

const COLUMNS: Column[] = [
  { key: "StockName",                      tKey: "options.fields.StockName",                      label: "Stock Name",                    numeric: false, width: 180, defaultVisible: true  },
  { key: "OptionName",                     tKey: "options.fields.OptionName",                     label: "Option Name",                   numeric: false, width: 160, defaultVisible: true  },
  { key: "ExpiryDate",                     tKey: "options.fields.ExpiryDate",                     label: "Expiry Date",                   numeric: true,  width: 100, defaultVisible: true  },
  { key: "DaysToExpiry",                   tKey: "options.fields.DaysToExpiry",                   label: "Days to Expiry",                numeric: true,  width: 100, defaultVisible: true  },
  { key: "StrikePrice",                    tKey: "options.fields.StrikePrice",                    label: "Strike Price",                  numeric: true,  width: 80,  defaultVisible: true  },
  { key: "StockPrice",                     tKey: "options.fields.StockPrice",                     label: "Stock Price",                   numeric: true,  width: 80,  defaultVisible: false },
  { key: "Premium",                        tKey: "options.fields.Premium",                        label: "Premium",                       numeric: true,  width: 80,  defaultVisible: true  },
  { key: "NumberOfContractsBasedOnLimit",  tKey: "options.fields.NumberOfContractsBasedOnLimit",  label: "Contracts (Limit-Based)",       numeric: true,  width: 120, defaultVisible: true  },
  { key: "1_2_3_ProbOfWorthless_Weighted", tKey: "options.fields.1_2_3_ProbOfWorthless_Weighted", label: "PoW - Weighted Average",        numeric: true,  width: 148, defaultVisible: true  },
  { key: "ImpliedVolatility",              tKey: "options.fields.ImpliedVolatility",              label: "Implied Volatility",            numeric: true,  width: 120, defaultVisible: false },
  { key: "Annualized_ROM_Pct",             tKey: "options.fields.Annualized_ROM_Pct",             label: "Annualized Return on Margin %", numeric: true,  width: 180, defaultVisible: false },
  { key: "EstTotalMargin",                 tKey: "options.fields.EstTotalMargin",                 label: "Est. Total Margin",             numeric: true,  width: 110, defaultVisible: true  },
];

export const COLUMN_KEYS = COLUMNS.map(c => c.key);

export const COLUMN_LABELS: Record<string, string> = Object.fromEntries(
  COLUMNS.map(c => [c.key, c.label])
);

const MAX_ROWS = 200;

function getRowValue(option: OptionData, key: string): number | string | null {
  return (option as Record<string, unknown>)[key] as number | string | null ?? null;
}

type Handlers = {
  onRowClick?: (option: OptionData) => void;
  onStockClick?: (stockName: string) => void;
};

function renderCellContent(key: string, option: OptionData, handlers: Handlers): React.ReactNode {
  switch (key) {
    case "StockName":
      return (
        <span
          className="stock"
          onClick={e => { e.stopPropagation(); handlers.onStockClick?.(option.StockName); }}
        >
          {option.StockName}
        </span>
      );
    case "OptionName": {
      const color = option.FinancialReport === 'Y'
        ? 'text-orange-600 dark:text-orange-400'
        : option['X-Day'] && String(option['X-Day']).toUpperCase() === 'Y'
        ? 'text-red-600 dark:text-red-400'
        : '';
      return <span className={`opt-name ${color}`}>{option.OptionName}</span>;
    }
    case "1_2_3_ProbOfWorthless_Weighted": {
      const pow = option["1_2_3_ProbOfWorthless_Weighted"];
      return (
        <div className="bar-cell" data-tone="pos">
          <span>{formatNumber(pow, key)}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(pow ?? 0) * 100}%` }} />
          </div>
        </div>
      );
    }
    default: {
      const val = (option as Record<string, unknown>)[key];
      return formatNumber(val, key);
    }
  }
}

const SortGlyph = ({ active, dir }: { active: boolean; dir: "asc" | "desc" }) => (
  <svg
    width="10" height="10" viewBox="0 0 24 24" className="sort"
    fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round"
  >
    {(!active || dir === "asc")  && <polyline points="8 7 12 3 16 7" />}
    {(!active || dir === "desc") && <polyline points="8 17 12 21 16 17" />}
  </svg>
);

const CheckMark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface Props {
  data: OptionData[];
  sortField: string | null;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  onRowClick?: (option: OptionData) => void;
  onStockClick?: (stockName: string) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const OptionsTableDS = ({
  data, sortField, sortDir, onSort, onRowClick, onStockClick, isMaximized, onToggleMaximize,
}: Props) => {
  const { t } = useTranslation("tables");
  const { columnPreferences, isLoading: prefsLoading } = useUserPreferences();
  const [activeColumnKeys, setActiveColumnKeys] = useState<string[]>(
    COLUMNS.filter(c => c.defaultVisible).map(c => c.key)
  );

  useEffect(() => {
    if (prefsLoading) return;
    if (columnPreferences.length === 0) return;

    const prefMap = new Map(columnPreferences.map(p => [p.key, p]));

    // Known keys from COLUMNS; visible extra prefs beyond COLUMNS go at the end
    const knownKeys = new Set(COLUMN_KEYS);
    const extraKeys = columnPreferences
      .filter(p => !knownKeys.has(p.key) && p.visible)
      .map(p => p.key);

    const ordered = COLUMNS
      .filter(c => {
        const pref = prefMap.get(c.key);
        return pref ? pref.visible : c.defaultVisible;
      })
      .sort((a, b) => {
        const pa = prefMap.get(a.key);
        const pb = prefMap.get(b.key);
        if (!pa && !pb) return 0;
        if (!pa) return 1;
        if (!pb) return -1;
        return pa.order - pb.order;
      });

    setActiveColumnKeys([...ordered.map(c => c.key), ...extraKeys]);
  }, [columnPreferences, prefsLoading]);

  const activeColumns = useMemo(
    () => activeColumnKeys.map(k => {
      const known = COLUMNS.find(c => c.key === k);
      if (known) return known;
      return {
        key: k,
        tKey: `options.fields.${k}`,
        label: k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim(),
        numeric: true,
        width: 120,
        defaultVisible: false,
      } as Column;
    }),
    [activeColumnKeys]
  );

  const sorted = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const av = getRowValue(a, sortField);
      const bv = getRowValue(b, sortField);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv), "sv");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortField, sortDir]);

  const rows = sorted.slice(0, MAX_ROWS);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginBottom: 6 }}>
        {onToggleMaximize && (
          <button
            type="button"
            className="btn-ghost"
            onClick={onToggleMaximize}
            title={isMaximized ? "Restore" : "Maximize table"}
          >
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        )}
        <ColumnManager
          visibleColumns={activeColumnKeys as (keyof OptionData)[]}
          onVisibilityChange={() => {}}
          onColumnOrderChange={keys => setActiveColumnKeys(keys as string[])}
        />
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {activeColumns.map(col => {
                const active = sortField === col.key;
                return (
                  <th
                    key={col.key}
                    data-num={col.numeric ? "true" : undefined}
                    data-sort={active ? sortDir : undefined}
                    style={{ minWidth: col.width }}
                    onClick={() => onSort(col.key)}
                  >
                    <span className="th-inner">
                      {t(col.tKey, { defaultValue: col.label })}
                      <FieldInfoTooltip fieldName={col.key} />
                      <SortGlyph active={active} dir={sortDir} />
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((option, i) => (
              <tr
                key={`${option.StockName}-${option.OptionName}-${i}`}
                onClick={() => onRowClick?.(option)}
              >
                {activeColumns.map(col => (
                  <td
                    key={col.key}
                    className={col.key === "StockName" ? "stock-cell" : undefined}
                    data-num={col.numeric ? "true" : undefined}
                    style={{ minWidth: col.width }}
                  >
                    {renderCellContent(col.key, option, { onRowClick, onStockClick })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

// Re-export CheckMark for use in filter popovers
export { CheckMark };
