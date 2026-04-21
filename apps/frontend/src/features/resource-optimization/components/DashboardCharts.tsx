import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, Leaf, DollarSign, Target, Zap } from 'lucide-react';

interface DashboardStatsProps {
  dashboard: {
    financial: {
      realizedSavings: string;
      roi: string;
    };
    environmental: {
      actualCO2Reduction: string;
    };
    recommendations: {
      implemented: number;
    };
  } | null;
}

export const SummaryStats: React.FC<DashboardStatsProps> = ({ dashboard }) => {
  if (!dashboard) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-110 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">Realized Savings</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-700 mb-1">0 TND</div>
            <p className="text-xs text-emerald-600 font-medium">No savings yet</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-110 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">Recommendations Implemented</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
              <Target className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-700 mb-1">0</div>
            <p className="text-xs text-green-600 font-medium">Start implementing</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-110 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">Overall Effectiveness</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-700 mb-1">0%</div>
            <p className="text-xs text-blue-600 font-medium">Track your progress</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const realizedSavings = dashboard.financial?.realizedSavings && isFinite(Number(dashboard.financial.realizedSavings)) 
    ? Number(dashboard.financial.realizedSavings) 
    : 0;
  
  const implementedCount = dashboard.recommendations?.implemented || 0;
  
  const effectiveness = dashboard.financial?.roi && isFinite(Number(dashboard.financial.roi)) 
    ? Math.round(Number(dashboard.financial.roi) * 100) 
    : 0;

  const co2Reduction = dashboard.environmental?.actualCO2Reduction && isFinite(Number(dashboard.environmental.actualCO2Reduction))
    ? Number(dashboard.environmental.actualCO2Reduction)
    : 0;

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-110 transition-transform duration-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
          <CardTitle className="text-sm font-semibold text-gray-700">Realized Savings</CardTitle>
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-emerald-700 mb-1">
            {realizedSavings.toLocaleString()} TND
          </div>
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Cost reduction achieved
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-110 transition-transform duration-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
          <CardTitle className="text-sm font-semibold text-gray-700">Implemented</CardTitle>
          <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
            <Target className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-green-700 mb-1">{implementedCount}</div>
          <p className="text-xs text-green-600 font-medium">Recommendations applied</p>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-110 transition-transform duration-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
          <CardTitle className="text-sm font-semibold text-gray-700">Effectiveness</CardTitle>
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
            <Zap className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-blue-700 mb-1">{effectiveness}%</div>
          <p className="text-xs text-blue-600 font-medium">Overall ROI</p>
        </CardContent>
      </Card>

      <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 via-white to-teal-50/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-110 transition-transform duration-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
          <CardTitle className="text-sm font-semibold text-gray-700">CO2 Reduction</CardTitle>
          <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
            <Leaf className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-teal-700 mb-1">{co2Reduction.toFixed(0)} kg</div>
          <p className="text-xs text-teal-600 font-medium">Environmental impact</p>
        </CardContent>
      </Card>
    </div>
  );
};

interface SavingsChartProps {
  data: Array<{
    type?: string;
    name?: string;
    value?: number;
    [key: string]: any;
  }>;
}

