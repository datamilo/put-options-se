import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SettingsProvider } from "@/contexts/SettingsContext";

// Lazy-loaded page components — each becomes its own chunk
const Index = React.lazy(() => import("./pages/Index"));
const PortfolioGenerator = React.lazy(() => import("./pages/PortfolioGenerator"));
const MonthlyAnalysis = React.lazy(() => import("./pages/MonthlyAnalysis").then(m => ({ default: m.MonthlyAnalysis })));
const VolatilityAnalysis = React.lazy(() => import("./pages/VolatilityAnalysis").then(m => ({ default: m.VolatilityAnalysis })));
const ConsecutiveBreaksAnalysis = React.lazy(() => import("./pages/ConsecutiveBreaksAnalysis"));
const SupportBasedOptionFinder = React.lazy(() => import("./pages/SupportBasedOptionFinder"));
const OptionDetailsPage = React.lazy(() => import("./pages/OptionDetailsPage"));
const StockDetailsPage = React.lazy(() => import("./pages/StockDetailsPage"));
const ProbabilityAnalysis = React.lazy(() => import("./pages/ProbabilityAnalysis").then(m => ({ default: m.ProbabilityAnalysis })));
const LowerBoundAnalysis = React.lazy(() => import("./pages/LowerBoundAnalysis").then(m => ({ default: m.LowerBoundAnalysis })));
const AutomatedRecommendations = React.lazy(() => import("./pages/AutomatedRecommendations"));
const ScoredOptions = React.lazy(() => import("./pages/ScoredOptions").then(m => ({ default: m.ScoredOptions })));
const IVAnalysis = React.lazy(() => import("./pages/IVAnalysis").then(m => ({ default: m.IVAnalysis })));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Auth = React.lazy(() => import("./pages/Auth"));
const AuthCallback = React.lazy(() => import("./pages/AuthCallback"));

import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import ProtectedRoute from "@/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { SettingsModal } from "@/components/SettingsModal";
import {
  Settings, Sun, Moon, LogOut,
  Menu, Calendar, Activity, TrendingUp, TrendingUpDown, ArrowDown10,
  LineChart, Sparkles, Target, Bot, ChartNetwork,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

const PageLoader = () => {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{t('status.loading')}</p>
      </div>
    </div>
  );
};

const queryClient = new QueryClient();

const Brand = () => (
  <RouterLink to="/" className="brand">
    <span className="brand-mark" aria-hidden="true" />
    <div className="brand-text">
      Put Options
      <div className="brand-sub">SE · Analytics</div>
    </div>
  </RouterLink>
);

