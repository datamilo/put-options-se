import { useNavigate } from "react-router-dom";
import { Menu, BarChart3, TrendingUp, Activity, LogOut, Settings, Sun, Moon } from "lucide-react";
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
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";

export const NavigationMenu = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { underlyingValue, transactionCost } = useSettings();
  const { setTheme, theme } = useTheme();

  return (
    <>
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
          <DropdownMenuItem 
            onClick={() => navigate('/portfolio-generator')}
            className="cursor-pointer"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Portfolio Generator
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/monthly-analysis')}
            className="cursor-pointer"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Monthly Analysis
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/volatility-analysis')}
            className="cursor-pointer"
          >
            <Activity className="mr-2 h-4 w-4" />
            Financial Reporting Volatility
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => {
              setSettingsOpen(true);
            }}
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
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={signOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsModal 
        isOpen={settingsOpen} 
        onOpenChange={setSettingsOpen}
        triggerButton={false}
      />
    </>
  );
};