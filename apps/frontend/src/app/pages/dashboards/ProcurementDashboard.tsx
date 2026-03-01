import { Package, TrendingUp, Truck, AlertCircle } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { mockSuppliers } from '../../utils/mockData';
import { useAuthStore } from '../../store/authStore';

export default function ProcurementDashboard() {
  const user = useAuthStore((state) => state.user);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Procurement Dashboard</h1>
        <p className="text-gray-500 mt-1">Supply chain and materials management - {user?.firstName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Suppliers" value={mockSuppliers.length} icon={Truck} subtitle="Currently engaged" />
        <StatCard title="Materials in Stock" value="12,500" icon={Package} trend={{ value: 8, isPositive: true }} />
        <StatCard title="Pending Orders" value={5} icon={AlertCircle} subtitle="Awaiting delivery" />
        <StatCard title="Avg Delivery Time" value="3.5 days" icon={TrendingUp} trend={{ value: 12, isPositive: true }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockSuppliers.map((supplier) => (
              <div key={supplier.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{supplier.category}</p>
                  </div>
                  <Badge variant="secondary">Rating: {supplier.rating}/5</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Stock Quantity</p>
                    <p className="font-semibold text-gray-900">{supplier.stockQuantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Received</p>
                    <p className="font-semibold text-gray-900">{supplier.receivedQuantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Used</p>
                    <p className="font-semibold text-gray-900">{supplier.usedQuantity.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Utilization</span>
                    <span className="font-semibold">{Math.round((supplier.usedQuantity / supplier.receivedQuantity) * 100)}%</span>
                  </div>
                  <Progress value={(supplier.usedQuantity / supplier.receivedQuantity) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
