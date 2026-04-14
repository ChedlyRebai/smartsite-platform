"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder";
import { toast } from "sonner";
import orderService, { MaterialOrder } from "../../../services/orderService";
import materialService, { Material } from "../../../services/materialService";
import { siteService, fournisseurService, Site, Fournisseur } from "../../../services/siteFournisseurService";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { AlertTriangle, Package, Truck, MapPin, Navigation, Clock, Mic, Send, X } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/marker-icon-2x.png",
  iconUrl: "/marker-icon.png",
  shadowUrl: "",
});

// Icône camion
const truckIcon = L.icon({
  iconUrl: "/truck.png",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

// Icône chantier (site) - image construction-site.png
const siteIcon = L.icon({
  iconUrl: "/construction-site.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
});

// Icône fournisseur - image warehouse.png
const supplierIcon = L.icon({
  iconUrl: "/warehouse.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
});

interface LowStockMaterial {
  _id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  reorderPoint: number;
  siteId?: string;
  siteName?: string;
  siteCoordinates?: { lat: number; lng: number };
}

interface SupplierRoute {
  supplier: Fournisseur;
  distance: number;
  estimatedTime: number;
}

interface OrderMapProps {
  open: boolean;
  onClose: () => void;
  orderId?: string;
  materialName?: string;
  siteLocation?: { lat: number; lng: number; name: string };
  warehouseLocation?: { lat: number; lng: number; name: string };
  onOrderConfirmed?: () => void;
}

function RoutingControl({
  start,
  end,
  onProgress,
  onArrival,
}: {
  start: [number, number];
  end: [number, number];
  onProgress?: (progress: number) => void;
  onArrival?: () => void;
}) {
  const map = useMap();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const truckRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    const truck = L.marker(start, { icon: truckIcon }).addTo(map);
    truckRef.current = truck;

    const routing = L.Routing.control({
      waypoints: [L.latLng(...start), L.latLng(...end)],
      addWaypoints: false,
      draggableWaypoints: false,
      routeWhileDragging: false,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: "#2563eb", weight: 5 }],
      },
    }).addTo(map);

    routing.on("routesfound", (e: any) => {
      const coords = e.routes[0].coordinates;
      let i = 0;
      const totalSteps = coords.length;
      const speedMs = 200;

      intervalRef.current = setInterval(() => {
        if (!truckRef.current) return;

        if (i < coords.length) {
          truckRef.current.setLatLng([coords[i].lat, coords[i].lng]);
          const progress = Math.round((i / totalSteps) * 100);
          onProgress?.(progress);
          i++;
        } else {
          clearInterval(intervalRef.current!);
          onArrival?.();
        }
      }, speedMs);
    });

    const bounds = L.latLngBounds([start, end]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      map.removeControl(routing);
      if (truckRef.current) map.removeLayer(truckRef.current);
    };
  }, [map, start, end]);

  return null;
}

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}min`;
};

export default function OrderMap({ open, onClose, orderId, materialName, siteLocation, warehouseLocation, onOrderConfirmed }: OrderMapProps) {
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [lowStockMaterials, setLowStockMaterials] = useState<LowStockMaterial[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [supplierRoutes, setSupplierRoutes] = useState<SupplierRoute[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<MaterialOrder | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [isDelivering, setIsDelivering] = useState(false);
  const [isArrived, setIsArrived] = useState(false);
  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [countdownTime, setCountdownTime] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'orders' | 'stock'>('orders');
  const [messages, setMessages] = useState<{ id: string; sender: string; text: string; type: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [truckPosition, setTruckPosition] = useState<[number, number] | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const deliveryTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      loadData();
      startPolling();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (deliveryTimerRef.current) clearInterval(deliveryTimerRef.current);
    };
  }, [open]);

  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      loadOrders();
    }, 5000);
  };

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find((o) => o._id === orderId);
      if (order) {
        setSelectedOrder(order);
      }
    }
  }, [orderId, orders]);

  // Auto-select site and supplier when order changes
  useEffect(() => {
    if (selectedOrder) {
      const toIdString = (id: string | { toString(): string } | undefined): string => {
        if (!id) return '';
        return typeof id === 'string' ? id : id.toString();
      };
      
      const orderDestSiteId = toIdString(selectedOrder.destinationSiteId as any);
      const orderSupplierId = toIdString(selectedOrder.supplierId as any);
      
      const site = sites.find(s => toIdString(s._id) === orderDestSiteId);
      if (site) {
        setSelectedSite(site);
      }
      
      const supplier = fournisseurs.find(f => toIdString(f._id) === orderSupplierId);
      if (supplier) {
        setSelectedFournisseur(supplier);
      }
      
      if (selectedOrder.status === 'in_transit' && selectedOrder.currentPosition) {
        setTruckPosition([selectedOrder.currentPosition.lat, selectedOrder.currentPosition.lng]);
        setIsDelivering(true);
        setProgress(selectedOrder.progress || 0);
      } else if (selectedOrder.status === 'delivered') {
        if (!isArrived) {
          setIsArrived(true);
          setIsDelivering(false);
          toast.success(`🚚 Commande ${selectedOrder.orderNumber} livrée à ${selectedOrder.destinationSiteName}!`);
        }
        if (selectedOrder.destinationCoordinates) {
          setTruckPosition([selectedOrder.destinationCoordinates.lat, selectedOrder.destinationCoordinates.lng]);
        }
      } else if (selectedOrder.status === 'pending') {
        setIsDelivering(false);
        setIsArrived(false);
        setTruckPosition(null);
      }
    }
  }, [selectedOrder, sites, fournisseurs]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadOrders(),
        loadLowStock(),
        loadSites(),
        loadFournisseurs()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await orderService.getActiveOrders();
      console.log('📦 Loaded orders:', data.length);
      setOrders(data);
      if (data.length > 0 && !selectedOrder) {
        setSelectedOrder(data[0]);
      } else if (selectedOrder && data.length > 0) {
        const updatedSelected = data.find(o => o._id === selectedOrder._id);
        if (updatedSelected) {
          setSelectedOrder(updatedSelected);
        }
      }
    } catch (error) {
      console.error("Erreur chargement commandes:", error);
    }
  };

  const loadLowStock = async () => {
    try {
      const materials = await materialService.getMaterials({ lowStock: true, limit: 100 });
      const lowStock = (materials.data || []).map((m: Material) => ({
        _id: m._id,
        name: m.name,
        code: m.code,
        category: m.category,
        quantity: m.quantity,
        reorderPoint: m.reorderPoint,
        siteId: m.siteId,
        siteName: m.siteName,
        siteCoordinates: m.siteCoordinates
      }));
      setLowStockMaterials(lowStock);
    } catch (error) {
      console.error("Erreur chargement low stock:", error);
    }
  };

  const loadSites = async () => {
    try {
      const data = await siteService.getActiveSites();
      setSites(data);
      if (data.length > 0 && !selectedSite) {
        setSelectedSite(data[0]);
      }
    } catch (error) {
      console.error("Erreur chargement sites:", error);
    }
  };

  const loadFournisseurs = async () => {
    try {
      const data = await fournisseurService.getFournisseurs();
      setFournisseurs(data);
    } catch (error) {
      console.error("Erreur chargement fournisseurs:", error);
    }
  };

  useEffect(() => {
    if (selectedSite && selectedSite.coordinates && fournisseurs.length > 0) {
      calculateSupplierRoutes();
    }
  }, [selectedSite, fournisseurs]);

  const calculateSupplierRoutes = () => {
    if (!selectedSite?.coordinates) return;
    
    const routes: SupplierRoute[] = fournisseurs
      .filter(f => f.coordinates && f.estActif)
      .map(f => ({
        supplier: f,
        distance: calculateHaversineDistance(
          selectedSite.coordinates!.lat,
          selectedSite.coordinates!.lng,
          f.coordinates!.lat,
          f.coordinates!.lng
        ),
        estimatedTime: Math.round(calculateHaversineDistance(
          selectedSite.coordinates!.lat,
          selectedSite.coordinates!.lng,
          f.coordinates!.lat,
          f.coordinates!.lng
        ) * 2)
      }))
      .sort((a, b) => a.distance - b.distance);
    
    setSupplierRoutes(routes);
  };

  const handleSelectMaterial = (material: LowStockMaterial) => {
    if (material.siteCoordinates) {
      setSelectedSite({
        _id: material.siteId || '',
        nom: material.siteName || 'Chantier',
        adresse: '',
        coordinates: material.siteCoordinates,
        budget: 0,
        status: '',
        isActif: true
      } as Site);
    }
    setViewMode('stock');
  };

  const handleSelectSupplier = (route: SupplierRoute) => {
    setSelectedFournisseur(route.supplier);
    setTotalDistance(route.distance);
    setRemainingTime(route.estimatedTime);
  };

  // ========== LOGIQUE DE DÉPLACEMENT CORRIGÉE ==========
  // Le camion part du SITE (Chantier) vers le FOURNISSEUR
  const handleStartDelivery = async () => {
    if (!selectedSite || !selectedFournisseur?.coordinates) {
      toast.error("Coordonnées manquantes");
      return;
    }

    try {
      await orderService.updateOrderStatus(orderId!, { status: 'in_transit' });
      setIsDelivering(true);
      setIsArrived(false);
      setProgress(0);
      
      // POINT DE DÉPART: Site (Chantier)
      const startLat = selectedSite.coordinates.lat;
      const startLng = selectedSite.coordinates.lng;
      
      // POINT D'ARRIVÉE: Fournisseur
      const endLat = selectedFournisseur.coordinates.lat;
      const endLng = selectedFournisseur.coordinates.lng;
      
      console.log("🚚 DÉPART: Chantier → ARRIVÉE: Fournisseur");
      console.log("Départ (Site):", startLat, startLng);
      console.log("Arrivée (Fournisseur):", endLat, endLng);
      
      const duration = remainingTime;
      setCountdownTime(duration);
      setTruckPosition([startLat, startLng]);
      
      const steps = 30;
      const intervalMs = (duration * 60 * 1000) / steps;
      let step = 0;
      
      if (deliveryTimerRef.current) clearInterval(deliveryTimerRef.current);
      
      deliveryTimerRef.current = setInterval(async () => {
        step++;
        const progressVal = (step / steps) * 100;
        setProgress(progressVal);
        
        // Interpolation linéaire entre départ (Site) et arrivée (Fournisseur)
        const newLat = startLat + (endLat - startLat) * (step / steps);
        const newLng = startLng + (endLng - startLng) * (step / steps);
        setTruckPosition([newLat, newLng]);
        
        const timeLeft = Math.round(duration * (1 - step / steps));
        setCountdownTime(timeLeft);
        
        await orderService.updateOrderProgress(orderId!, { 
          lat: newLat, 
          lng: newLng, 
          progress: Math.round(progressVal),
          remainingTime: timeLeft
        });
        
        if (step >= steps) {
          if (deliveryTimerRef.current) clearInterval(deliveryTimerRef.current);
          setIsDelivering(false);
          setIsArrived(true);
          setProgress(100);
          setCountdownTime(0);
          await orderService.updateOrderStatus(orderId!, { status: 'delivered' });
          toast.success(`✅ Le camion est arrivé chez ${selectedFournisseur.nom}!`);
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'System',
            text: `✅ Livraison terminée! Le camion est arrivé chez ${selectedFournisseur.nom}`,
            type: 'arrival'
          }]);
        }
      }, intervalMs);
    } catch (error) {
      console.error("Erreur livraison:", error);
      toast.error("Erreur lors de la simulation de livraison");
      setIsDelivering(false);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, {
      id: Date.now().toString(),
      sender: 'Me',
      text: newMessage,
      type: 'text'
    }]);
    setNewMessage("");
  };

  const handleVoiceMessage = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setMessages([...messages, {
        id: Date.now().toString(),
        sender: 'Me',
        text: '🎤 Message vocal',
        type: 'voice'
      }]);
      toast.success("Message vocal envoyé!");
    }
  };

  const handleConfirmArrival = () => {
    setMessages([...messages, {
      id: Date.now().toString(),
      sender: 'System',
      text: `✅ Confirme: Le camion est arrivé chez ${selectedFournisseur?.nom} et commence le chargement`,
      type: 'arrival'
    }]);
    toast.success("Confirmation d'arrivée envoyée!");
    onOrderConfirmed?.();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "in_transit": return "bg-blue-500";
      case "delivered": return "bg-green-500";
      case "delayed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "in_transit": return "En cours";
      case "delivered": return "Livré";
      case "delayed": return "Retardé";
      default: return status;
    }
  };

  if (!open) return null;

  // POINT DE DÉPART: Site (Chantier) - image construction-site.png
  const startPos = selectedSite?.coordinates
    ? [selectedSite.coordinates.lat, selectedSite.coordinates.lng] as [number, number]
    : [36.8065, 10.1815];
  
  // POINT D'ARRIVÉE: Fournisseur - image warehouse.png
  const endPos = selectedFournisseur?.coordinates
    ? [selectedFournisseur.coordinates.lat, selectedFournisseur.coordinates.lng] as [number, number]
    : startPos;
  
  const centerMap = truckPosition || [
    (startPos[0] + endPos[0]) / 2,
    (startPos[1] + endPos[1]) / 2
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-hidden">
      <div className="bg-white w-[98%] h-[95%] rounded-xl flex flex-col">

        {/* HEADER */}
        <div className="p-4 flex justify-between items-center border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
          <div>
            <h2 className="font-bold text-lg">🚚 Suivi de livraison</h2>
            <p className="text-sm text-blue-100">🏗️ Chantier (DÉPART) → 🏭 Fournisseur (ARRIVÉE)</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30" onClick={() => setViewMode(viewMode === 'orders' ? 'stock' : 'orders')}>
              {viewMode === 'orders' ? '📦 Stock' : '📋 Commandes'}
            </Button>
            <button onClick={onClose} className="text-white hover:text-blue-200 text-2xl p-2">
              <X />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">

          {/* SIDEBAR */}
          <div className="w-96 border-r flex flex-col bg-gray-50">
            <div className="p-2 border-b bg-white flex gap-1">
              <Button variant={viewMode === 'stock' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('stock')} className="flex-1">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Rupture Stock
              </Button>
              <Button variant={viewMode === 'orders' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('orders')} className="flex-1">
                <Truck className="w-4 h-4 mr-1" />
                Commandes
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Chargement...</div>
              ) : viewMode === 'stock' ? (
                <>
                  <div className="text-sm font-semibold text-gray-600 px-2 py-1 bg-yellow-50 rounded">
                    📦 Matériaux en rupture/low stock ({lowStockMaterials.length})
                  </div>
                  {lowStockMaterials.map((mat) => (
                    <div key={mat._id} onClick={() => handleSelectMaterial(mat)} className="p-3 rounded-lg border-2 cursor-pointer hover:border-yellow-400 bg-yellow-50">
                      <div className="flex justify-between">
                        <span className="font-semibold">{mat.name}</span>
                        <Badge variant={mat.quantity === 0 ? 'destructive' : 'secondary'}>
                          {mat.quantity === 0 ? 'Rupture' : 'Low stock'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">{mat.code} • Stock: {mat.quantity}/{mat.reorderPoint}</div>
                    </div>
                  ))}

                  <div className="text-sm font-semibold text-gray-600 px-2 py-1 bg-blue-50 rounded mt-4">
                    🏗️ Chantiers ({sites.length})
                  </div>
                  {sites.filter(s => s.coordinates).slice(0, 5).map((site) => (
                    <div key={site._id} onClick={() => setSelectedSite(site)} className={`p-2 rounded border cursor-pointer ${selectedSite?._id === site._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="font-medium">{site.nom}</div>
                      <div className="text-xs text-gray-500">{site.adresse}</div>
                    </div>
                  ))}

                  <div className="text-sm font-semibold text-gray-600 px-2 py-1 bg-green-50 rounded mt-4">
                    🏭 Fournisseurs ({supplierRoutes.length})
                  </div>
                  {supplierRoutes.map((route) => (
                    <div key={route.supplier._id} onClick={() => handleSelectSupplier(route)} className={`p-3 rounded border cursor-pointer ${selectedFournisseur?._id === route.supplier._id ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between">
                        <span className="font-semibold">{route.supplier.nom}</span>
                        <span className="text-sm font-medium text-blue-600">{formatDistance(route.distance)}</span>
                      </div>
                      <div className="text-xs text-gray-500">{route.supplier.adresse}, {route.supplier.ville}</div>
                      <div className="text-xs text-green-600">⏱️ ~{formatTime(route.estimatedTime)}</div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Aucune commande active</div>
                  ) : (
                    orders.map((order) => (
                      <div key={order._id} onClick={() => setSelectedOrder(order)} className={`p-3 rounded-lg border-2 cursor-pointer ${selectedOrder?._id === order._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between">
                          <span className="font-semibold">{order.materialName}</span>
                          <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                        </div>
                        <div className="text-xs text-gray-500">🏗️ {order.destinationSiteName} → 🏭 {order.supplierName}</div>
                        <div className="text-xs">⏱️ {formatTime(order.estimatedDurationMinutes)}</div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>

            {/* Chat Panel */}
            <div className="border-t p-2 bg-white">
              <div className="text-xs font-semibold text-gray-600 mb-2">💬 Messages</div>
              <div className="h-24 overflow-y-auto bg-gray-50 rounded p-2 mb-2 space-y-1">
                {messages.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center">Aucun message</div>
                ) : messages.map((msg) => (
                  <div key={msg.id} className="text-xs bg-white p-1 rounded">
                    <span className="font-medium">{msg.sender}:</span> {msg.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <input type="text" placeholder="Message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 text-sm border rounded px-2 py-1" />
                <Button size="sm" variant="ghost" onClick={handleVoiceMessage} className={isRecording ? 'bg-red-100 text-red-600' : ''}>
                  <Mic className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSendMessage}><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>

          {/* MAP */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              <MapContainer center={centerMap} zoom={10} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* 🏗️ POINT DE DÉPART: Site (Chantier) - image construction-site.png */}
                {selectedSite?.coordinates && (
                  <Marker position={startPos} icon={siteIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>🏗️ DÉPART: Chantier</strong><br/>
                        {selectedSite.nom}
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* 🏭 POINT D'ARRIVÉE: Fournisseur - image warehouse.png */}
                {selectedFournisseur?.coordinates && (
                  <Marker position={endPos} icon={supplierIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>🏭 ARRIVÉE: Fournisseur</strong><br/>
                        {selectedFournisseur.nom}<br/>
                        {selectedFournisseur.adresse}
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Route animation: 🏗️ SITE → 🏭 FOURNISSEUR */}
                {isDelivering && selectedFournisseur?.coordinates && (
                  <RoutingControl 
                    start={startPos} 
                    end={endPos} 
                    onProgress={(p) => setProgress(p)} 
                    onArrival={() => { 
                      setIsArrived(true); 
                      setIsDelivering(false); 
                      toast.success(`🚚 Le camion est arrivé chez ${selectedFournisseur.nom}!`); 
                    }} 
                  />
                )}
                
                {/* 🚚 Camion en mouvement */}
                {truckPosition && (
                  <Marker position={truckPosition} icon={truckIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>🚚 Camion</strong><br/>
                        {materialName || selectedOrder?.materialName}<br/>
                        🏗️ {selectedSite?.nom} → 🏭 {selectedFournisseur?.nom}<br/>
                        Progression: {Math.round(progress)}%<br/>
                        Temps restant: {formatTime(countdownTime)}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>

              {/* Route Info Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg border border-gray-200 z-[1000]">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Trajet: 🏗️ Chantier → 🏭 Fournisseur</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <span>🏗️ {selectedSite?.nom?.substring(0, 15) || "Chantier"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Truck className="h-3 w-3" />
                    <span>{Math.round(totalDistance * progress / 100)}/{Math.round(totalDistance)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🏭 {selectedFournisseur?.nom?.substring(0, 15) || "Fournisseur"}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-gray-500">⏱️ Temps restant:</span>
                  <span className={`font-semibold ${countdownTime < 5 && countdownTime > 0 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                    {formatTime(countdownTime)}
                  </span>
                </div>
                
                {!isDelivering && !isArrived && selectedFournisseur && (
                  <Button 
                    onClick={handleStartDelivery}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Démarrer la livraison (Chantier → Fournisseur)
                  </Button>
                )}
                
                {isDelivering && (
                  <div className="flex items-center justify-center gap-3 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                    <span className="text-sm">Livraison en cours...</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                )}
                
                {isArrived && (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">✅ Livraison terminée !</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}