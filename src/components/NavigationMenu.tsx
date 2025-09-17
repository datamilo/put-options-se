import { useNavigate } from "react-router-dom";
import { Menu, BarChart3, TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/SettingsModal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/auth/AuthProvider";

export const NavigationMenu = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

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
          
          <DropdownMenuItem asChild>
            <div className="w-full">
              <SettingsModal />
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <div className="flex items-center px-2 py-1.5">
              <span className="mr-2 text-sm">Theme</span>
              <ThemeToggle />
            </div>
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

    </>
  );
};