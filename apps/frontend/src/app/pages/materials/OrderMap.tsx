"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { AlertTriangle, Package, Truck, MapPin, Navigation, Clock, Mic, Send, X, CheckCircle } from "lucide-react";
import PaymentDialog from "./PaymentDialog";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/marker-icon-2x.png",
  iconUrl: "/marker-icon.png",
  shadowUrl: "",
});

const truckIcon = L.icon({
  iconUrl: "/truck.png",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

const siteIcon = L.icon({
  iconUrl: "/construction-site.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
});

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

// Function to generate intermediate points
function generateIntermediatePoints(
  start: [number, number],
  end: [number, number],
  steps: number
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const lat = start[0] + (end[0] - start[0]) * (i / steps);
    const lng = start[1] + (end[1] - start[1]) * (i / steps);
    points.push([lat, lng]);
  }
  return points;
}

// RoutingControl component with interval for real-time tracking
function RoutingControl({
  start,
  end,
  totalDurationMinutes, // Renamed for clarity - this value doesn't change
  onProgress,
  onArrival,
  onTimeUpdate,
}: {
  start: [number, number];
  end: [number, number];
  totalDurationMinutes: number; // Fixed total duration in minutes
  onProgress?: (progress: number) => void;
  onArrival?: () => void;
  onTimeUpdate?: (remainingMinutes: number) => void;
}) {
  const map = useMap();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const truckRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const startTimeRef = useRef<number>(0);
  const stepsRef = useRef<[number, number][]>([]);
  const totalDurationMsRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);
  const onProgressRef = useRef(onProgress);
  const onArrivalRef = useRef(onArrival);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onArrivalRef.current = onArrival;
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onProgress, onArrival, onTimeUpdate]);

  useEffect(() => {
    if (!map || !start || !end || totalDurationMinutes <= 0) return;

    // Clean up previous animation
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (truckRef.current) map.removeLayer(truckRef.current);
    if (polylineRef.current) map.removeLayer(polylineRef.current);

    // Create intermediate points
    stepsRef.current = generateIntermediatePoints(start, end, 200);
    
    // Add truck marker
    truckRef.current = L.marker(start, { icon: truckIcon }).addTo(map);
    
    // Adjust view
    const bounds = L.latLngBounds([start, end]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Draw route line
    polylineRef.current = L.polyline([start, end], {
      color: "#2563eb",
      weight: 4,
      opacity: 0.7,
      dashArray: "10, 10"
    }).addTo(map);

    // Start animation
    startTimeRef.current = Date.now();
    isAnimatingRef.current = true;
    totalDurationMsRef.current = totalDurationMinutes * 60 * 1000;
    const totalSteps = stepsRef.current.length - 1;

    console.log(`🎬 Animation started - FIXED total duration: ${totalDurationMinutes} minutes (${totalDurationMsRef.current} ms = ${totalDurationMsRef.current / 1000} seconds)`);
    console.log(`📍 Departure: [${start[0]}, ${start[1]}]`);
    console.log(`📍 Arrival: [${end[0]}, ${end[1]}]`);

    // Update position function
    const updatePosition = () => {
      if (!isAnimatingRef.current) return;
      
      const elapsed = Date.now() - startTimeRef.current;
      let progressRatio = elapsed / totalDurationMsRef.current;
      
      // Ensure progressRatio doesn't exceed 1
      if (progressRatio > 1) progressRatio = 1;
      
      const targetStep = Math.floor(progressRatio * totalSteps);
      
      // Calculate remaining time in minutes
      const remainingMs = Math.max(0, totalDurationMsRef.current - elapsed);
      const remainingMinutes = remainingMs / (60 * 1000);
      
      // Update remaining time display
      onTimeUpdateRef.current?.(remainingMinutes);
      
      // Update truck position
      if (targetStep >= 0 && targetStep <= totalSteps && truckRef.current) {
        const position = stepsRef.current[targetStep];
        truckRef.current.setLatLng(position);
        const progressPercent = (targetStep / totalSteps) * 100;
        onProgressRef.current?.(progressPercent);
      }
      
      // Check if animation is complete
      if (progressRatio >= 1) {
        console.log("🏁 Animation complete!");
        isAnimatingRef.current = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        truckRef.current?.setLatLng(end);
        onProgressRef.current?.(100);
        onTimeUpdateRef.current?.(0);
        onArrivalRef.current?.();
      }
    };

    // Update every second
    intervalRef.current = setInterval(updatePosition, 1000);
    
    // Execute first update immediately
    updatePosition();

    return () => {
      isAnimatingRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (truckRef.current) map.removeLayer(truckRef.current);
      if (polylineRef.current) map.removeLayer(polylineRef.current);
    };
  }, [map, start, end, totalDurationMinutes]);

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
  if (minutes < 0) return "0 min";
  if (minutes < 1) return `${Math.ceil(minutes * 60)} sec`;
  if (minutes < 60) return `${Math.ceil(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.ceil(minutes % 60);
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
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0); // Fixed total duration in minutes
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'orders' | 'stock'>('orders');
  const [messages, setMessages] = useState<{ id: string; sender: string; text: string; type: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [truckPosition, setTruckPosition] = useState<[number, number] | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentOrderData, setPaymentOrderData] = useState<any>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const routingKeyRef = useRef<number>(0);
  const animationDurationRef = useRef<number>(0); // Stores duration for animation

  useEffect(() => {
    if (open) {
      loadData();
      startPolling();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
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
        // Get estimated duration from order
        if (order.estimatedDurationMinutes && order.estimatedDurationMinutes > 0) {
          const duration = order.estimatedDurationMinutes;
          setTotalDuration(duration);
          setRemainingTime(duration);
          console.log(`📋 Estimated duration from order: ${duration} minutes`);
        }
      }
    }
  }, [orderId, orders]);

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
        if (site?.coordinates && supplier.coordinates) {
          const dist = calculateHaversineDistance(
            site.coordinates.lat,
            site.coordinates.lng,
            supplier.coordinates.lat,
            supplier.coordinates.lng
          );
          setTotalDistance(dist);
          
          // Use estimated duration from order
          if (selectedOrder.estimatedDurationMinutes && selectedOrder.estimatedDurationMinutes > 0) {
            setTotalDuration(selectedOrder.estimatedDurationMinutes);
            if (selectedOrder.status !== 'in_transit') {
              setRemainingTime(selectedOrder.estimatedDurationMinutes);
            }
            console.log(`📏 Distance: ${dist.toFixed(2)} km, Order duration: ${selectedOrder.estimatedDurationMinutes} minutes`);
          }
        }
      }
      
      if (selectedOrder.status === 'in_transit' && selectedOrder.currentPosition) {
        setTruckPosition([selectedOrder.currentPosition.lat, selectedOrder.currentPosition.lng]);
        setIsDelivering(true);
        setProgress(selectedOrder.progress || 0);
        if (selectedOrder.remainingTimeMinutes) {
          setRemainingTime(selectedOrder.remainingTimeMinutes);
        }
      } else if (selectedOrder.status === 'delivered') {
        if (!isArrived) {
          setIsArrived(true);
          setIsDelivering(false);
          toast.success(`🚚 Order ${selectedOrder.orderNumber} delivered!`);
        }
        if (selectedOrder.destinationCoordinates) {
          setTruckPosition([selectedOrder.destinationCoordinates.lat, selectedOrder.destinationCoordinates.lng]);
        }
      } else if (selectedOrder.status === 'pending') {
        setIsDelivering(false);
        setIsArrived(false);
        setTruckPosition(null);
        setProgress(0);
        if (totalDuration > 0) {
          setRemainingTime(totalDuration);
        }
      }
    }
  }, [selectedOrder, sites, fournisseurs, totalDuration]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading Order Map data...');
      await Promise.all([
        loadOrders(),
        loadLowStock(),
        loadSites(),
        loadFournisseurs()
      ]);
      console.log('✅ Data loaded - Orders:', orders.length, 'Sites:', sites.length, 'Suppliers:', fournisseurs.length);
    } catch (error) {
      console.error('❌ Error loading Order Map data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await orderService.getActiveOrders();
      console.log('📦 Active orders loaded:', data.length);
      if (data.length === 0) {
        console.log('⚠️ No active orders found');
      }
      setOrders(data);
      if (data.length > 0 && !selectedOrder) {
        setSelectedOrder(data[0]);
        console.log('✅ Order selected:', data[0].orderNumber);
      } else if (selectedOrder && data.length > 0) {
        const updatedSelected = data.find(o => o._id === selectedOrder._id);
        if (updatedSelected) {
          setSelectedOrder(updatedSelected);
        }
      }
    } catch (error) {
      console.error("Error loading orders:", error);
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
      console.log('📦 Out of stock/low stock materials:', lowStock.length);
      setLowStockMaterials(lowStock);
    } catch (error) {
      console.error("❌ Error loading low stock:", error);
    }
  };

  const loadSites = async () => {
    try {
      const data = await siteService.getActiveSites();
      console.log('🏗️ Active sites loaded:', data.length);
      setSites(data);
      if (data.length > 0 && !selectedSite) {
        setSelectedSite(data[0]);
        console.log('✅ Site selected:', data[0].nom);
      }
    } catch (error) {
      console.error("❌ Error loading sites:", error);
    }
  };

  const loadFournisseurs = async () => {
    try {
      const data = await fournisseurService.getFournisseurs();
      console.log('🏭 Suppliers loaded:', data.length);
      setFournisseurs(data);
    } catch (error) {
      console.error("❌ Error loading suppliers:", error);
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
        estimatedTime: Math.max(1, Math.round(calculateHaversineDistance(
          selectedSite.coordinates!.lat,
          selectedSite.coordinates!.lng,
          f.coordinates!.lat,
          f.coordinates!.lng
        ) * 2))
      }))
      .sort((a, b) => a.distance - b.distance);
    
    setSupplierRoutes(routes);
  };

  const handleSelectMaterial = (material: LowStockMaterial) => {
    if (material.siteCoordinates) {
      setSelectedSite({
        _id: material.siteId || '',
        nom: material.siteName || 'Construction Site',
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
    setTotalDuration(route.estimatedTime);
  };

  const handleStartDelivery = async () => {
    if (!selectedSite || !selectedFournisseur?.coordinates) {
      toast.error("Missing coordinates");
      return;
    }

    // Use total duration from order
    const duration = totalDuration;
    
    if (duration <= 0) {
      toast.error("Invalid duration");
      return;
    }

    console.log(`🚚 STARTING DELIVERY - Actual duration: ${duration} minutes (${duration * 60} seconds)`);
    console.log(`📍 Departure (Site): ${selectedSite.coordinates.lat}, ${selectedSite.coordinates.lng}`);
    console.log(`📍 Arrival (Supplier): ${selectedFournisseur.coordinates.lat}, ${selectedFournisseur.coordinates.lng}`);
    console.log(`⏱️ Delivery will take EXACTLY ${duration} minutes (${duration * 60} seconds)`);

    try {
      await orderService.updateOrderStatus(orderId!, { status: 'in_transit' });
      setIsDelivering(true);
      setIsArrived(false);
      setProgress(0);
      setRemainingTime(duration);
      
      // Store duration for animation
      animationDurationRef.current = duration;
      
      // Increment key to force RoutingControl remount
      routingKeyRef.current += 1;
      
      toast.success(`🚚 Delivery started! Duration: ${formatTime(duration)}`);
      
    } catch (error) {
      console.error("Delivery error:", error);
      toast.error("Error starting delivery simulation");
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
        text: '🎤 Voice message',
        type: 'voice'
      }]);
      toast.success("Voice message sent!");
    }
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
      case "pending": return "Pending";
      case "in_transit": return "In Transit";
      case "delivered": return "Delivered";
      case "delayed": return "Delayed";
      default: return status;
    }
  };

  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress);
  };

  const handleTimeUpdate = (remainingMinutes: number) => {
    setRemainingTime(remainingMinutes);
  };

  const handleArrival = async () => {
    console.log("🏁 ARRIVED AT DESTINATION");
    setIsArrived(true);
    setIsDelivering(false);
    setProgress(100);
    setRemainingTime(0);
    
    await orderService.updateOrderStatus(orderId!, { status: 'delivered' });
    toast.success(`✅ The truck has arrived at ${selectedFournisseur?.nom}!`);
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'System',
      text: `✅ Delivery complete! The truck has arrived at ${selectedFournisseur?.nom}`,
      type: 'arrival'
    }]);
    
    // 💰 OPEN PAYMENT DIALOG AUTOMATICALLY
    if (selectedOrder) {
      const amount = selectedOrder.quantity * 100; // Unit price * quantity
      setPaymentOrderData({
        orderId: selectedOrder._id,
        orderNumber: selectedOrder.orderNumber,
        materialName: selectedOrder.materialName,
        supplierName: selectedOrder.supplierName,
        siteName: selectedOrder.destinationSiteName,
        amount,
      });
      setShowPaymentDialog(true);
      
      // Chat message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'System',
        text: `💰 Payment dialog opened - Amount: ${amount}€`,
        type: 'payment'
      }]);
    }
    
    onOrderConfirmed?.();
  };

  if (!open) return null;

  const startPos = selectedSite?.coordinates
    ? [selectedSite.coordinates.lat, selectedSite.coordinates.lng] as [number, number]
    : [36.8065, 10.1815];
  
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

        <div className="p-4 flex justify-between items-center border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
          <div>
            <h2 className="font-bold text-lg">🚚 Delivery Tracking</h2>
            <p className="text-sm text-blue-100">🏗️ Construction Site (DEPARTURE) → 🏭 Supplier (ARRIVAL)</p>
            {totalDuration > 0 && !isDelivering && (
              <p className="text-xs text-blue-200 mt-1">⏱️ Estimated duration: {formatTime(totalDuration)}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30" onClick={() => setViewMode(viewMode === 'orders' ? 'stock' : 'orders')}>
              {viewMode === 'orders' ? '📦 Stock' : '📋 Orders'}
            </Button>
            <button onClick={onClose} className="text-white hover:text-blue-200 text-2xl p-2">
              <X />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          <div className="w-96 border-r flex flex-col bg-gray-50">
            <div className="p-2 border-b bg-white flex gap-1">
              <Button variant={viewMode === 'stock' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('stock')} className="flex-1">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Stock Shortage
              </Button>
              <Button variant={viewMode === 'orders' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('orders')} className="flex-1">
                <Truck className="w-4 h-4 mr-1" />
                Orders
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : viewMode === 'stock' ? (
                <>
                  {lowStockMaterials.length === 0 && sites.length === 0 && supplierRoutes.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm mb-2">No data available</p>
                      <p className="text-xs text-gray-400">Create sites and suppliers to get started</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-semibold text-gray-600 px-2 py-1 bg-yellow-50 rounded">
                        📦 Out of stock/Low stock materials ({lowStockMaterials.length})
                      </div>
                      {lowStockMaterials.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-400">
                          No out of stock materials
                        </div>
                      ) : (
                        lowStockMaterials.map((mat) => (
                          <div key={mat._id} onClick={() => handleSelectMaterial(mat)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelectMaterial(mat); }} role="button" tabIndex={0} className="p-3 rounded-lg border-2 cursor-pointer hover:border-yellow-400 bg-yellow-50">
                            <div className="flex justify-between">
                              <span className="font-semibold">{mat.name}</span>
                              <Badge variant={mat.quantity === 0 ? 'destructive' : 'secondary'}>
                                {mat.quantity === 0 ? 'Out of stock' : 'Low stock'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">{mat.code} • Stock: {mat.quantity}/{mat.reorderPoint}</div>
                          </div>
                        ))
                      )}

                      <div className="text-sm font-semibold text-gray-600 px-2 py-1 bg-blue-50 rounded mt-4">
                        🏗️ Construction Sites ({sites.length})
                      </div>
                      {sites.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-400">
                          No construction sites available
                        </div>
                      ) : (
                        sites.filter(s => s.coordinates).slice(0, 5).map((site) => (
                          <div key={site._id} onClick={() => setSelectedSite(site)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedSite(site); }} role="button" tabIndex={0} className={`p-2 rounded border cursor-pointer ${selectedSite?._id === site._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                            <div className="font-medium">{site.nom}</div>
                            <div className="text-xs text-gray-500">{site.adresse}</div>
                          </div>
                        ))
                      )}

                      <div className="text-sm font-semibold text-gray-600 px-2 py-1 bg-green-50 rounded mt-4">
                        🏭 Suppliers ({supplierRoutes.length})
                      </div>
                      {supplierRoutes.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-400">
                          {fournisseurs.length === 0 ? 'No suppliers available' : 'Select a site to see suppliers'}
                        </div>
                      ) : (
                        supplierRoutes.map((route) => (
                          <div key={route.supplier._id} onClick={() => handleSelectSupplier(route)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelectSupplier(route); }} role="button" tabIndex={0} className={`p-3 rounded border cursor-pointer ${selectedFournisseur?._id === route.supplier._id ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                            <div className="flex justify-between">
                              <span className="font-semibold">{route.supplier.nom}</span>
                              <span className="text-sm font-medium text-blue-600">{formatDistance(route.distance)}</span>
                            </div>
                            <div className="text-xs text-gray-500">{route.supplier.adresse}, {route.supplier.ville}</div>
                            <div className="text-xs text-green-600">⏱️ ~{formatTime(route.estimatedTime)}</div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm mb-2">No active orders</p>
                      <p className="text-xs text-gray-400 mb-4">Create an order from the Materials page</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setViewMode('stock')}
                      >
                        📦 View low stock
                      </Button>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order._id} onClick={() => setSelectedOrder(order)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedOrder(order); }} role="button" tabIndex={0} className={`p-3 rounded-lg border-2 cursor-pointer ${selectedOrder?._id === order._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between">
                          <span className="font-semibold">{order.materialName}</span>
                          <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                        </div>
                        <div className="text-xs text-gray-500">🏗️ {order.destinationSiteName} → 🏭 {order.supplierName}</div>
                        <div className="text-xs font-medium text-blue-600">⏱️ Duration: {formatTime(order.estimatedDurationMinutes)}</div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>

            <div className="border-t p-2 bg-white">
              <div className="text-xs font-semibold text-gray-600 mb-2">💬 Messages</div>
              <div className="h-24 overflow-y-auto bg-gray-50 rounded p-2 mb-2 space-y-1">
                {messages.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center">No messages</div>
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

          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              <MapContainer key={routingKeyRef.current} center={centerMap} zoom={10} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {selectedSite?.coordinates && (
                  <Marker position={startPos} icon={siteIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>🏗️ DEPARTURE: Construction Site</strong><br/>
                        {selectedSite.nom}
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {selectedFournisseur?.coordinates && (
                  <Marker position={endPos} icon={supplierIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>🏭 ARRIVAL: Supplier</strong><br/>
                        {selectedFournisseur.nom}<br/>
                        {selectedFournisseur.adresse}
                      </div>
                    </Popup>
                  </Marker>
                )}

                {isDelivering && selectedFournisseur?.coordinates && totalDuration > 0 && (
                  <RoutingControl 
                    key={`routing-${orderId}-${routingKeyRef.current}`}
                    start={startPos} 
                    end={endPos} 
                    totalDurationMinutes={totalDuration}
                    onProgress={handleProgressUpdate} 
                    onArrival={handleArrival}
                    onTimeUpdate={handleTimeUpdate}
                  />
                )}
                
                {truckPosition && !isDelivering && (
                  <Marker position={truckPosition} icon={truckIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>🚚 Truck</strong><br/>
                        {materialName || selectedOrder?.materialName}<br/>
                        🏗️ {selectedSite?.nom} → 🏭 {selectedFournisseur?.nom}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>

              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg border border-gray-200 z-[1000]">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Route: 🏗️ Construction Site → 🏭 Supplier</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <span>🏗️ {selectedSite?.nom?.substring(0, 15) || "Construction Site"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Truck className="h-3 w-3" />
                    <span>{Math.round(totalDistance * progress / 100)}/{Math.round(totalDistance)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🏭 {selectedFournisseur?.nom?.substring(0, 15) || "Supplier"}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-gray-500">⏱️ Time remaining:</span>
                  <span className={`font-semibold ${remainingTime < 5 && remainingTime > 0 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                    {formatTime(remainingTime)}
                  </span>
                </div>
                
                {!isDelivering && !isArrived && selectedFournisseur && selectedOrder?.status === 'pending' && totalDuration > 0 && (
                  <Button 
                    onClick={handleStartDelivery}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Start delivery ({formatTime(totalDuration)})
                  </Button>
                )}
                
                {isDelivering && !isArrived && (
                  <div className="flex items-center justify-center gap-3 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                    <span className="text-sm">Delivery in progress...</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                )}
                
                {isArrived && (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">✅ Delivery complete!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Dialog */}
        {showPaymentDialog && paymentOrderData && (
          <PaymentDialog
            open={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            onSuccess={() => {
              setShowPaymentDialog(false);
              toast.success('💰 Payment successful!');
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'System',
                text: `✅ Payment confirmed for ${paymentOrderData.amount}€`,
                type: 'payment_success'
              }]);
            }}
            {...paymentOrderData}
          />
        )}
      </div>
    </div>
  );
}