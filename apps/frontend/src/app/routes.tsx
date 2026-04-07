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
import MyTeamMembers from "./pages/team/MyTeamMembers";
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
import SystemLogs from "./pages/admin/SystemLogs";
import Profile from "./pages/profile/Profile";
import Home2 from "./pages/Home/Home2";
import Pricing from "./pages/pricing/Pricing";
import ClientsNew from "./pages/clients/ClientsNew";
import UserGuide from "./pages/guide/UserGuide";

import PLaningProjects from "./pages/planning/PLaningProjects";
import ProjectMilestone from "./pages/planning/ProjectMilestone";
import MyTask from "./pages/planning/MyTask";
import GanttChart from "./pages/planning/GanttManage";
import MilestoneTaskss from "./pages/planning/MilestoneTaskss";
import NotFound from "./pages/Error/NotFound";
import { PermissionLoader } from "./components/shared/PermissionLoader";
import MyAffectedSite from "./pages/planning/MyAffectedSite";
import MySItes from "./pages/planning/Mysites";
import MyMilestones from "./pages/planning/MyMilstone";
import NotificationsPage from "./pages/videoCall/NotificationsPage";
import HomePage from "./pages/videoCall/HomePage";
import CallPage from "./pages/videoCall/CallPage";
import ChatPage from "./pages/videoCall/ChatPage";
import GroupChatPage from "./pages/videoCall/GroupChatPage";

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
    element: <DashboardLayout />,
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
        path: "gantt/:milestoneId",
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
    ],
  },
  {
    path: "/user-guide/:role",
    element: <UserGuide />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
