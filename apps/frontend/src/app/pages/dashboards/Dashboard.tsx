import { useAuthStore } from '../../store/authStore';
import { AssignedIncidentFlash } from '../../components/AssignedIncidentFlash';
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
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Sparkles } from 'lucide-react';
import ProfessionalPowerBiDashboard from '../../components/ProfessionalPowerBiDashboard';
import PowerBiAdvancedDashboard from '../../components/PowerBiAdvancedDashboard';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [dashboardView, setDashboardView] = useState<'professional' | 'advanced'>('professional');

  if (!user) return null;

  // Get role name - handle both string and object formats
  const roleName = typeof user.role === 'string' ? user.role : user.role?.name || 'user';
  const isSuperAdmin = roleName === 'super_admin';

  // For super_admin: Show integrated Power BI dashboard as default (replaces old dashboard)
  if (isSuperAdmin) {
    // Show professional dashboard (preferred template) as default
    if (dashboardView === 'professional') {
      return (
        <>
          {user?.cin && <AssignedIncidentFlash userCin={user.cin} />}
          <div className="fixed top-4 right-4 z-50 flex gap-2 flex-wrap">
            <Button
              onClick={() => setDashboardView('advanced')}
              size="sm"
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="h-4 w-4" />
              Analytics
            </Button>
          </div>
          <ProfessionalPowerBiDashboard />
        </>
      );
    }

    // Show advanced dashboard if selected
    if (dashboardView === 'advanced') {
      return (
        <>
          {user?.cin && <AssignedIncidentFlash userCin={user.cin} />}
          <div className="fixed top-4 right-4 z-50 flex gap-2 flex-wrap">
            <Button
              onClick={() => setDashboardView('professional')}
              variant="outline"
              size="sm"
            >
              ← Back to Main
            </Button>
          </div>
          <PowerBiAdvancedDashboard />
        </>
      );
    }

    // Default: Integrated dashboard (main view)
    return (
      <>
        {user?.cin && <AssignedIncidentFlash userCin={user.cin} />}
        <div className="fixed top-4 right-4 z-50 flex gap-2 flex-wrap">
          <Button
            onClick={() => setDashboardView('advanced')}
            size="sm"
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="h-4 w-4" />
            Analytics
          </Button>
        </div>
        <ProfessionalPowerBiDashboard />
      </>
    );
  }

  // Route to appropriate dashboard based on role
  const renderDashboard = () => {
    switch (roleName) {
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
  };

  return (
    <>
      {/* Flash Notification for Assigned Incidents - All Users */}
      {user?.cin && <AssignedIncidentFlash userCin={user.cin} />}
      {renderDashboard()}
    </>
  );
}