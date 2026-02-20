import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
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
import { Home } from "lucide-react";

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const AppHeader = () => {
  const { session } = useAuth();
  return (
    <header className="w-full border-b">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Left: Home Button + Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          {session && (
            <>
              <Button
                asChild
                variant="ghost"
                size="icon"
                title="Go to home page"
              >
                <Link to="/">
                  <Home className="h-5 w-5" />
                </Link>
              </Button>
              <div className="h-6 w-px bg-border hidden md:block" />
              <HorizontalNavigation />
            </>
          )}
        </div>

        {/* Right: Sign In (if not authenticated) */}
        <div>
          {!session && (
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
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
