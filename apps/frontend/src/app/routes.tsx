import { createBrowserRouter, Navigate } from 'react-router';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboards/Dashboard';
import Sites from './pages/sites/Sites';
import Projects from './pages/projects/Projects';
import Planning from './pages/planning/Planning';
import Team from './pages/team/Team';
import Clients from './pages/clients/Clients';
import Suppliers from './pages/suppliers/Suppliers';
import Materials from './pages/materials/Materials';
import Finance from './pages/finance/Finance';
import QHSE from './pages/qhse/QHSE';
import Incidents from './pages/incidents/Incidents';
import Reports from './pages/reports/Reports';
import Analytics from './pages/analytics/Analytics';
import Map from './pages/map/Map';
import Notifications from './pages/notifications/Notifications';
import Users from './pages/users/Users';
import Profile from './pages/profile/Profile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('smartsite-auth');
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'sites',
        element: <Sites />,
      },
      {
        path: 'projects',
        element: <Projects />,
      },
      {
        path: 'planning',
        element: <Planning />,
      },
      {
        path: 'team',
        element: <Team />,
      },
      {
        path: 'clients',
        element: <Clients />,
      },
      {
        path: 'suppliers',
        element: <Suppliers />,
      },
      {
        path: 'materials',
        element: <Materials />,
      },
      {
        path: 'finance',
        element: <Finance />,
      },
      {
        path: 'qhse',
        element: <QHSE />,
      },
      {
        path: 'incidents',
        element: <Incidents />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
      {
        path: 'map',
        element: <Map />,
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-4">Page not found</p>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold">
            Return to Dashboard
          </a>
        </div>
      </div>
    ),
  },
]);
