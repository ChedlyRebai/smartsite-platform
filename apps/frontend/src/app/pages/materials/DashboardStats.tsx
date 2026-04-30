import { Card, CardContent } from '../../../components/ui/card';
import { Package, AlertTriangle, TrendingDown, Truck, Brain, Building2 } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalMaterials: number;
    totalQuantity: number;
    lowStock: number;
    outOfStock: number;
    categoriesCount: number;
    activeOrders: number;
    sitesCount: number;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Matériaux',
      value: stats.totalMaterials,
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      title: 'Quantité totale',
      value: stats.totalQuantity.toLocaleString(),
      icon: Building2,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      title: 'Stock bas',
      value: stats.lowStock,
      icon: TrendingDown,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
      alert: stats.lowStock > 0,
    },
    {
      title: 'Rupture',
      value: stats.outOfStock,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50',
      alert: stats.outOfStock > 0,
    },
    {
      title: 'Commandes actives',
      value: stats.activeOrders,
      icon: Truck,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      title: 'Catégories',
      value: stats.categoriesCount,
      icon: Brain,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((card, index) => (
        <Card key={index} className={`${card.alert ? 'ring-2 ring-red-400' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}