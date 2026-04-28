import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import {
  Truck,
  MapPin,
  Building,
  Package,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Filter,
  Eye,
  BarChart3,
} from 'lucide-react';
import { orderService, GlobalTrackingResponse, OrderTrackingOverview, Site, Supplier, GlobalTrackingStats } from '../../services/orderService';

// Types
interface GlobalTrackingStats {
  totalOrders: number;
  pendingOrders: number;
  inTransitOrders: number;
  deliveredToday: number;
  delayedOrders: number;
  activeTrucks: number;
  totalDistance: number;
  averageDeliveryTime: number;
}

interface OrderTrackingOverview {
  orderId: string;
  orderNumber: string;
  materialName: string;
  materialCode: string;
  quantity: number;
  status: string;
  progress: number;
  currentPosition: { lat: number; lng: number };
  startLocation: { lat: number; lng: number; name: string };
  endLocation: { lat: number; lng: number; name: string };
  supplierName: string;
  siteName: string;
  remainingTimeMinutes: number;
  eta: Date;
  route: {
    distance: number;
    duration: number;
    polyline: string;
  };
  createdAt: Date;
  actualDeparture?: Date;
  estimatedArrival?: Date;
}

interface Site {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  activeOrders: number;
}

interface Supplier {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  activeOrders: number;
}

interface GlobalTrackingResponse {
  stats: GlobalTrackingStats;
  orders: OrderTrackingOverview[];
  sites: Site[];
  suppliers: Supplier[];
}

// Icônes personnalisées
const truckIcon = L.icon({
  iconUrl: '/truck.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const siteIcon = L.icon({
  iconUrl: '/construction-site.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const supplierIcon = L.icon({
  iconUrl: '/warehouse.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Composant pour ajuster la vue de la carte
function FitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, bounds]);
  
  return null;
}

