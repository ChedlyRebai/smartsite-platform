import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboard, usePerformanceReport, useEnvironmentalReport, useFinancialReport } from '../../hooks/useResourceApi';
import { BarChart3, TrendingUp, Leaf, DollarSign, ArrowLeft } from 'lucide-react';

interface ReportingPageProps {
  siteId: string;
}

export const ReportingPage: React.FC<ReportingPageProps> = ({ siteId }) => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading: dashboardLoading } = useDashboard(siteId);
  const { data: performance, isLoading: perfLoading } = usePerformanceReport(siteId);
  const { data: environmental, isLoading: envLoading } = useEnvironmentalReport(siteId);
  const { data: financial, isLoading: finLoading } = useFinancialReport(siteId);

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
      
      <div>
        <h1 className="text-3xl font-bold">📈 Reports</h1>
        <p className="text-gray-600 mt-1">
          Dashboards and analytical reports
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="environmental" className="gap-2">
            <Leaf className="h-4 w-4" />
            Environment
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle>Complete Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : dashboard ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Performance</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Savings</p>
                        <p className="text-xl font-bold">{dashboard.performance?.totalSavings}€</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">CO2 Reduced</p>
                        <p className="text-xl font-bold">{dashboard.performance?.co2Reduction} kg</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Implemented</p>
                        <p className="text-xl font-bold">{dashboard.performance?.implementedRecommendations}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Recommendations</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-xl font-bold">{dashboard.recommendations?.pending}</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Approved</p>
                        <p className="text-xl font-bold">{dashboard.recommendations?.approved}</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Implemented</p>
                        <p className="text-xl font-bold">{dashboard.recommendations?.implemented}</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-xl font-bold">{dashboard.recommendations?.total}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Report</CardTitle>
            </CardHeader>
            <CardContent>
              {perfLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : performance ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-gray-600">Total Savings</p>
                    <p className="text-3xl font-bold">{performance.totalSavings}€</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-gray-600">CO2 Reduction</p>
                    <p className="text-3xl font-bold">{performance.co2Reduction} kg</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-gray-600\">Implemented Recommendations</p>
                    <p className=\"text-3xl font-bold\">{performance.implementedRecommendations}</p>
                  </div>
                </div>
              ) : (
                <div className=\"text-center py-8 text-gray-500\">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"environmental\">
          <Card>
            <CardHeader>
              <CardTitle>Environmental Impact</CardTitle>
            </CardHeader>
            <CardContent>
              {envLoading ? (
                <div className=\"text-center py-8\">Loading...</div>
              ) : environmental ? (
                <div className=\"space-y-4\">
                  <div className=\"grid gap-4 md:grid-cols-3\">
                    <div className=\"text-center p-4 border rounded\">
                      <p className=\"text-sm text-gray-600\">Current CO2 Emissions</p>
                      <p className=\"text-3xl font-bold\">{environmental.totalCO2Emissions} kg</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-gray-600">Actual Reduction</p>
                      <p className="text-3xl font-bold">{environmental.actualCO2Reduction} kg</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-gray-600">Percentage</p>
                      <p className="text-3xl font-bold">{environmental.reductionPercentage}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {finLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : financial ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-gray-600">Current Costs</p>
                      <p className="text-3xl font-bold">{financial.currentResourcesCosts}€</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-gray-600">Realized Savings</p>
                      <p className="text-3xl font-bold">{financial.realizedSavings}€</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-gray-600">Potential Savings</p>
                      <p className="text-3xl font-bold">{financial.potentialSavings}€</p>
                    </div>
                    <div className="text-center p-4 border rounded bg-green-50">
                      <p className="text-sm text-gray-600">ROI</p>
                      <p className="text-3xl font-bold">{financial.roi}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportingPage;
