import { useState, useEffect } from "react";


import {
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router";

import {
  Building2,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Type,
  Plus,
  Minus,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Slider } from "../components/ui/slider";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getMynavigationAccess } from "../action/permission.action";
import { Permission } from "../types";
import { getUnreadNotificationCount } from "../action/notification.action";
import ChatbotWidget from "../components/Chatbot";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "../action/auth.action";

import { ThemeButton } from "../components/ThemeButton";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTranslation } from "../hooks/useTranslation";
import SiteInfoPanel from "../components/SiteInfoPanel";
import {
  groupPermissionsByModule,
  type PermissionModuleGroup,
} from "@/app/utils/permissionModules";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { t, language } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoAvailable, setLogoAvailable] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('fontSize') || '100'));

  const toggleModuleExpanded = (moduleKey: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleKey)) {
      newExpanded.delete(moduleKey);
    } else {
      newExpanded.add(moduleKey);
    }
    setExpandedModules(newExpanded);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Update font size and save to localStorage when changed
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
    localStorage.setItem('fontSize', fontSize.toString());
  }, [fontSize]);

  const locale =
    language === "fr" ? "fr-FR" : language === "ar" ? "ar-TN" : "en-GB";

  const hrefToSidebarKey = (href: string) => {
    // "/admin/pending-users" -> "admin.pending_users"
    // "/supplier-materials"  -> "supplier_materials"
    // "/projects"            -> "projects"
    const cleaned = (href || "")
      .trim()
      .replace(/^[^a-zA-Z0-9/]+/g, "")
      .replace(/^\//, "")
      .replace(/\/+$/, "");

    if (!cleaned) return "dashboard";

    return cleaned
      .split("/")
      .filter(Boolean)
      .join(".")
      .replace(/-/g, "_");
  };

  const getSidebarLabel = (item: Permission) => {
    const key = `sidebar.${hrefToSidebarKey(item.href)}`;
    return t(key, item.name);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  // console.log(user, "uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu");

  const {
    data: navigationItems,
    isError: navigItemsError,
    isLoading,
  } = useQuery({
    queryKey: ["getMynavigationAccess"],
    queryFn: () => getMynavigationAccess(),
  });

  console.log(navigationItems, "navigationItems in DashboardLayout");

  // Utiliser useEffect pour la redirection
  useEffect(() => {
    if (!user) {
      console.log("Redirection vers login - user est null");
      navigate("/login");
    } else if (!user.role) {
      console.log("Role est null, utilisation du role par défaut");
      // Contournement : si le role est null, on considère que c'est un admin
      //   TODO: Résoudre le problème de populate dans le backend
    } else {
      // Redirection automatique pour les Project Managers
      //  const userRole = user.role?.name || user.role;
      //  if (userRole === "project_manager") {
      //    console.log("Redirection automatique vers dashboard Project Manager");
      //    navigate("/project-manager-dashboard");
      //  }
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Afficher rien pendant la redirection
  }


  const { data: currentUser } = useQuery({

    queryKey: ["currentUser"],
    queryFn: () => getCurrentUser(user), // Simuler une requête pour obtenir les données de l'utilisateur
  });


  // const isInactiveAccount = currentUser?.status === 200 && currentUser?.data?.isActif === false;

  // const isInactiveAccount =
  //   currentUser?.status === 200 && currentUser?.data?.isActif === false;

  // if (isInactiveAccount) {
  //   return redirect("/banned");
  // }

  // if(currentUser?.data.firstLogin == true){
  //   redirect("/reset-password-first-login");
  // }

  // if(currentUser?.data.isActif == false){
  //   redirect("/account-banned");
  // }


  console.log(currentUser, "currentUser in DashboardLayout");
  //const unreadNotifications = mockNotifications.filter((n) => !n.read).length;

  const { data: unredDataLength, isError: UnreadError } = useQuery({
    queryKey: ["unreadNotificationsLength"],
    queryFn: () => getUnreadNotificationCount(),
  });

  const groupedNavigationItems = groupPermissionsByModule(navigationItems ?? []);
  const unreadNotifications = 0; // Placeholder - will be implemented with real notifications

  // if(navigItemsError || UnreadError){
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <p className="text-red-500 text-lg">Error loading data. Please try again later.</p>
  //     </div>
  //   );
  // }

  // if(navigItemsError || UnreadError){
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <p className="text-red-500 text-lg">Error loading data. Please try again later.</p>
  //     </div>
  //   );
  // }

  if (navigItemsError || UnreadError) {
    console.error(
      navigItemsError,
      UnreadError,
      "errrrrrrrrrrrrrrrrrrrrrrrrrrrr",
    );
  }
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40" role="banner">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={
                sidebarOpen
                  ? t("accessibility.closeSidebar", "Close sidebar menu")
                  : t("accessibility.openSidebar", "Open sidebar menu")
              }
              aria-controls="primary-sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </Button>
            <Link
              to="/"
              className="group flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div className="relative bg-card p-2 rounded-lg border border-border transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:border-blue-300/70 group-hover:-translate-y-0.5">
                <span className="pointer-events-none absolute inset-0 rounded-lg bg-linear-to-r from-blue-500/0 via-blue-500/0 to-green-500/0 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100 group-hover:from-blue-500/20 group-hover:to-green-500/20" />
                {logoAvailable ? (
                  <img
                    src="/logo.png"
                    alt="SmartSite"
                    className="relative h-12 w-12 object-contain transition-transform duration-300 motion-safe:animate-[pulse_5s_ease-in-out_infinite] group-hover:scale-125 group-hover:rotate-2"
                    onError={() => setLogoAvailable(false)}
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-blue-600 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-2" />
                )}
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-green-600 bg-clip-text text-transparent hidden sm:inline transition-all duration-300 group-hover:tracking-wide">
                SmartSite
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Site Info Panel */}
            <div className="hidden lg:block">
              <SiteInfoPanel />
            </div>

            {/* Date & Time */}
            <div className="hidden md:flex flex-col items-end text-sm mr-2">
              <span className="font-medium text-foreground">
                {currentTime.toLocaleDateString(locale, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="text-muted-foreground text-xs">
                {currentTime.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Theme & Language Selectors */}

            {/* Font Size Control */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("accessibility.fontSize", "Taille du texte")}
                  title="Taille du texte"
                >
                  <Type className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Taille du texte</p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setFontSize(prev => Math.max(80, prev - 10))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Slider
                      min={80}
                      max={140}
                      step={10}
                      value={[fontSize]}
                      onValueChange={([value]) => setFontSize(value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setFontSize(prev => Math.min(140, prev + 10))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    {fontSize}%
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setFontSize(100)}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <ThemeButton />
            <LanguageSelector />

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={t(
                "accessibility.openNotifications",
                "Open notifications",
              )}
              onClick={() => navigate("/notifications")}
            >
              <Bell aria-hidden="true" className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          id="primary-sidebar"
          aria-label="Sidebar navigation"
          className={cn(
            "fixed lg:sticky top-0 left-0 z-30 h-screen w-72 xl:w-80 flex flex-col",
            "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
            "transition-transform duration-300 ease-out lg:translate-x-0",
            "pt-16 lg:pt-7 shadow-sm",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <nav className="px-5 py-5 space-y-4 overflow-y-auto flex-1 lg:px-6 lg:py-6">
            {!isLoading &&
              groupedNavigationItems.map((section: PermissionModuleGroup) => {
                const isExpanded = expandedModules.has(section.key);
                return (
                  <div key={section.key} className="group">
                    <button
                      onClick={() => toggleModuleExpanded(section.key)}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 ease-out text-left group-hover:bg-accent/30 focus:outline-none"
                      aria-expanded={isExpanded}
                      aria-controls={`module-${section.key}`}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground/75 group-hover:text-muted-foreground transition-colors duration-200 leading-5">
                        {t(`sidebar.modules.${section.key}`, section.label)}
                      </p>
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 text-muted-foreground/50 transition-all duration-300 ease-out shrink-0 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div
                        id={`module-${section.key}`}
                        className="mt-2.5 space-y-2 pl-2.5 overflow-hidden animate-in fade-in duration-200"
                      >
                        {section.items.map((item: Permission, idx: number) => {
                          const isActive =
                            location.pathname === item.href ||
                            location.pathname.startsWith(`${item.href}/`);

                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              onClick={() => setSidebarOpen(false)}
                              style={{
                                animation: isExpanded
                                  ? `fadeInSlide 300ms ease-out ${idx * 30}ms forwards`
                                  : "none",
                                opacity: isExpanded ? 1 : 0,
                                transform: isExpanded ? "translateY(0)" : "translateY(-8px)",
                              }}
                              className={`
                              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                              ${
                                isActive
                                  ? "bg-linear-to-r from-blue-500/90 to-green-500/90 text-white shadow-sm hover:shadow-md"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 active:bg-muted"
                              }
                            `}
                            >
                              <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                isActive ? "bg-white/70" : "bg-muted-foreground/40 group-hover/link:bg-muted-foreground/60"
                              }`} />
                              <span className="font-medium text-sm leading-6 truncate">{getSidebarLabel(item)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </nav>

          <style>{`
            @keyframes fadeInSlide {
              from {
                opacity: 0;
                transform: translateY(-8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          <div className="px-5 py-5 mt-auto border-t border-sidebar-border bg-sidebar/95 backdrop-blur-sm lg:px-6">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-center gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {t("userMenu.logout", "Logout")}
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label={t(
              "accessibility.closeSidebarOverlay",
              "Close sidebar overlay",
            )}
            className="fixed inset-0  bg-opacity-10 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main
          id="main-content"
          data-app-content
          tabIndex={-1}
          className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 xl:px-14 outline-none"
        >
          <div className="mx-auto w-full max-w-[1440px] space-y-6 lg:space-y-8">
            <Outlet />
          </div>
        </main>
      </div>

      <ChatbotWidget />
    </div>
  );
}
