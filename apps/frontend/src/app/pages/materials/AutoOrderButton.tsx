import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ShoppingCart, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import intelligentOrderService, { AutoOrderRecommendation } from '../../../services/intelligentOrderService';
import orderService from '../../../services/orderService';

interface AutoOrderButtonProps {
  materialId: string;
  materialName: string;
  materialCode: string;
  siteId?: string;
  siteName?: string;
  siteCoordinates?: { lat: number; lng: number };
  onOrderCreated?: () => void;
  className?: string;
}

export default function AutoOrderButton({
  materialId,
  materialName,
  materialCode,
  siteId,
  onOrderCreated,
  className = '',
}: AutoOrderButtonProps) {
  const [recommendation, setRecommendation] = useState<AutoOrderRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    loadRecommendation();
  }, [materialId]);

  const loadRecommendation = async () => {
    setLoading(true);
    try {
      const rec = await intelligentOrderService.checkAutoOrder(materialId);
      setRecommendation(rec);
    } catch (error) {
      console.error('Error loading recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoOrder = async () => {
    if (!recommendation) return;
    if (!siteId) {
      toast.error('Site manquant pour creer la commande');
      return;
    }

    setOrdering(true);
    try {
      const suppliers = await intelligentOrderService.getSupplierSuggestions(materialId);
      if (suppliers.length === 0) {
        toast.error('Aucun fournisseur disponible pour ce materiau');
        return;
      }

      const selectedSupplier = suppliers.find(s => s.isPreferred) || suppliers[0];

      const orderData = {
        materialId,
        quantity: recommendation.recommendedQuantity,
        destinationSiteId: siteId,
        supplierId: selectedSupplier.supplierId,
        estimatedDurationMinutes: selectedSupplier.estimatedDeliveryDays * 24 * 60,
        notes: `Commande automatique - Rupture prevue dans ${recommendation.predictedHoursToOutOfStock}h`,
      };

      await orderService.createOrder(orderData);
      toast.success(`Commande creee! ${recommendation.recommendedQuantity} ${materialCode} commandes`, { duration: 5000 });
      onOrderCreated?.();
    } catch (error: any) {
      console.error('Error creating auto order:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la creation de la commande');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Analyse...
      </Button>
    );
  }

  if (!recommendation || !recommendation.autoSuggestOrder) {
    return null;
  }

  const getButtonVariant = () => {
    switch (recommendation.urgencyLevel) {
      case 'critical':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      default:
        return 'default' as const;
    }
  };

  const getButtonClass = () => {
    switch (recommendation.urgencyLevel) {
      case 'critical':
        return 'bg-red-600 hover:bg-red-700 text-white animate-pulse';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {recommendation.urgencyLevel === 'critical' && (
        <Badge variant="destructive" className="animate-pulse">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Rupture imminente!
        </Badge>
      )}
      {recommendation.urgencyLevel === 'warning' && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          {Math.floor(recommendation.predictedHoursToOutOfStock)}h restants
        </Badge>
      )}
      <Button
        size="sm"
        variant={getButtonVariant()}
        onClick={handleAutoOrder}
        disabled={ordering}
        className={`${getButtonClass()} ${className}`}
        title={`Commander ${recommendation.recommendedQuantity} unites (prediction: ${recommendation.predictedHoursToOutOfStock}h avant rupture)`}
      >
        {ordering ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4 mr-2" />
        )}
        Commander ({recommendation.recommendedQuantity})
      </Button>
    </div>
  );
}
