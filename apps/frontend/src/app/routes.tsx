import { createBrowserRouter, Navigate } from "react-router";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ChangePasswordFirstLogin from "./pages/auth/ChangePasswordFirstLogin";
import Dashboard from "./pages/dashboards/Dashboard";
import ProjectManagerDashboard from "./pages/dashboard/ProjectManagerDashboard";
import SuperAdminProjectsDashboard from "./pages/dashboard/SuperAdminProjectsDashboard";
import Sites from "./pages/sites/Sites";
import Projects from "./pages/projects/Projects";
import Planning from "./pages/planning/MyTask";
import Team from "./pages/team/Team";
import Clients from "./pages/clients/Clients";
import Materials from "./pages/materials/Materials";
import Finance from "./pages/finance/Finance";
import Payments from "./pages/payments/Payments";
import QHSE from "./pages/qhse/QHSE";
import Incidents from "./pages/incidents/Incidents";
import Reports from "./pages/reports/Reports";
import Analytics from "./pages/analytics/Analytics";
import Map from "./pages/map/Map";
import Notifications from "./pages/notifications/Notifications";
import UserManagement from "./pages/users/UserManagement";
import PendingUsers from "./pages/admin/PendingUsers";
import SystemLogs from "./pages/admin/SystemLogs";
import Profile from "./pages/profile/Profile";
import Home2 from "./pages/Home/Home2";
import Pricing from "./pages/pricing/Pricing";
import ClientsNew from "./pages/clients/ClientsNew";
import UserGuide from "./pages/guide/UserGuide";
import SupplierList from "./pages/suppliers/SupplierList";
import AddSupplier from "./pages/suppliers/AddSupplier";
import EditSupplier from "./pages/suppliers/EditSupplier";
import SupplierDetails from "./pages/suppliers/SupplierDetails";

import Catalog from "./pages/catalog/Catalog";
import CatalogList from "./pages/catalog/CatalogList";
import AddCatalogItem from "./pages/catalog/AddCatalogItem";
import EditCatalogItem from "./pages/catalog/EditCatalogItem";
import CatalogDetails from "./pages/catalog/CatalogDetails";
import CheckoutSimulator from "./pages/CheckoutSimulator";
import PLaningProjects from "./pages/planning/PLaningProjects";
import ProjectMilestone from "./pages/planning/ProjectMilestone";
import MilestoneTasks from "./pages/planning/MilestoneTasks";
import MyTask from "./pages/planning/MyTask";
import GanttChart from "./pages/planning/GanttManage";
import MilestoneTaskss from "./pages/planning/MilestoneTaskss";
import NotFound from "./pages/Error/NotFound";
import { PermissionLoader } from "./components/shared/PermissionLoader";
import ResourceOptimizationDashboard from "@/features/resource-optimization/pages/ResourceOptimizationDashboard";

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
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/change-password-first-login",
    element: <ChangePasswordFirstLogin />,
  },
  {
    path: "/",
    element: (
      <PermissionLoader>
        <DashboardLayout />
      </PermissionLoader>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "project-manager-dashboard",
        element: <ProjectManagerDashboard />,
      },
      {
        path: "super-admin-projects",
        element: <SuperAdminProjectsDashboard />,
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
        path: "planning",
        element: <PLaningProjects />,
      },
      {
        path: "milestone-tasks/:milestoneId",
        element: <MilestoneTasks />,
      },
      {
        path: "milestone-tasksC/:milestoneId",
        element: <MilestoneTaskss />,
      },
      {
        path: "project-milestone/:projectId",
        element: <ProjectMilestone />,
      },
      {
        path: "team",
        element: <Team />,
      },
      {
        path: "clients",
        element: <ClientsNew />,
      },
      {
        path: "suppliers",
        element: <SupplierList />,
      },
      {
        path: "suppliers/add",
        element: <AddSupplier />,
      },
      {
        path: "suppliers/edit/:id",
        element: <EditSupplier />,
      },
      {
        path: "suppliers/:id",
        element: <SupplierDetails />,
      },
      {
        path: "catalog",
        element: <Catalog />,
      },
      {
        path: "catalog/add",
        element: <AddCatalogItem />,
      },
      {
        path: "catalog/edit/:id",
        element: <EditCatalogItem />,
      },
      {
        path: "catalog/:id",
        element: <CatalogDetails />,
      },
      {
        path: "clients",
        element: <Clients />,
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
        path: "payments",
        element: <Payments />,
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
        path: "gantt",
        element: <GanttChart />,
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
        path: "admin/system-logs",
        element: <SystemLogs />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "resource-optimization",
        element: <ResourceOptimizationDashboard />,
      },
      {
        path: "resource-optimization/:siteId",
        element: <ResourceOptimizationDashboard />,
      },
    ],
  },
  {
    path: "/user-guide/:role",
    element: <UserGuide />,
  },
  {
    path: "/checkout-simulator",
    element: <CheckoutSimulator />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);