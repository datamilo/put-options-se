import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { OptionData } from "@/types/options";
import { formatNordicNumber } from "@/utils/numberFormatting";
import { FieldInfoTooltip } from "@/components/ui/field-info-tooltip";
import { ColumnManager } from "./ColumnManager";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface Column {
  key: string;
  tKey: string;
  label: string;
  numeric: boolean;
  width: number;
  defaultVisible: boolean;
}

const COLUMNS: Column[] = [
  { key: "StockName",                      tKey: "options.stock",       label: "Stock",        numeric: false, width: 180, defaultVisible: true  },
  { key: "OptionName",                     tKey: "options.option",      label: "Option",       numeric: false, width: 160, defaultVisible: true  },
  { key: "ExpiryDate",                     tKey: "options.expiry",      label: "Expiry",       numeric: true,  width: 100, defaultVisible: true  },
  { key: "DaysToExpiry",                   tKey: "options.dte",         label: "DTE",          numeric: true,  width: 56,  defaultVisible: true  },
  { key: "StrikePrice",                    tKey: "options.strikePrice", label: "Strike",       numeric: true,  width: 70,  defaultVisible: true  },
  { key: "StockPrice",                     tKey: "options.spot",        label: "Spot",         numeric: true,  width: 80,  defaultVisible: true  },
  { key: "_otmPct",                        tKey: "options.otm",         label: "OTM %",        numeric: true,  width: 70,  defaultVisible: true  },
  { key: "Premium",                        tKey: "options.premium",     label: "Premium",      numeric: true,  width: 96,  defaultVisible: true  },
  { key: "NumberOfContractsBasedOnLimit",  tKey: "options.contr",       label: "Contr.",       numeric: true,  width: 64,  defaultVisible: true  },
  { key: "1_2_3_ProbOfWorthless_Weighted", tKey: "options.pow",         label: "P(worthless)", numeric: true,  width: 148, defaultVisible: true  },
  { key: "_risk",                          tKey: "options.riskLevel",   label: "Risk",         numeric: false, width: 80,  defaultVisible: true  },
  { key: "ImpliedVolatility",              tKey: "options.iv",          label: "IV",           numeric: true,  width: 64,  defaultVisible: true  },
  { key: "Annualized_ROM_Pct",             tKey: "options.annRom",      label: "Ann. ROM",     numeric: true,  width: 84,  defaultVisible: true  },
  { key: "EstTotalMargin",                 tKey: "options.margin",      label: "Est. Margin",  numeric: true,  width: 110, defaultVisible: true  },
];

export const COLUMN_KEYS = COLUMNS.map(c => c.key);

export const COLUMN_LABELS: Record<string, string> = Object.fromEntries(
  COLUMNS.map(c => [c.key, c.label])
);

const MAX_ROWS = 200;

function getRowValue(option: OptionData, key: string): number | string | null {
  if (key === "_otmPct") {
    const s = option.StockPrice;
    const k = option.StrikePrice;
    return s > 0 ? ((s - k) / s) * 100 : null;
  }
  if (key === "_risk") {
    const p = option["1_2_3_ProbOfWorthless_Weighted"];
    return p >= 0.80 ? "low" : p >= 0.65 ? "med" : "high";
  }
  return (option as Record<string, unknown>)[key] as number | string | null ?? null;
}

function getRisk(pow: number): "low" | "med" | "high" {
  return pow >= 0.80 ? "low" : pow >= 0.65 ? "med" : "high";
}

function fmtSEK(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "—";
  const abs = formatNordicNumber(Math.abs(Math.round(n)));
  return n < 0 ? `−${abs}` : abs;
}

function fmtNum(n: number | null | undefined, dp = 0): string {
  if (n == null || isNaN(n)) return "—";
  return formatNordicNumber(n, dp);
}

function fmtPct(n: number | null | undefined, dp = 1): string {
  if (n == null || isNaN(n)) return "—";
  return formatNordicNumber(n, dp) + "%";
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
    case "OptionName":
      return <span className="opt-name">{option.OptionName}</span>;
    case "ExpiryDate":
      return option.ExpiryDate;
    case "DaysToExpiry":
      return option.DaysToExpiry;
    case "StrikePrice":
      return fmtNum(option.StrikePrice);
    case "StockPrice":
      return fmtNum(option.StockPrice, 2);
    case "_otmPct": {
      const otm = option.StockPrice > 0
        ? ((option.StockPrice - option.StrikePrice) / option.StockPrice) * 100
        : null;
      return (
        <span className={otm != null && otm >= 0 ? "delta-pos" : "delta-neg"}>
          {otm != null ? fmtNum(otm, 1) + "%" : "—"}
        </span>
      );
    }
    case "Premium":
      return fmtSEK(option.Premium);
    case "NumberOfContractsBasedOnLimit":
      return option.NumberOfContractsBasedOnLimit ?? "—";
    case "1_2_3_ProbOfWorthless_Weighted": {
      const pow = option["1_2_3_ProbOfWorthless_Weighted"];
      return (
        <div className="bar-cell" data-tone="pos">
          <span>{pow != null ? fmtNum(pow * 100, 1) + "%" : "—"}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(pow ?? 0) * 100}%` }} />
          </div>
        </div>
      );
    }
    case "_risk": {
      const pow = option["1_2_3_ProbOfWorthless_Weighted"];
      const risk = getRisk(pow);
      return (
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <span className="risk-pip" data-r={risk} />
          <span style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--ink-3)",
          }}>
            {risk === "low" ? "Low" : risk === "med" ? "Med" : "High"}
          </span>
        </span>
      );
    }
    case "ImpliedVolatility":
      return fmtPct(option.ImpliedVolatility);
    case "Annualized_ROM_Pct":
      return (
        <span className={option.Annualized_ROM_Pct != null && option.Annualized_ROM_Pct >= 12 ? "delta-pos" : undefined}>
          {fmtPct(option.Annualized_ROM_Pct)}
        </span>
      );
    case "EstTotalMargin":
      return fmtSEK(option.EstTotalMargin ?? null);
    default:
      return "—";
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
}

export const OptionsTableDS = ({
  data, sortField, sortDir, onSort, onRowClick, onStockClick,
}: Props) => {
  const { t } = useTranslation("tables");
  const { columnPreferences, isLoading: prefsLoading } = useUserPreferences();
  const [activeColumnKeys, setActiveColumnKeys] = useState<string[]>(
    COLUMNS.filter(c => c.defaultVisible).map(c => c.key)
  );

  useEffect(() => {
    if (prefsLoading) return;

    const colKeySet = new Set(COLUMN_KEYS);
    const relevantPrefs = columnPreferences.filter(p => colKeySet.has(p.key));

    if (relevantPrefs.length === 0) return;

    const prefMap = new Map(relevantPrefs.map(p => [p.key, p]));
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
    setActiveColumnKeys(ordered.map(c => c.key));
  }, [columnPreferences, prefsLoading]);

  const activeColumns = useMemo(
    () => activeColumnKeys.map(k => COLUMNS.find(c => c.key === k)!).filter(Boolean),
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <ColumnManager
          visibleColumns={activeColumnKeys as (keyof OptionData)[]}
          onVisibilityChange={() => {}}
          onColumnOrderChange={keys => setActiveColumnKeys(keys as string[])}
          columnKeys={COLUMN_KEYS}
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

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={activeColumns.length}
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                >
                  No options match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

// Re-export CheckMark for use in filter popovers
export { CheckMark };
