import { createBrowserRouter, Navigate } from "react-router";
import { lazy } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import { useAuthStore } from "./store/authStore";

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const ChangePasswordFirstLogin = lazy(() => import("./pages/auth/ChangePasswordFirstLogin"));
const Dashboard = lazy(() => import("./pages/dashboards/Dashboard"));
const ProjectManagerDashboard = lazy(() => import("./pages/dashboard/ProjectManagerDashboard"));
const SuperAdminProjectsDashboard = lazy(() => import("./pages/dashboard/SuperAdminProjectsDashboard"));
const Sites = lazy(() => import("./pages/sites/Sites"));
const SitesTable = lazy(() => import("./pages/sites/SitesTable"));
const Projects = lazy(() => import("./pages/projects/Projects"));
const Team = lazy(() => import("./pages/team/Team"));
const MyTeamMembers = lazy(() => import("./pages/team/MyTeamMembers"));
const Clients = lazy(() => import("./pages/clients/Clients"));
const Finance = lazy(() => import("./pages/finance/Finance"));
const Payments = lazy(() => import("./pages/payments/Payments"));
const QHSE = lazy(() => import("./pages/qhse/QHSE"));
const Incidents = lazy(() => import("./pages/incidents/Incidents"));
const Reports = lazy(() => import("./pages/reports/Reports"));
const Analytics = lazy(() => import("./pages/analytics/Analytics"));
const SiteMap = lazy(() => import("./pages/map/Map"));
const Notifications = lazy(() => import("./pages/notifications/Notifications"));
const UserManagement = lazy(() => import("./pages/users/UserManagement"));
const RolesPage = lazy(() => import("./pages/admin/RolesPage"));
const PermissionsPage = lazy(() => import("./pages/admin/PermissionsPage"));
const PendingUsers = lazy(() => import("./pages/admin/PendingUsers"));
const SystemLogs = lazy(() => import("./pages/admin/SystemLogs"));
const Profile = lazy(() => import("./pages/profile/Profile"));
const Home2 = lazy(() => import("./pages/Home/Home2"));
const Pricing = lazy(() => import("./pages/pricing/Pricing"));
const ClientsNew = lazy(() => import("./pages/clients/ClientsNew"));
const UserGuide = lazy(() => import("./pages/guide/UserGuide"));
const AnomaliesAlertsPage = lazy(() =>
  import("./pages/materials/MaterialsFeaturePages").then((module) => ({ default: module.AnomaliesAlertsPage })),
);
const AutoOrdersPage = lazy(() =>
  import("./pages/materials/MaterialsFeaturePages").then((module) => ({ default: module.AutoOrdersPage })),
);
const FlowLogPage = lazy(() =>
  import("./pages/materials/MaterialsFeaturePages").then((module) => ({ default: module.FlowLogPage })),
);
const FlowAnomalyAnalysisPage = lazy(() =>
  import("./pages/materials/MaterialsFeaturePages").then((module) => ({ default: module.FlowAnomalyAnalysisPage })),
);
const MLTrainingPage = lazy(() =>
  import("./pages/materials/MaterialsFeaturePages").then((module) => ({ default: module.MLTrainingPage })),
);
const OrderTrackingMapPage = lazy(() =>
  import("./pages/materials/MaterialsFeaturePages").then((module) => ({ default: module.OrderTrackingMapPage })),
);
const SiteConsumptionPage = lazy(() =>
  import("./pages/materials/MaterialsFeaturePages").then((module) => ({ default: module.SiteConsumptionPage })),
);
const StockPredictionsPage = lazy(() =>
  import("./pages/materials/MaterialsFeaturePages").then((module) => ({ default: module.StockPredictionsPage })),
);
const ExpiringMaterials = lazy(() => import("../components/ExpiringMaterials"));

const AddSupplierNew = lazy(() => import("./pages/suppliers-new/AddSupplier"));
const SuppliersListNew = lazy(() => import("./pages/suppliers-new/SuppliersList"));
const QhseSupplierValidation = lazy(() => import("./pages/suppliers-new/QhseSupplierValidation"));
const SupplierDetail = lazy(() => import("./pages/suppliers-new/SupplierDetail"));
const EditSupplier = lazy(() => import("./pages/suppliers-new/EditSupplier"));

const Catalog = lazy(() => import("./pages/catalog/Catalog"));
const CatalogList = lazy(() => import("./pages/catalog/CatalogList"));
const AddCatalogItem = lazy(() => import("./pages/catalog/AddCatalogItem"));
const EditCatalogItem = lazy(() => import("./pages/catalog/EditCatalogItem"));
const CatalogDetails = lazy(() => import("./pages/catalog/CatalogDetails"));
const CheckoutSimulator = lazy(() => import("./pages/CheckoutSimulator"));

const PLaningProjects = lazy(() => import("./pages/planning/PLaningProjects"));
const ProjectMilestone = lazy(() => import("./pages/planning/ProjectMilestone"));
const MyTask = lazy(() => import("./pages/planning/MyTask"));
const MilestoneTaskss = lazy(() => import("./pages/planning/MilestoneTaskss"));
const NotFound = lazy(() => import("./pages/Error/NotFound"));
const Forbidden = lazy(() => import("./pages/Error/Forbidden"));
const MyAffectedSite = lazy(() => import("./pages/planning/MyAffectedSite"));
const MySItes = lazy(() => import("./pages/planning/Mysites"));
const MyMilestones = lazy(() => import("./pages/planning/MyMilstone"));
const NotificationsPage = lazy(() => import("./pages/videoCall/NotificationsPage"));
const HomePage = lazy(() => import("./pages/videoCall/HomePage"));
const CallPage = lazy(() => import("./pages/videoCall/CallPage"));
const ChatPage = lazy(() => import("./pages/videoCall/ChatPage"));
const GroupChatPage = lazy(() => import("./pages/videoCall/GroupChatPage"));
const ResourceOptimizationDashboard = lazy(() => import("@/features/resource-optimization/pages/ResourceOptimizationDashboard"));
const AccountBanned = lazy(() => import("./pages/AccountBanned"));
const Materials = lazy(() => import("./pages/materials/Materials"));

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
        {/* <RoutePermissionGuard> */}
        <DashboardLayout />
        {/* </RoutePermissionGuard> */}
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
        path: "suppliers/qhse-validation",
        element: <QhseSupplierValidation />,
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
        path: "reset-password-first-login",
        element: <ChangePasswordFirstLogin />,
      },
      {
        path: "materials",
        element: <Materials />,
      },
      {
        path: "materials/expiring",
        element: <ExpiringMaterials />,
      },
      {
        path: "stock-predictions",
        element: <StockPredictionsPage />,
      },
      {
        path: "anomalies-alerts",
        element: <AnomaliesAlertsPage />,
      },
      {
        path: "auto-orders",
        element: <AutoOrdersPage />,
      },
      {
        path: "order-tracking-map",
        element: <OrderTrackingMapPage />,
      },
      {
        path: "site-consumption",
        element: <SiteConsumptionPage />,
      },
      {
        path: "flow-log",
        element: <FlowLogPage />,
      },
      {
        path: "flow-anomaly-analysis",
        element: <FlowAnomalyAnalysisPage />,
      },
      {
        path: "ml-training",
        element: <MLTrainingPage />,
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
        element: <SiteMap />,
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
