import { useState } from 'react';
//import { CardContent } from 'components/ui/card';
import { CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface StockChartProps {
  materials: any[];
}

export default function StockChart({ materials }: StockChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Données pour le bar chart
  const barData = materials.slice(0, 10).map(m => ({
    name: m.name?.length > 12 ? m.name.substring(0, 12) + '...' : m.name || 'Unknown',
    stock: m.quantity || 0,
    min: m.minimumStock || 0,
    max: m.maximumStock || 0,
    unit: m.unit || '',
  }));

  // Données pour le line chart (tendances simulées)
  const generateTrendData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dataPoint: any = {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      };
      
      materials.slice(0, 5).forEach((material) => {
        const baseValue = material.quantity / 7;
        const variation = Math.random() * baseValue * 0.3;
        dataPoint[material.name] = Math.max(0, (material.quantity / 7) * (i + 1) + variation);
      });
      
      data.push(dataPoint);
    }
    
    return data;
  };

  const lineData = generateTrendData();
  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium">
                {entry.value?.toFixed(1)} {entry.dataPayload?.unit}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (materials.length === 0) {
    return (
      <CardContent>
        <div className="h-80 flex items-center justify-center flex-col text-gray-500">
          <p className="text-lg">No data available</p>
          <p className="text-sm">Add materials to see the chart</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent>
      {/* Chart type selector */}
      <div className="flex gap-2 mb-4">
        <Button
          size="sm"
          variant={chartType === 'bar' ? 'default' : 'outline'}
          onClick={() => setChartType('bar')}
        >
          Bar Chart
        </Button>
        <Button
          size="sm"
          variant={chartType === 'line' ? 'default' : 'outline'}
          onClick={() => setChartType('line')}
        >
          Line Chart
        </Button>
      </div>

      {/* Bar Chart */}
      {chartType === 'bar' && (
        <>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={barData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  interval={0}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="stock" fill="#3b82f6" name="Current Stock" radius={[4, 4, 0, 0]} />
                <Bar dataKey="min" fill="#f59e0b" name="Min Stock" radius={[4, 4, 0, 0]} />
                <Bar dataKey="max" fill="#10b981" name="Max Stock" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            Showing top 10 materials by quantity
          </p>
        </>
      )}

      {/* Line Chart */}
      {chartType === 'line' && (
        <>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={lineData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <Tooltip />
                <Legend />
                {materials.slice(0, 5).map((material, index) => (
                  <Line
                    key={material._id}
                    type="monotone"
                    dataKey={material.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            Showing trend for top 5 materials (last 7 days)
          </p>
        </>
      )}
    </CardContent>
  );
}