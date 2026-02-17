import { useAuthStore } from '../../store/authStore';
import SuperAdminDashboard from './SuperAdminDashboard';
import DirectorDashboard from './DirectorDashboard';
import ProjectManagerDashboard from './ProjectManagerDashboard';
import SiteManagerDashboard from './SiteManagerDashboard';
import WorksManagerDashboard from './WorksManagerDashboard';
import AccountantDashboard from './AccountantDashboard';
import ProcurementDashboard from './ProcurementDashboard';
import QHSEDashboard from './QHSEDashboard';
import ClientDashboard from './ClientDashboard';
import SubcontractorDashboard from './SubcontractorDashboard';
import UserDashboard from './UserDashboard';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  // Route to appropriate dashboard based on role
  switch (user.role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'director':
      return <DirectorDashboard />;
    case 'project_manager':
      return <ProjectManagerDashboard />;
    case 'site_manager':
      return <SiteManagerDashboard />;
    case 'works_manager':
      return <WorksManagerDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'procurement_manager':
      return <ProcurementDashboard />;
    case 'qhse_manager':
      return <QHSEDashboard />;
    case 'client':
      return <ClientDashboard />;
    case 'subcontractor':
      return <SubcontractorDashboard />;
    case 'user':
      return <UserDashboard />;
    default:
      return <UserDashboard />;
  }
}
