import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

type NavLink = { kind: "link"; label: string; to: string };
type NavGroup = {
  kind: "group";
  label: string;
  items: Array<{ label: string; to: string; hint?: string }>;
};
type NavEntry = NavLink | NavGroup;

export const HorizontalNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation("common");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const NAV: NavEntry[] = [
    { kind: "link", label: t("nav.options"), to: "/" },
    { kind: "link", label: t("nav.support"), to: "/consecutive-breaks" },
    {
      kind: "group",
      label: t("nav.historyAndVolatility"),
      items: [
        { label: t("nav.monthlyAnalysis"), to: "/monthly-analysis" },
        { label: t("nav.financialReportingVolatility"), to: "/volatility-analysis" },
        { label: t("nav.impliedVolatilityHistory"), to: "/iv-analysis" },
      ],
    },
    {
      kind: "group",
      label: t("nav.validation"),
      items: [
        { label: t("nav.probabilityAnalysis"), to: "/probability-analysis" },
        { label: t("nav.lowerBoundAnalysis"), to: "/lower-bound-analysis" },
      ],
    },
    { kind: "link", label: t("nav.stocks"), to: "/stock-analysis" },
    {
      kind: "group",
      label: t("nav.automated"),
      items: [
        { label: t("nav.automatedPutOptionRecommendations"), to: "/recommendations", hint: "auto" },
        { label: t("nav.scoredOptions"), to: "/scored-options" },
        { label: t("nav.portfolioGenerator"), to: "/portfolio-generator" },
        { label: t("nav.supportLevelOptionsList"), to: "/support-level-options" },
      ],
    },
  ];

  const isLinkActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname === to;

  const isGroupActive = (items: Array<{ to: string }>) =>
    items.some((item) => location.pathname === item.to);

  return (
    <nav ref={navRef} className="nav hidden md:flex">
      {NAV.map((entry) => {
        if (entry.kind === "link") {
          const active = isLinkActive(entry.to);
          return (
            <Link
              key={entry.to}
              to={entry.to}
              className="nav-btn"
              data-active={active ? "true" : undefined}
            >
              {entry.label}
            </Link>
          );
        }

        const active = isGroupActive(entry.items);
        const isOpen = openMenu === entry.label;

        return (
          <div key={entry.label} className="nav-group">
            <button
              type="button"
              className="nav-btn"
              data-active={active ? "true" : undefined}
              onClick={() => setOpenMenu(isOpen ? null : entry.label)}
            >
              {entry.label}
              <ChevronDown size={10} strokeWidth={1.5} className="chev" />
            </button>
            {isOpen && (
              <div className="nav-menu">
                {entry.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="nav-menu-item"
                    data-active={isLinkActive(item.to) ? "true" : undefined}
                    onClick={() => setOpenMenu(null)}
                  >
                    <span className="label">{item.label}</span>
                    {item.hint && <span className="hint">{item.hint}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
