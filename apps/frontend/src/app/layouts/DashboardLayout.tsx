import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router';
import { Building2, LogOut, Menu, X, Bell, User, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { getNavigationForRole, roleLabels } from '../utils/roleConfig';
import { mockNotifications } from '../utils/mockData';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const navigationItems = getNavigationForRole(user.role);
  const unreadNotifications = mockNotifications.filter(n => !n.read).length;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-green-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent hidden sm:inline">
                SmartSite
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
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
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold">{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-gray-500">{roleLabels[user.role]}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.firstName} {user.lastName}</span>
                    <span className="text-xs font-normal text-gray-500">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
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
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
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
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
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
              Déconnecter
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
