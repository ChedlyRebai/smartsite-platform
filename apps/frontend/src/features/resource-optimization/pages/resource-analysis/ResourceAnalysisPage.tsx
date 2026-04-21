import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIdleEquipment, useEnergyAnalysis, useWorkerProductivity, useResourceCosts, useFullAnalysis } from '../../hooks/useResourceApi';
import { Zap, Briefcase, Users, DollarSign, BarChart3, ArrowLeft } from 'lucide-react';

interface ResourceAnalysisPageProps {
  siteId: string;
}

export const ResourceAnalysisPage: React.FC<ResourceAnalysisPageProps> = ({ siteId }) => {
  const navigate = useNavigate();
  const { data: idleEquipment, isLoading: idleLoading } = useIdleEquipment(siteId);
  const { data: energyAnalysis, isLoading: energyLoading } = useEnergyAnalysis(siteId);
  const { data: workerProductivity, isLoading: workerLoading } = useWorkerProductivity(siteId);
  const { data: resourceCosts, isLoading: costsLoading } = useResourceCosts(siteId);
  const { data: fullAnalysis, isLoading: fullLoading } = useFullAnalysis(siteId);

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
        <h1 className="text-3xl font-bold">🔍 Resource Analysis</h1>
        <p className="text-gray-600 mt-1">
          Analyze resource usage and detect inefficiencies
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="idle" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="energy" className="gap-2">
            <Zap className="h-4 w-4" />
            Energy
          </TabsTrigger>
          <TabsTrigger value="workers" className="gap-2">
            <Users className="h-4 w-4" />
            Workforce
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Costs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Analyse Complète</CardTitle>
            </CardHeader>
            <CardContent>
              {fullLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : fullAnalysis ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Idle Equipment</h4>
                    <p className="text-3xl font-bold">{fullAnalysis.idleEquipment.length}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Peak Consumption Periods</h4>
                    <p className="text-3xl font-bold">{fullAnalysis.peakConsumptionPeriods.length}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Worker Productivity</h4>
                    <p className="text-3xl font-bold">{fullAnalysis.workerProductivity.length}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Impact CO2</h4>
                    <p className="text-3xl font-bold">{fullAnalysis.environmentalImpact.totalCO2.toFixed(0)} kg</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available. Add data first.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="idle">
          <Card>
            <CardHeader>
              <CardTitle>Idle Equipment (&lt; 20% usage)</CardTitle>
            </CardHeader>
            <CardContent>
              {idleLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : idleEquipment && idleEquipment.length > 0 ? (
                <div className="space-y-2">
                  {idleEquipment.map((eq) => (
                    <div key={eq.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{eq.name}</p>
                        <p className="text-sm text-gray-600">{eq.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{eq.utilizationRate}%</p>
                        <p className="text-sm text-red-600">{eq.wastePercentage}% gaspillé</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun équipement inactif détecté
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="energy">
          <Card>
            <CardHeader>
              <CardTitle>Analyse de Consommation Énergétique</CardTitle>
            </CardHeader>
            <CardContent>
              {energyLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : energyAnalysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded">
                      <p className="text-sm text-gray-600">Consommation Moyenne Quotidienne</p>
                      <p className="text-2xl font-bold">{energyAnalysis.averageDailyConsumption.toFixed(0)} kWh</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded">
                      <p className="text-sm text-gray-600">Total CO2</p>
                      <p className="text-2xl font-bold">{energyAnalysis.totalCO2.toFixed(0)} kg</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Déchets Totaux</p>
                      <p className="text-2xl font-bold">{energyAnalysis.totalWaste.toFixed(0)} kg</p>
                    </div>
                  </div>
                  {energyAnalysis.peakPeriods.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Pics de Consommation</h4>
                      <div className="space-y-2">
                        {energyAnalysis.peakPeriods.map((peak: any, i: number) => (
                          <div key={i} className="flex justify-between p-2 border rounded">
                            <span>{peak.date}</span>
                            <span className="font-bold">{peak.electricity} kWh</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available
                </div>
              )}  
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers">
          <Card>
            <CardHeader>
              <CardTitle>Worker Productivity</CardTitle>
            </CardHeader>
            <CardContent>
              {workerLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : workerProductivity && workerProductivity.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Heures</th>
                        <th className="text-left p-3">Coût</th>
                        <th className="text-left p-3">Score</th>
                        <th className="text-left p-3">Efficacité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workerProductivity.map((worker) => (
                        <tr key={worker.id} className="border-b">
                          <td className="p-3">{worker.name}</td>
                          <td className="p-3">{worker.role}</td>
                          <td className="p-3">{worker.hoursWorked}h</td>
                          <td className="p-3">{worker.costIncurred}€</td>
                          <td className="p-3">{worker.productivityScore}%</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              worker.efficiency === 'high' ? 'bg-green-100 text-green-800' :
                              worker.efficiency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {worker.efficiency}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No workers found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Resource Costs</CardTitle>
            </CardHeader>
            <CardContent>
              {costsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : resourceCosts ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-gray-600">Equipment Cost</p>
                    <p className="text-2xl font-bold">{resourceCosts.equipment}€</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-gray-600">Worker Cost</p>
                    <p className="text-2xl font-bold">{resourceCosts.workers}€</p>
                  </div>
                  <div className="text-center p-4 border rounded bg-blue-50">
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold">{resourceCosts.total}€</p>
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

export default ResourceAnalysisPage;
