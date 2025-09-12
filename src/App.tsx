import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Index from "./pages/Index";
import PortfolioGenerator from "./pages/PortfolioGenerator";
import OptionDetailsPage from "./pages/OptionDetailsPage";
import StockDetailsPage from "./pages/StockDetailsPage";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";

import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import ProtectedRoute from "@/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";
const queryClient = new QueryClient();

const AppHeader = () => {
  const { session, signOut } = useAuth();
  return (
    <header className="w-full flex items-center justify-between px-4 py-2">
      <Link to="/" className="font-semibold">Put Options SE</Link>
      <div>
        {session ? (
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        ) : (
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
                    <Route path="/option/:optionId" element={<ProtectedRoute><OptionDetailsPage /></ProtectedRoute>} />
                    <Route path="/stock/:stockName" element={<ProtectedRoute><StockDetailsPage /></ProtectedRoute>} />
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
