import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router";
import {
  Building2,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { getNavigationForRole, roleLabels } from "../utils/roleConfig";
import { mockNotifications } from "../utils/mockData";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoAvailable, setLogoAvailable] = useState(true);
<<<<<<< HEAD

=======
  console.log(user, "uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu");
>>>>>>> origin/main
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
<<<<<<< HEAD

=======
  console.log(user, "uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu");
>>>>>>> origin/main
  if (!user) {
    navigate("/login");
    return null;
  }

<<<<<<< HEAD
  const navigationItems = getNavigationForRole(user.role);
  const unreadNotifications = mockNotifications.filter((n) => !n.read).length;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Background pattern - same as Home */}
      <svg
        className="fixed inset-x-0 top-0 -z-10 h-[64rem] w-full stroke-gray-200 [mask-image:radial-gradient(32rem_32rem_at_center,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="dashboard-pattern"
            width={200}
            height={200}
            x="50%"
            y={-1}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
          <path
            d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
            strokeWidth={0}
          />
        </svg>
        <rect
          width="100%"
          height="100%"
          strokeWidth={0}
          fill="url(#dashboard-pattern)"
        />
      </svg>
      <div
        className="fixed left-1/2 right-0 top-0 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
        aria-hidden="true"
      >
        <div
          className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
          style={{
            clipPath:
              "polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)",
          }}
        />
      </div>
=======
  const navigationItems = getNavigationForRole(user.role.name);
  const unreadNotifications = mockNotifications.filter((n) => !n.read).length;

  const getInitials = (nom: string, lastname: string) => {
    return `${nom.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
>>>>>>> origin/main
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-white p-2 rounded-lg border border-gray-100">
                {logoAvailable ? (
                  <img
                    src="/logo.png"
                    alt="SmartSite"
                    className="h-10 w-10 object-contain"
                    onError={() => setLogoAvailable(false)}
                  />
                ) : (
                  <Building2 className="h-10 w-10 text-blue-600" />
                )}
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent hidden sm:inline">
                SmartSite
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate("/notifications")}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-green-600 text-white">
<<<<<<< HEAD
                      {getInitials(user.firstName, user.lastName)}
=======
                      {getInitials(user.firstname || "", user.lastname || "")}
>>>>>>> origin/main
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold">
<<<<<<< HEAD
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {roleLabels[user.role]}
=======
                      {user.firstname} {user.lastname}
                    </span>
                    <span className="text-xs text-gray-500">
                      {/* {roleLabels[user.role]} */}
>>>>>>> origin/main
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>
<<<<<<< HEAD
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs font-normal text-gray-500">
                      {user.email}
=======
                      {user.firstname} {user.lastname}
                    </span>
                    <span className="text-xs font-normal text-gray-500">
                      {user.cin}
>>>>>>> origin/main
                    </span>
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
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-30 h-screen bg-white border-r border-gray-200
            transition-transform duration-300 lg:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            w-64 pt-16 lg:pt-0 flex flex-col
          `}
        >
          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button at Bottom */}
          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <LogOut className="h-4 w-4" />
<<<<<<< HEAD
              Logout
=======
              Déconnecter
>>>>>>> origin/main
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
