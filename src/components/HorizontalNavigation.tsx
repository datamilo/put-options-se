import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  Bot,
  Calendar,
  Activity,
  LogOut,
  Settings,
  Sun,
  Moon,
  ChartNetwork,
  LineChart,
  TrendingUpDown,
  TrendingUp,
  ArrowDown10,
  Target,
  ChevronDown,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/auth/AuthProvider";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

export const HorizontalNavigation = ({ onOpenSettings }: { onOpenSettings: () => void }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation('common');

  // Helper to determine if a route is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isGroupActive = (paths: string[]) => {
    return paths.some(path => location.pathname === path);
  };

  // Navigation button component for standalone pages
  const NavButton = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant={isActive(path) ? "default" : "ghost"}
          size="sm"
          className="flex items-center gap-2"
        >
          <Link to={path}>
            <Icon className="h-4 w-4" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );

  // Dropdown group component
  const NavDropdown = ({
    label,
    icon: Icon,
    items,
  }: {
    label: string;
    icon: any;
    items: Array<{ path: string; label: string; icon: any }>;
  }) => {
    const isDropdownActive = isGroupActive(items.map(i => i.path));
    return (
      <DropdownMenu>
        <Tooltip>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant={isDropdownActive ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-1"
              >
                <Icon className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="w-56 bg-background border shadow-lg">
          {items.map(item => {
            const ItemIcon = item.icon;
            return (
              <DropdownMenuItem
                key={item.path}
                asChild
                className="cursor-pointer flex items-center gap-2"
              >
                <Link to={item.path}>
                  <ItemIcon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {isActive(item.path) && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <TooltipProvider>
      {/* Desktop Horizontal Navigation */}
      <nav className="hidden md:flex items-center gap-1 flex-wrap flex-1">
        {/* Support Level Analysis */}
        <NavButton path="/consecutive-breaks" icon={ChartNetwork} label={t('nav.supportLevelAnalysis')} />

        {/* Historical Performance and Volatility Dropdown */}
        <NavDropdown
          label={t('nav.historicalPerformanceAndVolatility')}
          icon={Calendar}
          items={[
            {
              path: "/monthly-analysis",
              label: t('nav.monthlyAnalysis'),
              icon: Calendar,
            },
            {
              path: "/volatility-analysis",
              label: t('nav.financialReportingVolatility'),
              icon: Activity,
            },
            {
              path: "/iv-analysis",
              label: t('nav.impliedVolatilityHistory'),
              icon: TrendingUp,
            },
          ]}
        />

        {/* Method Validation Dropdown */}
        <NavDropdown
          label={t('nav.methodValidation')}
          icon={TrendingUpDown}
          items={[
            {
              path: "/probability-analysis",
              label: t('nav.probabilityAnalysis'),
              icon: TrendingUpDown,
            },
            {
              path: "/lower-bound-analysis",
              label: t('nav.lowerBoundAnalysis'),
              icon: ArrowDown10,
            },
          ]}
        />

        {/* Stock Metrics and History */}
        <NavButton path="/stock-analysis" icon={LineChart} label={t('nav.stockMetricsAndHistory')} />

        {/* Automated Analysis Dropdown */}
        <NavDropdown
          label={t('nav.automatedAnalysis')}
          icon={Zap}
          items={[
            {
              path: "/recommendations",
              label: t('nav.automatedPutOptionRecommendations'),
              icon: Sparkles,
            },
            {
              path: "/scored-options",
              label: t('nav.scoredOptions'),
              icon: Target,
            },
            {
              path: "/portfolio-generator",
              label: t('nav.automaticPortfolioGenerator'),
              icon: Bot,
            },
            {
              path: "/support-level-options",
              label: t('nav.supportLevelOptionsList'),
              icon: Target,
            },
          ]}
        />
      </nav>

      {/* Mobile Hamburger Menu */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Menu className="h-4 w-4" />
              <span className="sr-only">{t('nav.openMenu')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 bg-background border shadow-lg z-50"
          >
            {/* Stock Metrics and History */}
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/stock-analysis">
                <LineChart className="mr-2 h-4 w-4" />
                {t('nav.stockMetricsAndHistory')}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Support Level Analysis */}
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/consecutive-breaks">
                <ChartNetwork className="mr-2 h-4 w-4" />
                {t('nav.supportLevelAnalysis')}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Automated Analysis Group */}
            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
              {t('nav.automatedAnalysis')}
            </div>
            <DropdownMenuItem asChild className="cursor-pointer ml-2">
              <Link to="/recommendations">
                <Sparkles className="mr-2 h-4 w-4" />
                {t('nav.automatedPutOptionRecommendations')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer ml-2">
              <Link to="/scored-options">
                <Target className="mr-2 h-4 w-4" />
                {t('nav.scoredOptions')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer ml-2">
              <Link to="/portfolio-generator">
                <Bot className="mr-2 h-4 w-4" />
                {t('nav.automaticPortfolioGenerator')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer ml-2">
              <Link to="/support-level-options">
                <Target className="mr-2 h-4 w-4" />
                {t('nav.supportLevelOptionsList')}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Historical Performance and Volatility Group */}
            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
              {t('nav.historicalPerformanceAndVolatility')}
            </div>
            <DropdownMenuItem asChild className="cursor-pointer ml-2">
              <Link to="/monthly-analysis">
                <Calendar className="mr-2 h-4 w-4" />
                {t('nav.monthlyAnalysis')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer ml-2">
              <Link to="/volatility-analysis">
                <Activity className="mr-2 h-4 w-4" />
                {t('nav.financialReportingVolatility')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer ml-2">
              <Link to="/iv-analysis">
                <TrendingUp className="mr-2 h-4 w-4" />
                {t('nav.impliedVolatilityHistory')}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Method Validation Group */}
            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
              {t('nav.methodValidation')}
            </div>
            <DropdownMenuItem asChild className="cursor-pointer ml-2">
              <Link to="/probability-analysis">
                <TrendingUpDown className="mr-2 h-4 w-4" />
                {t('nav.probabilityAnalysis')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer ml-2">
              <Link to="/lower-bound-analysis">
                <ArrowDown10 className="mr-2 h-4 w-4" />
                {t('nav.lowerBoundAnalysis')}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Settings & Theme */}
            <DropdownMenuItem
              onClick={onOpenSettings}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              {t('nav.settings')}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="cursor-pointer"
            >
              {theme === "light" ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : (
                <Sun className="mr-2 h-4 w-4" />
              )}
              {t('nav.toggleTheme')}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuItem
              onClick={signOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('nav.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </TooltipProvider>
  );
};