// Composant principal
export default function OrdersTrackingDashboard() {
  const [trackingData, setTrackingData] = useState<GlobalTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderTrackingOverview | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    siteId: '',
    supplierId: '',
  });
  const [activeTab, setActiveTab] = useState('map');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les données de suivi
  const loadTrackingData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des données de suivi...');
      const data = await orderService.getGlobalOrdersTracking(filters);
      console.log('✅ Données reçues:', data);
      setTrackingData(data);
    } catch (error: any) {
      console.error('❌ Erreur chargement données de suivi:', error);
      toast.error(`Erreur lors du chargement des données: ${error.message || 'Erreur inconnue'}`);
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData();
    
    // Actualiser toutes les 15 secondes
    intervalRef.current = setInterval(() => {
      loadTrackingData();
    }, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [filters]);

  // Calculer les bounds de la carte
  const calculateMapBounds = (): L.LatLngBounds | null => {
    if (!trackingData) return null;
    
    const points: [number, number][] = [];
    
    // Ajouter les positions des camions
    trackingData.orders.forEach(order => {
      if (order.currentPosition) {
        points.push([order.currentPosition.lat, order.currentPosition.lng]);
      }
    });
    
    // Ajouter les sites
    trackingData.sites.forEach(site => {
      points.push([site.coordinates.lat, site.coordinates.lng]);
    });
    
    // Ajouter les fournisseurs
    trackingData.suppliers.forEach(supplier => {
      points.push([supplier.coordinates.lat, supplier.coordinates.lng]);
    });
    
    if (points.length === 0) return null;
    
    return L.latLngBounds(points);
  };

  // Formater le temps
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.ceil(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.ceil(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  // Formater la distance
  const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_transit': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      case 'delayed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_transit': return 'En transit';
      case 'delivered': return 'Livré';
      case 'delayed': return 'Retardé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  if (loading && !trackingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune donnée de suivi disponible</p>
          <Button
            onClick={loadTrackingData}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const mapBounds = calculateMapBounds();

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Tableau de bord des livraisons
          </h2>
          <p className="text-gray-500">Suivi en temps réel de toutes les commandes</p>
        </div>
        <Button
          onClick={loadTrackingData}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques globales */}
      {trackingData && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{trackingData.stats.totalOrders}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{trackingData.stats.pendingOrders}</p>
                  <p className="text-xs text-gray-500">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{trackingData.stats.activeTrucks}</p>
                  <p className="text-xs text-gray-500">En transit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{trackingData.stats.deliveredToday}</p>
                  <p className="text-xs text-gray-500">Livrés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{trackingData.stats.delayedOrders}</p>
                  <p className="text-xs text-gray-500">Retardés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{formatDistance(trackingData.stats.totalDistance)}</p>
                  <p className="text-xs text-gray-500">Distance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <div>
                  <p className="text-2xl font-bold">{formatTime(trackingData.stats.averageDeliveryTime)}</p>
                  <p className="text-xs text-gray-500">Temps moy.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{trackingData.sites.length}</p>
                  <p className="text-xs text-gray-500">Sites actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenu principal avec onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">
            <MapPin className="h-4 w-4 mr-2" />
            Carte globale
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Package className="h-4 w-4 mr-2" />
            Liste des commandes
          </TabsTrigger>
          <TabsTrigger value="sites">
            <Building className="h-4 w-4 mr-2" />
            Sites & Fournisseurs
          </TabsTrigger>
        </TabsList>

        {/* Onglet Carte */}
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Vue d'ensemble des livraisons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] rounded-lg overflow-hidden">
                {trackingData && (
                  <MapContainer
                    center={[36.8065, 10.1815]} // Tunisie par défaut
                    zoom={8}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />

                    {/* Sites */}
                    {trackingData.sites.map(site => (
                      <Marker
                        key={`site-${site.id}`}
                        position={[site.coordinates.lat, site.coordinates.lng]}
                        icon={siteIcon}
                      >
                        <Popup>
                          <div className="text-center">
                            <strong>🏗️ {site.name}</strong>
                            <br />
                            <Badge variant="outline" className="mt-1">
                              {site.activeOrders} commande(s) active(s)
                            </Badge>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Fournisseurs */}
                    {trackingData.suppliers.map(supplier => (
                      <Marker
                        key={`supplier-${supplier.id}`}
                        position={[supplier.coordinates.lat, supplier.coordinates.lng]}
                        icon={supplierIcon}
                      >
                        <Popup>
                          <div className="text-center">
                            <strong>🏭 {supplier.name}</strong>
                            <br />
                            <Badge variant="outline" className="mt-1">
                              {supplier.activeOrders} commande(s) active(s)
                            </Badge>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Camions en mouvement */}
                    {trackingData.orders
                      .filter(order => order.status === 'in_transit')
                      .map(order => (
                        <Marker
                          key={`truck-${order.orderId}`}
                          position={[order.currentPosition.lat, order.currentPosition.lng]}
                          icon={truckIcon}
                        >
                          <Popup>
                            <div className="text-center min-w-[200px]">
                              <strong>🚚 {order.orderNumber}</strong>
                              <br />
                              <p className="text-sm">{order.materialName}</p>
                              <p className="text-xs text-gray-500">
                                {order.supplierName} → {order.siteName}
                              </p>
                              <div className="mt-2">
                                <Progress value={order.progress} className="h-2" />
                                <p className="text-xs mt-1">{Math.round(order.progress)}% - {formatTime(order.remainingTimeMinutes)} restant</p>
                              </div>
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Détails
                              </Button>
                            </div>
                          </Popup>
                        </Marker>
                      ))}

                    {mapBounds && <FitBounds bounds={mapBounds} />}
                  </MapContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Liste des commandes */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Toutes les commandes ({trackingData?.orders.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {trackingData?.orders.map(order => (
                    <div
                      key={order.orderId}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{order.orderNumber}</h3>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            📦 {order.materialName} (x{order.quantity})
                          </p>
                          <p className="text-sm text-gray-500">
                            🏭 {order.supplierName} → 🏗️ {order.siteName}
                          </p>
                          {order.status === 'in_transit' && (
                            <div className="mt-2">
                              <Progress value={order.progress} className="h-2" />
                              <p className="text-xs text-gray-500 mt-1">
                                {Math.round(order.progress)}% - ETA: {new Date(order.eta).toLocaleTimeString()}
                              </p>
                            </div>
                          )}
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              className="mt-2 bg-green-600 hover:bg-green-700"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await orderService.startOrderDelivery(order.orderId);
                                  toast.success(`🚚 Livraison démarrée pour ${order.orderNumber}`);
                                  loadTrackingData();
                                } catch (error: any) {
                                  toast.error(`Erreur: ${error.message}`);
                                }
                              }}
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              Démarrer Trajet
                            </Button>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                          {order.status === 'in_transit' && (
                            <p className="text-blue-600 font-medium">
                              {formatTime(order.remainingTimeMinutes)} restant
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Sites & Fournisseurs */}
        <TabsContent value="sites" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sites */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Sites actifs ({trackingData?.sites.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {trackingData?.sites.map(site => (
                      <div key={site.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{site.name}</h4>
                            <p className="text-sm text-gray-500">
                              📍 {site.coordinates.lat.toFixed(4)}, {site.coordinates.lng.toFixed(4)}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {site.activeOrders} commande(s)
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Fournisseurs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Fournisseurs actifs ({trackingData?.suppliers.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {trackingData?.suppliers.map(supplier => (
                      <div key={supplier.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{supplier.name}</h4>
                            <p className="text-sm text-gray-500">
                              📍 {supplier.coordinates.lat.toFixed(4)}, {supplier.coordinates.lng.toFixed(4)}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {supplier.activeOrders} commande(s)
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal détails commande */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {selectedOrder.orderNumber}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {getStatusLabel(selectedOrder.status)}
                </Badge>
                {selectedOrder.status === 'in_transit' && (
                  <Badge variant="outline">
                    {Math.round(selectedOrder.progress)}% terminé
                  </Badge>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">📦 Matériau</h4>
                <p>{selectedOrder.materialName} (Code: {selectedOrder.materialCode})</p>
                <p className="text-sm text-gray-500">Quantité: {selectedOrder.quantity}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">🚚 Trajet</h4>
                <p className="text-sm">
                  <strong>Départ:</strong> {selectedOrder.startLocation.name}
                </p>
                <p className="text-sm">
                  <strong>Destination:</strong> {selectedOrder.endLocation.name}
                </p>
                <p className="text-sm text-gray-500">
                  Distance: {formatDistance(selectedOrder.route.distance)}
                </p>
              </div>

              {selectedOrder.status === 'in_transit' && (
                <div>
                  <h4 className="font-medium mb-2">⏱️ Progression</h4>
                  <Progress value={selectedOrder.progress} className="mb-2" />
                  <div className="flex justify-between text-sm">
                    <span>Temps restant: {formatTime(selectedOrder.remainingTimeMinutes)}</span>
                    <span>ETA: {new Date(selectedOrder.eta).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">📅 Dates</h4>
                <p className="text-sm">
                  <strong>Créée:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
                {selectedOrder.actualDeparture && (
                  <p className="text-sm">
                    <strong>Départ:</strong> {new Date(selectedOrder.actualDeparture).toLocaleString()}
                  </p>
                )}
                {selectedOrder.estimatedArrival && (
                  <p className="text-sm">
                    <strong>Arrivée prévue:</strong> {new Date(selectedOrder.estimatedArrival).toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}