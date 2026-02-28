import { createBrowserRouter, Navigate } from "react-router";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOTP from "./pages/auth/VerifyOTP";
import Dashboard from "./pages/dashboards/Dashboard";
import Sites from "./pages/sites/Sites";
import Projects from "./pages/projects/Projects";
import Planning from "./pages/planning/Planning";
import Team from "./pages/team/Team";
import Clients from "./pages/clients/Clients";
import Suppliers from "./pages/suppliers/Suppliers";
import Materials from "./pages/materials/Materials";
import Finance from "./pages/finance/Finance";
import QHSE from "./pages/qhse/QHSE";
import Incidents from "./pages/incidents/Incidents";
import Reports from "./pages/reports/Reports";
import Analytics from "./pages/analytics/Analytics";
import Map from "./pages/map/Map";
import Notifications from "./pages/notifications/Notifications";
import UserManagement from "./pages/users/UserManagement";
import PendingUsers from "./pages/admin/PendingUsers";
import Profile from "./pages/profile/Profile";
import Home2 from "./pages/Home/Home2";
import Pricing from "./pages/pricing/Pricing";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = true;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home2 />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/verify-otp",
    element: <VerifyOTP />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "sites",
        element: <Sites />,
      },
      
    
      {
        path: "projects",
        element: <Projects />,
      },
       {
        path: "projects",
        element: <Projects />,
      },
       {
        path: "projects",
        element: <Projects />,
      },
      {
        path: "planning",
        element: <Planning />,
      },
      {
        path: "team",
        element: <Team />,
      },
      {
        path: "clients",
        element: <Clients />,
      },
      {
        path: "suppliers",
        element: <Suppliers />,
      },
      {
        path: "materials",
        element: <Materials />,
      },
      {
        path: "finance",
        element: <Finance />,
      },
      {
        path: "qhse",
        element: <QHSE />,
      },
      {
        path: "incidents",
        element: <Incidents />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "map",
        element: <Map />,
      },
      {
        path: "notifications",
        element: <Notifications />,
      },
      {
        path: "users",
        element: <UserManagement />,
      },
      {
        path: "admin/pending-users",
        element: <PendingUsers />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
    ],
  },
  {
    path: "*",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-4">Page not found</p>
          <a
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    ),
  },
]);