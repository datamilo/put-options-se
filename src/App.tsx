import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <SettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <AppHeader />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/" element={<Index />} />
                <Route path="/portfolio-generator" element={<PortfolioGenerator />} />
                <Route path="/option/:optionId" element={<OptionDetailsPage />} />
                <Route path="/stock/:stockName" element={<StockDetailsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </HashRouter>
          </TooltipProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
