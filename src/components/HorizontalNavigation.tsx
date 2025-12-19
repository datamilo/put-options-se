import { useNavigate, useLocation } from "react-router-dom";
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
  ArrowDown10,
  Target,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/SettingsModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/auth/AuthProvider";
import { useState } from "react";
import { useTheme } from "next-themes";

export const HorizontalNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { setTheme, theme } = useTheme();

  // Helper to determine if a route is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isGroupActive = (paths: string[]) => {
    return paths.some(path => location.pathname === path);
  };

  // Navigation button component for standalone pages
  const NavButton = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
    <Button
      onClick={() => navigate(path)}
      variant={isActive(path) ? "default" : "ghost"}
      size="sm"
      className="flex items-center gap-2 whitespace-nowrap"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
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
        <DropdownMenuTrigger asChild>
          <Button
            variant={isDropdownActive ? "default" : "ghost"}
            size="sm"
            className="flex items-center gap-1 whitespace-nowrap"
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-background border shadow-lg">
          {items.map(item => {
            const ItemIcon = item.icon;
            return (
              <DropdownMenuItem
                key={item.path}
                onClick={() => navigate(item.path)}
                className="cursor-pointer flex items-center gap-2"
              >
                <ItemIcon className="h-4 w-4" />
                <span>{item.label}</span>
                {isActive(item.path) && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <>
      {/* Desktop Horizontal Navigation */}
      <nav className="hidden md:flex items-center gap-1 flex-wrap">
        {/* Stock Analysis */}
        <NavButton path="/stock-analysis" icon={LineChart} label="Stock Analysis" />

        {/* Portfolio Generator */}
        <NavButton path="/portfolio-generator" icon={Bot} label="Portfolio Generator" />

        {/* Support Levels Dropdown */}
        <NavDropdown
          label="Support Levels"
          icon={ChartNetwork}
          items={[
            {
              path: "/consecutive-breaks",
              label: "Support Level Analysis",
              icon: ChartNetwork,
            },
            {
              path: "/support-level-options",
              label: "Support Level Options List",
              icon: Target,
            },
          ]}
        />

        {/* Portfolio Research Dropdown */}
        <NavDropdown
          label="Portfolio Research"
          icon={Calendar}
          items={[
            {
              path: "/monthly-analysis",
              label: "Monthly Analysis",
              icon: Calendar,
            },
            {
              path: "/volatility-analysis",
              label: "Financial Reporting Volatility",
              icon: Activity,
            },
          ]}
        />

        {/* Method Validation Dropdown */}
        <NavDropdown
          label="Method Validation"
          icon={TrendingUpDown}
          items={[
            {
              path: "/probability-analysis",
              label: "Probability Analysis",
              icon: TrendingUpDown,
            },
            {
              path: "/lower-bound-analysis",
              label: "Lower Bound Analysis",
              icon: ArrowDown10,
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
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 bg-background border shadow-lg z-50"
          >
            {/* Stock Analysis */}
            <DropdownMenuItem
              onClick={() => navigate("/stock-analysis")}
              className="cursor-pointer"
            >
              <LineChart className="mr-2 h-4 w-4" />
              Stock Metrics and History
            </DropdownMenuItem>

            {/* Portfolio Generator */}
            <DropdownMenuItem
              onClick={() => navigate("/portfolio-generator")}
              className="cursor-pointer"
            >
              <Bot className="mr-2 h-4 w-4" />
              Portfolio Generator
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Support Levels Group */}
            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
              Support Levels
            </div>
            <DropdownMenuItem
              onClick={() => navigate("/consecutive-breaks")}
              className="cursor-pointer ml-2"
            >
              <ChartNetwork className="mr-2 h-4 w-4" />
              Support Level Analysis
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/support-level-options")}
              className="cursor-pointer ml-2"
            >
              <Target className="mr-2 h-4 w-4" />
              Support Level Options List
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Portfolio Research Group */}
            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
              Portfolio Research
            </div>
            <DropdownMenuItem
              onClick={() => navigate("/monthly-analysis")}
              className="cursor-pointer ml-2"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Monthly Analysis
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/volatility-analysis")}
              className="cursor-pointer ml-2"
            >
              <Activity className="mr-2 h-4 w-4" />
              Financial Reporting Volatility
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Method Validation Group */}
            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
              Method Validation
            </div>
            <DropdownMenuItem
              onClick={() => navigate("/probability-analysis")}
              className="cursor-pointer ml-2"
            >
              <TrendingUpDown className="mr-2 h-4 w-4" />
              Probability Analysis
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/lower-bound-analysis")}
              className="cursor-pointer ml-2"
            >
              <ArrowDown10 className="mr-2 h-4 w-4" />
              Lower Bound Analysis
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Settings & Theme */}
            <DropdownMenuItem
              onClick={() => setSettingsOpen(true)}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
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
              Toggle Theme
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuItem
              onClick={signOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Utilities (Settings, Theme, Logout) */}
      <div className="hidden md:flex items-center gap-1">
        <Button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        <Button
          onClick={() => setSettingsOpen(true)}
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title="Open settings"
        >
          <Settings className="h-4 w-4" />
        </Button>

        <Button
          onClick={signOut}
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-destructive hover:text-destructive"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
        triggerButton={false}
      />
    </>
  );
};