export const SavingsChart: React.FC<SavingsChartProps> = ({ data }) => {
  // Ensure data is valid and filter out invalid values
  const validData = (data || []).map(item => ({
    ...item,
    value: isFinite(item.value) ? Number(item.value) : 0
  }));

  const colorMap: Record<string, string> = {
    'Budget & Materials': '#3b82f6',
    'Teams & Execution': '#f59e0b',
    'Planning & Deadlines': '#8b5cf6',
  };

  const descriptionMap: Record<string, string> = {
    'Budget & Materials': '💰 Savings on material costs and logistics',
    'Teams & Execution': '👥 Productivity gains and schedule optimization',
    'Planning & Deadlines': '📅 Deadline reduction and better planning',
  };

  return (
    <Card className="border-2 border-emerald-200 shadow-lg">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-lg">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">💰 Distribution of Gains (Site)</CardTitle>
            <CardDescription className="mt-2">
              📊 <strong>Estimation by category:</strong> Budget & Materials, Teams & Execution, Planning & Deadlines — in TND<br/>
              💡 <strong>Interpretation:</strong> The higher the bar, the greater the estimated economic gain for this area
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-auto space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-emerald-200/50 p-3 rounded-lg text-sm text-foreground/80">
          <p><strong>🎯 What does each category mean?</strong></p>
          <ul className="mt-2 space-y-1 text-xs ml-2">
            <li>• <strong>Budget & Materials:</strong> Reduction of purchase costs and waste</li>
            <li>• <strong>Teams:</strong> Increased productivity and HR optimization</li>
            <li>• <strong>Planning:</strong> Respect of deadlines and reduction of costly delays</li>
          </ul>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={validData} margin={{ top: 8, right: 8, left: 8, bottom: 60 }}>
              <defs>
                {Object.entries(colorMap).map(([key, color]) => (
                  <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9}/>
                    <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: any) => `${isFinite(value) ? Number(value).toLocaleString('fr-FR') : 0} TND`}
                labelStyle={{ fontWeight: 600, color: '#000' }}
                contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb' }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]}>
                {validData.map((item, index) => (
                  <Cell key={`cell-${index}`} fill={colorMap[item.name] || '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {validData.map((item, idx) => (
            <div key={idx} className="p-3 bg-gradient-to-br rounded-lg border" style={{
              backgroundColor: (colorMap[item.name] || '#10b981') + '10',
              borderColor: colorMap[item.name] || '#10b981'
            }}>
              <p className="font-semibold" style={{ color: colorMap[item.name] || '#10b981' }}>
                {item.name}
              </p>
              <p className="text-xs text-foreground/60">{descriptionMap[item.name] || ''}</p>
              <p className="mt-2 font-bold text-lg" style={{ color: colorMap[item.name] || '#10b981' }}>
                {Number(item.value || 0).toLocaleString('fr-FR')} TND
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface CO2ImpactChartProps {
  current: number;
  potential: number;
  realized: number;
}

export const CO2ImpactChart: React.FC<CO2ImpactChartProps> = ({
  current,
  potential,
  realized,
}) => {
  const data = [
    { name: 'Emissions (baseline)', value: isFinite(current) ? Number(current) : 0, color: '#ef4444' },
    { name: 'Potential Reduction', value: isFinite(potential) ? Number(potential) : 0, color: '#f59e0b' },
    { name: 'Realized Reduction', value: isFinite(realized) ? Number(realized) : 0, color: '#10b981' },
  ];

  const potentialReduction = current > 0 ? ((potential / current) * 100).toFixed(1) : 0;
  const realizedReduction = current > 0 ? ((realized / current) * 100).toFixed(1) : 0;

  return (
    <Card className="border-2 border-green-200 shadow-lg">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-lg">
            <Leaf className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">♥️ Environmental Indicators (CO₂)</CardTitle>
            <CardDescription className="mt-2">
              📊 <strong>CO₂ Emissions:</strong> Baseline (reference), Potential Reduction, Realized Reduction<br/>
              🌍 <strong>Units:</strong> Kilograms CO₂ (or per site report)<br/>
              ✅ <strong>Objective:</strong> Minimize emissions through implemented recommendations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-auto space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-xs text-red-900 font-semibold mb-1">🔴 Baseline</p>
            <p className="text-2xl font-bold text-red-700">{Number(current).toLocaleString('en-US')}</p>
            <p className="text-xs text-red-600 mt-1">Reference emissions</p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <p className="text-xs text-amber-900 font-semibold mb-1">🟡 Potential</p>
            <p className="text-2xl font-bold text-amber-700">{Number(potential).toLocaleString('en-US')}</p>
            <p className="text-xs text-amber-600 mt-1">-{potentialReduction}% possible</p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-xs text-green-900 font-semibold mb-1">🟢 Réalisée</p>
            <p className="text-2xl font-bold text-green-700">{Number(realized).toLocaleString('fr-FR')}</p>
            <p className="text-xs text-green-600 mt-1">-{realizedReduction}% atteint</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 p-3 rounded-lg text-sm text-foreground/80">
          <p><strong>💡 Comprendre les 3 courbes?</strong></p>
          <ul className="mt-2 space-y-1 text-xs ml-2">
            <li>• <strong>Émissions (réf.):</strong> Consommation énergétique et rejets actuels du chantier</li>
            <li>• <strong>Réduction potentielle:</strong> Réductions estimées si TOUTES les recommandations étaient implémentées</li>
            <li>• <strong>Réduction réalisée:</strong> Réductions CONFIRMÉES après implémentation et mesure sur site</li>
          </ul>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 60 }}>
              <defs>
                <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value) => `${Number(value).toLocaleString('fr-FR')} kg CO₂`}
                labelStyle={{ fontWeight: 600, color: '#000' }}
                contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="value" name="CO₂ (kg)" radius={[8, 8, 0, 0]}>
                {data.map((item, index) => {
                  const colors = ['url(#gradRed)', 'url(#gradAmber)', 'url(#gradGreen)'];
                  return <Cell key={`cell-${index}`} fill={colors[index]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
          <p className="font-semibold">📈 Analyse:</p>
          <p className="mt-1">
            {realized > 0 
              ? `Vous avez déjà réduit ${Number(realized).toLocaleString('fr-FR')} kg CO₂ (${realizedReduction}% de la baseline). Continuez à implémenter les recommandations pour atteindre le potentiel complet de ${Number(potential).toLocaleString('fr-FR')} kg!`
              : 'Approuvez et implémentez les recommandations pour voir les réductions de CO₂ en action!'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

interface RecommendationStatusChartProps {
  pending: number;
  approved: number;
  implemented: number;
}

export const RecommendationStatusChart: React.FC<
  RecommendationStatusChartProps
> = ({ pending, approved, implemented }) => {
  const data = [
    { name: 'En attente', value: pending },
    { name: 'Approuvées', value: approved },
    { name: 'Mises en place', value: implemented },
  ];

  const colors = ['#fbbf24', '#3b82f6', '#10b981'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statut des recommandations</CardTitle>
        <CardDescription>Répartition par statut</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
