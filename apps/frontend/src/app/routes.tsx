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
import SitesTable from "./pages/sites/SitesTable";
import Projects from "./pages/projects/Projects";
import Planning from "./pages/planning/MyTask";
import Team from "./pages/team/Team";
import MyTeamMembers from "./pages/team/MyTeamMembers";
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
import RolesPage from "./pages/admin/RolesPage";
import PermissionsPage from "./pages/admin/PermissionsPage";
import PendingUsers from "./pages/admin/PendingUsers";
import SystemLogs from "./pages/admin/SystemLogs";
import Profile from "./pages/profile/Profile";
import Home2 from "./pages/Home/Home2";
import Pricing from "./pages/pricing/Pricing";
import ClientsNew from "./pages/clients/ClientsNew";
import UserGuide from "./pages/guide/UserGuide";

import AddSupplierNew from "./pages/suppliers-new/AddSupplier";
import SuppliersListNew from "./pages/suppliers-new/SuppliersList";
import QhseSupplierValidation from "./pages/suppliers-new/QhseSupplierValidation";
import SupplierDetail from "./pages/suppliers-new/SupplierDetail";
import EditSupplier from "./pages/suppliers-new/EditSupplier";

import Catalog from "./pages/catalog/Catalog";
import CatalogList from "./pages/catalog/CatalogList";
import AddCatalogItem from "./pages/catalog/AddCatalogItem";
import EditCatalogItem from "./pages/catalog/EditCatalogItem";
import CatalogDetails from "./pages/catalog/CatalogDetails";
import CheckoutSimulator from "./pages/CheckoutSimulator";

import PLaningProjects from "./pages/planning/PLaningProjects";
import ProjectMilestone from "./pages/planning/ProjectMilestone";
import MyTask from "./pages/planning/MyTask";
import MilestoneTaskss from "./pages/planning/MilestoneTaskss";
import NotFound from "./pages/Error/NotFound";
import Forbidden from "./pages/Error/Forbidden";
import MyAffectedSite from "./pages/planning/MyAffectedSite";
import MySItes from "./pages/planning/Mysites";
import MyMilestones from "./pages/planning/MyMilstone";
import NotificationsPage from "./pages/videoCall/NotificationsPage";
import HomePage from "./pages/videoCall/HomePage";
import CallPage from "./pages/videoCall/CallPage";
import ChatPage from "./pages/videoCall/ChatPage";
import GroupChatPage from "./pages/videoCall/GroupChatPage";
import ResourceOptimizationDashboard from "@/features/resource-optimization/pages/ResourceOptimizationDashboard";
import AccountBanned from "./pages/AccountBanned";
import { useAuthStore } from "./store/authStore";
import RoutePermissionGuard from "./components/shared/RoutePermissionGuard";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
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
    path: "/banned",
    element: <AccountBanned />,
  },
  {
    path: "/change-password-first-login",
    element: <ChangePasswordFirstLogin />,
  },
  {
    path: "/forbidden",
    element: <Forbidden />,
  },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RoutePermissionGuard>
          <DashboardLayout />
        </RoutePermissionGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "/home",
        element: <HomePage />,
      },
      {
        path: "/notifcall",
        element: <NotificationsPage />,
      },
      {
        path: "/call/:id",
        element: <CallPage />,
      },
      {
        path: "/chat/:id",
        element: <ChatPage />,
      },
      {
        path: "/group-chat",
        element: <GroupChatPage />,
      },
      {
        path: "/group-chat/:groupId",
        element: <GroupChatPage />,
      },
      {
        path: "project-manager-dashboard",
        element: <ProjectManagerDashboard />,
      },
      {
        path: "my-mil/:projectId",
        element: <MyMilestones />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "my-sites",
        element: <MySItes />,
      },
      {
        path: "super-admin-projects",
        element: <SuperAdminProjectsDashboard />,
      },
      {
        path: "sites",
        element: <SitesTable />,
      },
      {
        path: "sites-detail",
        element: <Sites />,
      },
      {
        path: "my-affected-sites",
        element: <MyAffectedSite />,
      },
      {
        path: "my-task/:milestoneId",
        element: <MyTask />,
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
        path: "projects/:projectId/sites",
        element: <Sites />,
      },
      {
        path: "planning",
        element: <PLaningProjects />,
      },
      // {
      //   path: "milestone-tasksprev/:milestoneId",
      //   element: <MilestoneTasks />,
      // },
      {
        path: "milestone-tasks/:milestoneId",
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
        path: "my-team-members",
        element: <MyTeamMembers />,
      },
      {
        path: "clients",
        element: <ClientsNew />,
      },
      {
        path: "suppliers",
        element: <SuppliersListNew />,
      },
      {
        path: "suppliers/add",
        element: <AddSupplierNew />,
      },
      {
        path: "suppliers/:id",
        element: <SupplierDetail />,
      },
      {
        path: "suppliers/:id/edit",
        element: <EditSupplier />,
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
        path:"reset-password-first-login",
        element:<ChangePasswordFirstLogin />
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
      // {
      //   path: "gantt/:milestoneId",
      //   element: <GanttChart />,
      // },
      {
        path: "users",
        element: <UserManagement />,
      },
      {
        path: "roles",
        element: <RolesPage />,
      },
      {
        path: "permissions",
        element: <PermissionsPage />,
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
      {
        path: "power-bi/:siteId",
        element: <ResourceOptimizationDashboard />,
      },
    ],
  },
  {
    path: "/account-banned",
    element: <AccountBanned />,
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
