import { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost:3011/suppliers';

interface PredictionResult {
  supplierId: string;
  supplierName: string;
  averageRating: number;
  risk_percentage: number;
  risk_level: string;
  risk_color: string;
  recommendation: string;
  will_be_late: boolean;
}

interface DelayPredictionProps {
  supplierId: string | number;
}

export default function DelayPrediction({ supplierId }: DelayPredictionProps) {
  const currentMonth = new Date().getMonth() + 1;

  const [amount, setAmount] = useState(10000);
  const [days, setDays] = useState(5);
  const [month, setMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supplierId || supplierId === 'undefined') {
      setError('ID fournisseur invalide');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const url = `${API_URL}/${supplierId}/delay-prediction?amount=${amount}&days=${days}&month=${month}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch prediction');
      const data: PredictionResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      toast.error('Erreur lors de la prédiction');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (level: string) => {
    const normalized = level.toLowerCase();
    if (normalized === 'élevé' || normalized === 'high') return 'destructive';
    if (normalized === 'modéré' || normalized === 'moderate') return 'default';
    return 'secondary';
  };

  const getRiskLevelDisplay = (level: string) => {
    const normalized = level.toLowerCase();
    if (normalized === 'high' || normalized === 'élevé') return 'Élevé';
    if (normalized === 'moderate' || normalized === 'modéré') return 'Modéré';
    if (normalized === 'low' || normalized === 'faible') return 'Faible';
    return level;
  };

  const getRiskColor = (color: string) => {
    const colorMap = {
      'red': '#ef4444',
      'orange': '#f97316',
      'green': '#22c55e',
    };
    return colorMap[color.toLowerCase()] || color;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Analyse du risque de retard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="days">Délai prévu (jours)</Label>
                <Input
                  id="days"
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  min={1}
                  max={365}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Mois (1-12)</Label>
                <Input
                  id="month"
                  type="number"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  min={1}
                  max={12}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              Analyser le risque
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div
                className="text-6xl font-bold mb-2"
                style={{ color: getRiskColor(result.risk_color) }}
              >
                {result.risk_percentage}%
              </div>
              <Badge
                variant={getBadgeVariant(result.risk_level)}
                className="text-sm px-3 py-1"
              >
                {(result.risk_level.toLowerCase() === 'high' || result.risk_level === 'Élevé') && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                {(result.risk_level.toLowerCase() === 'low' || result.risk_level === 'Faible') && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                Risque {getRiskLevelDisplay(result.risk_level)}
              </Badge>
            </div>

            {result.recommendation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Recommandation :</strong> {result.recommendation}
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400">Fournisseur</p>
                <p className="font-medium">{result.supplierName}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400">Note moyenne</p>
                <p className="font-medium">{result.averageRating.toFixed(1)}/10</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
