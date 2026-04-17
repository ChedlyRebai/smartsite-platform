import React from "react";
import { Building2, User, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

const SiteInfoPanel = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const userName = isAuthenticated && user 
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Non connecté";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Site Info */}
        <div className="flex items-center gap-2 flex-1">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Site
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              SmartSite Construction
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-blue-200 dark:bg-blue-800" />

        {/* User Info - Interactive */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2 hover:bg-white dark:hover:bg-slate-800/50 cursor-pointer">
              <div className="flex items-center gap-2 flex-1">
                <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg">
                  <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Utilisateur
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {userName}
                  </p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{userName}</span>
                {isAuthenticated && user && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {user.cin}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default SiteInfoPanel;