const AppHeader = () => {
  const { session, signOut } = useAuth();
  const { t, i18n } = useTranslation("common");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const lang = i18n.language?.startsWith("sv") ? "sv" : "en";
  const toggleLang = () => i18n.changeLanguage(lang === "en" ? "sv" : "en");
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  if (!session) {
    return (
      <header className="topbar">
        <div className="topbar-inner">
          <Brand />
          <div className="topbar-right">
            <Button asChild size="sm">
              <RouterLink to="/auth">{t("appShell.signIn")}</RouterLink>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="topbar">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        {t("appShell.skipToMain")}
      </a>
      <div className="topbar-inner">
        <Brand />
        <HorizontalNavigation />

        {/* Desktop right utilities */}
        <div className="topbar-right">
          <button
            type="button"
            className="lang-toggle hidden md:inline-flex"
            onClick={toggleLang}
            title={t("language.switchLanguage")}
          >
            <span style={{ fontWeight: lang === "en" ? 700 : 400, opacity: lang === "en" ? 1 : 0.4 }}>EN</span>
            <span style={{ opacity: 0.3, margin: "0 2px" }}>|</span>
            <span style={{ fontWeight: lang === "sv" ? 700 : 400, opacity: lang === "sv" ? 1 : 0.4 }}>SV</span>
          </button>
          <button
            type="button"
            className="icon-btn hidden md:inline-flex"
            onClick={() => setSettingsOpen(true)}
            title={t("nav.calculationSettings")}
          >
            <Settings size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="icon-btn hidden md:inline-flex"
            onClick={toggleTheme}
            title={theme === "dark" ? t("nav.switchToLightMode") : t("nav.switchToDarkMode")}
          >
            {theme === "dark" ? (
              <Sun size={14} strokeWidth={1.5} />
            ) : (
              <Moon size={14} strokeWidth={1.5} />
            )}
          </button>
          <button
            type="button"
            className="icon-btn hidden md:inline-flex"
            onClick={signOut}
            title={t("nav.signOut")}
          >
            <LogOut size={14} strokeWidth={1.5} />
          </button>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="icon-btn" style={{ width: 36, height: 36 }}>
                  <Menu size={16} strokeWidth={1.5} />
                  <span className="sr-only">{t("nav.openMenu")}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-background border shadow-lg z-50">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <RouterLink to="/">{t("nav.options")}</RouterLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <RouterLink to="/consecutive-breaks">
                    <ChartNetwork className="mr-2 h-4 w-4" />
                    {t("nav.support")}
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {t("nav.historyAndVolatility")}
                </div>
                <DropdownMenuItem asChild className="cursor-pointer pl-4">
                  <RouterLink to="/monthly-analysis">
                    <Calendar className="mr-2 h-4 w-4" />
                    {t("nav.monthlyAnalysis")}
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer pl-4">
                  <RouterLink to="/volatility-analysis">
                    <Activity className="mr-2 h-4 w-4" />
                    {t("nav.financialReportingVolatility")}
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer pl-4">
                  <RouterLink to="/iv-analysis">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {t("nav.impliedVolatilityHistory")}
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {t("nav.validation")}
                </div>
                <DropdownMenuItem asChild className="cursor-pointer pl-4">
                  <RouterLink to="/probability-analysis">
                    <TrendingUpDown className="mr-2 h-4 w-4" />
                    {t("nav.probabilityAnalysis")}
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer pl-4">
                  <RouterLink to="/lower-bound-analysis">
                    <ArrowDown10 className="mr-2 h-4 w-4" />
                    {t("nav.lowerBoundAnalysis")}
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <RouterLink to="/stock-analysis">
                    <LineChart className="mr-2 h-4 w-4" />
                    {t("nav.stocks")}
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {t("nav.automated")}
                </div>
                <DropdownMenuItem asChild className="cursor-pointer pl-4">
                  <RouterLink to="/recommendations">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("nav.automatedPutOptionRecommendations")}
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer pl-4">
                  <RouterLink to="/scored-options">
                    <Target className="mr-2 h-4 w-4" />
                    {t("nav.scoredOptions")}
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer pl-4">
                  <RouterLink to="/portfolio-generator">
                    <Bot className="mr-2 h-4 w-4" />
                    {t("nav.portfolioGenerator")}
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer pl-4">
                  <RouterLink to="/support-level-options">
                    <Target className="mr-2 h-4 w-4" />
                    {t("nav.supportLevelOptionsList")}
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t("nav.settings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                  {theme === "dark" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  {t("nav.toggleTheme")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <SettingsModal
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
        triggerButton={false}
      />
    </header>
  );
};

const App = () => {
  // Only GitHub Pages needs the /put-options-se basename
  // Lovable staging and development should use empty basename
  const isGitHubPages = window.location.hostname === 'datamilo.github.io';
  const basename = isGitHubPages ? '/put-options-se' : '';
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <SettingsProvider>
            <TooltipProvider>
              <ErrorBoundary>
                <Toaster />
                <Sonner />
                <BrowserRouter basename={basename}>
                  <AnalyticsProvider>
                    <AppHeader />
                    <main id="main-content">
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/auth/callback" element={<AuthCallback />} />
                          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                          <Route path="/portfolio-generator" element={<ProtectedRoute><PortfolioGenerator /></ProtectedRoute>} />
                          <Route path="/monthly-analysis" element={<ProtectedRoute><MonthlyAnalysis /></ProtectedRoute>} />
                          <Route path="/volatility-analysis" element={<ProtectedRoute><VolatilityAnalysis /></ProtectedRoute>} />
                          <Route path="/iv-analysis" element={<ProtectedRoute><IVAnalysis /></ProtectedRoute>} />
                          <Route path="/consecutive-breaks" element={<ProtectedRoute><ConsecutiveBreaksAnalysis /></ProtectedRoute>} />
                          <Route path="/support-level-options" element={<ProtectedRoute><SupportBasedOptionFinder /></ProtectedRoute>} />
                          <Route path="/option/:optionId" element={<ProtectedRoute><OptionDetailsPage /></ProtectedRoute>} />
                          <Route path="/stock/:stockName" element={<ProtectedRoute><StockDetailsPage /></ProtectedRoute>} />
                          <Route path="/stock-analysis" element={<ProtectedRoute><StockDetailsPage /></ProtectedRoute>} />
                          <Route path="/probability-analysis" element={<ProtectedRoute><ProbabilityAnalysis /></ProtectedRoute>} />
                          <Route path="/lower-bound-analysis" element={<ProtectedRoute><LowerBoundAnalysis /></ProtectedRoute>} />
                          <Route path="/recommendations" element={<ProtectedRoute><AutomatedRecommendations /></ProtectedRoute>} />
                          <Route path="/scored-options" element={<ProtectedRoute><ScoredOptions /></ProtectedRoute>} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </main>
                  </AnalyticsProvider>
                </BrowserRouter>
              </ErrorBoundary>
            </TooltipProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
