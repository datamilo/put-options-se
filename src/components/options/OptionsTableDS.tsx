import { useMemo } from "react";
import { OptionData } from "@/types/options";
import { formatNordicNumber } from "@/utils/numberFormatting";

interface Column {
  key: string;
  label: string;
  numeric: boolean;
  width: number;
}

const COLUMNS: Column[] = [
  { key: "StockName",                      label: "Stock",        numeric: false, width: 180 },
  { key: "OptionName",                     label: "Option",       numeric: false, width: 160 },
  { key: "ExpiryDate",                     label: "Expiry",       numeric: true,  width: 100 },
  { key: "DaysToExpiry",                   label: "DTE",          numeric: true,  width: 56  },
  { key: "StrikePrice",                    label: "Strike",       numeric: true,  width: 70  },
  { key: "StockPrice",                     label: "Spot",         numeric: true,  width: 80  },
  { key: "_otmPct",                        label: "OTM",          numeric: true,  width: 70  },
  { key: "Premium",                        label: "Premium",      numeric: true,  width: 96  },
  { key: "NumberOfContractsBasedOnLimit",  label: "Contr.",       numeric: true,  width: 64  },
  { key: "1_2_3_ProbOfWorthless_Weighted", label: "P(worthless)", numeric: true,  width: 148 },
  { key: "_risk",                          label: "Risk",         numeric: false, width: 80  },
  { key: "ImpliedVolatility",              label: "IV",           numeric: true,  width: 64  },
  { key: "Annualized_ROM_Pct",             label: "Ann. ROM",     numeric: true,  width: 84  },
  { key: "EstTotalMargin",                 label: "Est. Margin",  numeric: true,  width: 110 },
];

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
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {COLUMNS.map(col => {
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
                    {col.label}
                    <SortGlyph active={active} dir={sortDir} />
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((option, i) => {
            const pow = option["1_2_3_ProbOfWorthless_Weighted"];
            const risk = getRisk(pow);
            const otm = option.StockPrice > 0
              ? ((option.StockPrice - option.StrikePrice) / option.StockPrice) * 100
              : null;

            return (
              <tr
                key={`${option.StockName}-${option.OptionName}-${i}`}
                onClick={() => onRowClick?.(option)}
              >
                {/* Stock */}
                <td className="stock-cell" style={{ minWidth: 180 }}>
                  <span
                    className="stock"
                    onClick={e => { e.stopPropagation(); onStockClick?.(option.StockName); }}
                  >
                    {option.StockName}
                  </span>
                </td>

                {/* Option name */}
                <td style={{ minWidth: 160 }}>
                  <span className="opt-name">{option.OptionName}</span>
                </td>

                {/* Expiry */}
                <td data-num="true" style={{ minWidth: 100 }}>
                  {option.ExpiryDate}
                </td>

                {/* DTE */}
                <td data-num="true" style={{ minWidth: 56 }}>
                  {option.DaysToExpiry}
                </td>

                {/* Strike */}
                <td data-num="true" style={{ minWidth: 70 }}>
                  {fmtNum(option.StrikePrice)}
                </td>

                {/* Spot */}
                <td data-num="true" style={{ minWidth: 80 }}>
                  {fmtNum(option.StockPrice, 2)}
                </td>

                {/* OTM % */}
                <td data-num="true" style={{ minWidth: 70 }}>
                  <span className={otm != null && otm >= 0 ? "delta-pos" : "delta-neg"}>
                    {otm != null ? fmtNum(otm, 1) + "%" : "—"}
                  </span>
                </td>

                {/* Premium */}
                <td data-num="true" style={{ minWidth: 96 }}>
                  {fmtSEK(option.Premium)}
                </td>

                {/* Contracts */}
                <td data-num="true" style={{ minWidth: 64 }}>
                  {option.NumberOfContractsBasedOnLimit ?? "—"}
                </td>

                {/* P(worthless) — bar-cell */}
                <td data-num="true" style={{ minWidth: 148 }}>
                  <div className="bar-cell" data-tone="pos">
                    <span>{pow != null ? fmtNum(pow * 100, 1) + "%" : "—"}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(pow ?? 0) * 100}%` }} />
                    </div>
                  </div>
                </td>

                {/* Risk pip */}
                <td style={{ minWidth: 80 }}>
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
                </td>

                {/* IV */}
                <td data-num="true" style={{ minWidth: 64 }}>
                  {fmtPct(option.ImpliedVolatility)}
                </td>

                {/* Ann. ROM */}
                <td data-num="true" style={{ minWidth: 84 }}>
                  <span className={option.Annualized_ROM_Pct != null && option.Annualized_ROM_Pct >= 12 ? "delta-pos" : undefined}>
                    {fmtPct(option.Annualized_ROM_Pct)}
                  </span>
                </td>

                {/* Est. Margin */}
                <td data-num="true" style={{ minWidth: 110 }}>
                  {fmtSEK(option.EstTotalMargin ?? null)}
                </td>
              </tr>
            );
          })}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan={COLUMNS.length}
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
  );
};

// Re-export CheckMark for use in filter popovers
export { CheckMark };
