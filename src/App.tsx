import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Index from "./pages/Index";
import PortfolioGenerator from "./pages/PortfolioGenerator";
import { MonthlyAnalysis } from "./pages/MonthlyAnalysis";
import { VolatilityAnalysis } from "./pages/VolatilityAnalysis";
import ConsecutiveBreaksAnalysis from "./pages/ConsecutiveBreaksAnalysis";
import SupportBasedOptionFinder from "./pages/SupportBasedOptionFinder";
import OptionDetailsPage from "./pages/OptionDetailsPage";
import StockDetailsPage from "./pages/StockDetailsPage";
import { ProbabilityAnalysis } from "./pages/ProbabilityAnalysis";
import { LowerBoundAnalysis } from "./pages/LowerBoundAnalysis";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";

import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import ProtectedRoute from "@/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NavigationMenu } from "@/components/NavigationMenu";
import { Home } from "lucide-react";
const queryClient = new QueryClient();

const AppHeader = () => {
  const { session } = useAuth();
  return (
    <header className="w-full flex items-center justify-between px-4 py-2 border-b">
      <div className="flex items-center gap-3">
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
            <NavigationMenu />
          </>
        )}
      </div>
      <div>
        {!session && (
          <Button asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
};

const App = () => {
  // Only GitHub Pages needs the /put-options-se basename
  // Lovable staging and development should use empty basename
  const isGitHubPages = window.location.hostname === 'datamilo.github.io';
  const basename = isGitHubPages ? '/put-options-se' : '';
  
  console.log("App component rendering", {
    location: window.location.href,
    pathname: window.location.pathname,
    hash: window.location.hash,
    hostname: window.location.hostname,
    isGitHubPages,
    basename
  });
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
                  <AppHeader />
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                    <Route path="/portfolio-generator" element={<ProtectedRoute><PortfolioGenerator /></ProtectedRoute>} />
                    <Route path="/monthly-analysis" element={<ProtectedRoute><MonthlyAnalysis /></ProtectedRoute>} />
                    <Route path="/volatility-analysis" element={<ProtectedRoute><VolatilityAnalysis /></ProtectedRoute>} />
                    <Route path="/consecutive-breaks" element={<ProtectedRoute><ConsecutiveBreaksAnalysis /></ProtectedRoute>} />
                    <Route path="/smart-option-finder" element={<ProtectedRoute><SupportBasedOptionFinder /></ProtectedRoute>} />
                    <Route path="/option/:optionId" element={<ProtectedRoute><OptionDetailsPage /></ProtectedRoute>} />
                    <Route path="/stock/:stockName" element={<ProtectedRoute><StockDetailsPage /></ProtectedRoute>} />
                    <Route path="/stock-analysis" element={<ProtectedRoute><StockDetailsPage /></ProtectedRoute>} />
                    <Route path="/probability-analysis" element={<ProtectedRoute><ProbabilityAnalysis /></ProtectedRoute>} />
                    <Route path="/lower-bound-analysis" element={<ProtectedRoute><LowerBoundAnalysis /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
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
