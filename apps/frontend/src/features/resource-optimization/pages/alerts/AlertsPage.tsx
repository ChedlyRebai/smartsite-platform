import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlerts, useUnreadAlerts, useCriticalAlerts, useAlertsSummary, useGenerateAlerts, useMarkAlertAsRead, useMarkAlertAsResolved } from '../../hooks/useResourceApi';
import { AlertsList } from '../../components/AlertsList';
import { RefreshCw, AlertTriangle, Bell, CheckCircle, ArrowLeft } from 'lucide-react';

interface AlertsPageProps {
  siteId: string;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ siteId }) => {
  const navigate = useNavigate();
  const { data: allAlerts, isLoading, refetch } = useAlerts(siteId);
  const { data: unreadAlerts } = useUnreadAlerts(siteId);
  const { data: criticalAlerts } = useCriticalAlerts(siteId);
  const { data: summary } = useAlertsSummary(siteId);
  const generateAlerts = useGenerateAlerts(siteId);
  const markAsRead = useMarkAlertAsRead();
  const markAsResolved = useMarkAlertAsResolved();

  const handleGenerate = async () => {
    await generateAlerts.mutateAsync();
    refetch();
  };

  return (
    <div className="space-y-6 p-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/resource-optimization/${siteId}`)} 
        className="mb-4 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🚨 Alerts</h1>
          <p className="text-gray-600 mt-1">
            Real-time alert system for your site
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generateAlerts.isPending} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${generateAlerts.isPending ? 'animate-spin' : ''}`} />
          Generate Alerts
        </Button>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Critical</p>
                  <p className="text-2xl font-bold">{summary.critical}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">High</p>
                  <p className="text-2xl font-bold">{summary.high}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Unread</p>
                  <p className="text-2xl font-bold">{summary.unread}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Alerts ({allAlerts?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertsList 
            alerts={allAlerts || []} 
            loading={isLoading}
            onMarkAsRead={(id) => markAsRead.mutate(id)}
            onMarkAsResolved={(id) => markAsResolved.mutate(id)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPage;
