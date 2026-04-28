import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Building2, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import materialService from '../../../services/materialService';

interface SiteConsumption {
  siteId: string;
  siteName: string;
  consumption: number;
  materialCount: number;
  topMaterial: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec489a'];

export default function ConsumptionBySite() {
  const [data, setData] = useState<SiteConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'chart' | 'list'>('chart');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Récupérer les matériaux avec leurs sites
      const materials = await materialService.getMaterialsWithSites();
      
      // Grouper par site
      const siteMap = new Map<string, SiteConsumption>();
      
      materials.forEach((material: any) => {
        const siteId = material.siteId || 'unknown';
        const siteName = material.siteName || 'Non assigné';
        const consumption = material.consumptionRate || 1;
        
        if (!siteMap.has(siteId)) {
          siteMap.set(siteId, {
            siteId,
            siteName,
            consumption: 0,
            materialCount: 0,
            topMaterial: '',
          });
        }
        
        const site = siteMap.get(siteId)!;
        site.consumption += consumption;
        site.materialCount++;
        
        // Trouver le matériau avec la plus haute consommation
        if (!site.topMaterial || consumption > 0) {
          site.topMaterial = material.name;
        }
      });
      
      setData(Array.from(siteMap.values()).sort((a, b) => b.consumption - a.consumption));
    } catch (error) {
      console.error('Error loading consumption data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Consommation par site
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => setView('chart')}
            className={`px-3 py-1 text-sm rounded ${view === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Graphique
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 text-sm rounded ${view === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Liste
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {view === 'chart' ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="consumption"
                  nameKey="siteName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ siteName, consumption }) => `${siteName}: ${consumption.toFixed(1)}`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((site) => (
              <div key={site.siteId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{site.siteName}</p>
                  <p className="text-sm text-gray-500">
                    {site.materialCount} matériaux | Top: {site.topMaterial}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{site.consumption.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">unités/h</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}