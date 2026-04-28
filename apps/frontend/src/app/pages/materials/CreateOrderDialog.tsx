"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { toast } from "sonner";
import { MapPin, Package, Truck, Clock, Navigation, AlertTriangle, CheckCircle, Star, MessageCircle, ArrowRight } from "lucide-react";
import orderService, { CreateOrderData } from "../../../services/orderService";
import { siteService, fournisseurService, Site, Fournisseur } from "../../../services/siteFournisseurService";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ChatDialog from "./ChatDialog";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const truckIcon = L.icon({
  iconUrl: "/truck.png",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

const supplierIcon = L.icon({
  iconUrl: "/warehouse.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
});

const siteIcon = L.icon({
  iconUrl: "/construction-site.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
});

const TUNISIA_CENTER: LatLngExpression = [33.8869, 9.5375];

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
  materialId: string;
  materialName: string;
  materialCode: string;
  materialCategory?: string;
  materialSiteId?: string;
  materialSiteName?: string;
  materialSiteCoordinates?: { lat: number; lng: number };
  onOrderCreated: () => void;
  currentUser?: { id: string; name: string; role: string };
}

interface SupplierWithDistance extends Fournisseur {
  distance: number;
  estimatedTime: number;
  hasCoordinates: boolean;
}

export default function CreateOrderDialog({
  open,
  onClose,
  materialId,
  materialName,
  materialCode,
  materialCategory,
  materialSiteId,
  materialSiteName,
  materialSiteCoordinates,
  onOrderCreated,
  currentUser = { id: "user-1", name: "Works Manager", role: "works_manager" }
}: CreateOrderDialogProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [recommendedSuppliers, setRecommendedSuppliers] = useState<SupplierWithDistance[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Fournisseur | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [recommendedQuantity, setRecommendedQuantity] = useState<number>(0);
  const [minQuantity, setMinQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
      loadPrediction();
      setCreatedOrderId(null);
      setShowChat(false);
    }
  }, [open]);

  const loadPrediction = async () => {
    setLoadingPrediction(true);
    try {
      const response = await fetch(`http://localhost:3002/api/materials/${materialId}/prediction`);
      if (response.ok) {
        const prediction = await response.json();
        const recommended = prediction.recommendedOrderQuantity || 0;
        setRecommendedQuantity(recommended);
        setMinQuantity(recommended);
        setQuantity(recommended);
        console.log(`📊 Prédiction chargée: Quantité recommandée = ${recommended}`);
      }
    } catch (error) {
      console.error('Erreur chargement prédiction:', error);
    } finally {
      setLoadingPrediction(false);
    }
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      const sitesData = await siteService.getSites();
      setSites(sitesData);
      
      let foundSite = null;
      if (materialSiteId) {
        foundSite = sitesData.find(s => s._id === materialSiteId);
      }
      
      if (foundSite?.coordinates) {
        setCurrentSite(foundSite);
      } else if (materialSiteCoordinates) {
        setCurrentSite({
          _id: materialSiteId || 'temp',
          nom: materialSiteName || 'Chantier',
          adresse: '',
          coordinates: materialSiteCoordinates,
          budget: 0,
          status: '',
          isActif: true
        });
      } else if (sitesData.length > 0) {
        setCurrentSite(sitesData[0]);
      }
      
      const suppliersData = await fournisseurService.getFournisseurs();
      setFournisseurs(suppliersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur chargement des données");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (fournisseurs.length > 0 && currentSite) {
      calculateNearestSuppliers();
    }
  }, [currentSite, fournisseurs]);

  const calculateNearestSuppliers = () => {
    const allSuppliers = fournisseurs.map((fournisseur) => {
      let distance = -1;
      let hasCoords = false;
      
      if (currentSite?.coordinates && fournisseur.coordinates?.lat && fournisseur.coordinates?.lng) {
        hasCoords = true;
        distance = calculateHaversineDistance(
          currentSite.coordinates.lat,
          currentSite.coordinates.lng,
          fournisseur.coordinates.lat,
          fournisseur.coordinates.lng
        );
      }
      
      return {
        ...fournisseur,
        distance,
        estimatedTime: hasCoords ? Math.round(distance * 2) : -1,
        hasCoordinates: hasCoords
      };
    });

    allSuppliers.sort((a, b) => {
      if (a.hasCoordinates && b.hasCoordinates) return a.distance - b.distance;
      if (a.hasCoordinates && !b.hasCoordinates) return -1;
      if (!a.hasCoordinates && b.hasCoordinates) return 1;
      return a.nom.localeCompare(b.nom);
    });

    setRecommendedSuppliers(allSuppliers);
  };

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
    if (km >= 9999) return "N/A";
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const handleCreateOrder = async () => {
    if (!currentSite || !selectedSupplier) {
      toast.error("Veuillez sélectionner un fournisseur");
      return;
    }

    // Validation de la quantité minimale
    if (recommendedQuantity > 0 && quantity < recommendedQuantity) {
      toast.error(
        `❌ Quantité insuffisante! Minimum recommandé: ${recommendedQuantity} unités. Vous avez saisi: ${quantity} unités.`,
        { duration: 5000 }
      );
      return;
    }

    setLoading(true);
    try {
      const orderData: CreateOrderData = {
        materialId,
        quantity,
        destinationSiteId: currentSite._id,
        supplierId: selectedSupplier._id,
        estimatedDurationMinutes: recommendedSuppliers.find(f => f._id === selectedSupplier._id)?.estimatedTime || 60,
      };

      console.log("📤 Order data:", orderData);
      
      const createdOrder = await orderService.createOrder(orderData);
      console.log("✅ Order created:", createdOrder);
      
      setCreatedOrderId(createdOrder._id);
      toast.success("✅ Commande créée avec succès!");
      onOrderCreated();
      
      setShowChat(true);
      
    } catch (error: any) {
      console.error("❌ Erreur création commande:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAll = () => {
    setShowChat(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open && !showChat} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Package className="h-5 w-5 text-blue-600" />
              Nouvelle commande
            </DialogTitle>
            <DialogDescription>
              {materialName} - Code: {materialCode}
              {materialCategory && ` • Catégorie: ${materialCategory}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {loadingData ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Chargement...</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                    <Label className="font-semibold">Chantier de livraison</Label>
                  </div>
                  {currentSite ? (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">{currentSite.nom}</span>
                      </div>
                      {currentSite.adresse && (
                        <div className="text-sm text-blue-700 mt-1">{currentSite.adresse}</div>
                      )}
                      {currentSite?.coordinates && (
                        <div className="text-xs text-green-600 mt-1">
                          📍 {currentSite.coordinates.lat.toFixed(4)}, {currentSite.coordinates.lng.toFixed(4)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-orange-50 rounded-lg text-orange-700 text-sm">
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      Aucun site assigné à ce matériau
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
                    <Label className="font-semibold">Quantité à commander</Label>
                  </div>
                  {loadingPrediction ? (
                    <div className="text-sm text-gray-500">Calcul de la quantité recommandée...</div>
                  ) : recommendedQuantity > 0 ? (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-2">
                      <div className="flex items-center gap-2 text-blue-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-semibold">Quantité recommandée par l'IA: {recommendedQuantity} unités</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        ⚠️ Vous devez commander au minimum cette quantité
                      </div>
                    </div>
                  ) : null}
                  <Input
                    type="number"
                    min={minQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || minQuantity)}
                    className={`w-full ${quantity < recommendedQuantity && recommendedQuantity > 0 ? 'border-red-500' : ''}`}
                  />
                  {quantity < recommendedQuantity && recommendedQuantity > 0 && (
                    <div className="text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Quantité insuffisante! Minimum: {recommendedQuantity} unités
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">3</div>
                    <Label className="font-semibold">Sélectionner un fournisseur</Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    <Navigation className="h-3 w-3 inline mr-1" />
                    Trié par proximité géographique
                  </p>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {recommendedSuppliers.length === 0 ? (
                      <div className="p-4 bg-yellow-50 rounded-lg text-center text-yellow-700">
                        <AlertTriangle className="h-4 w-4 inline mr-2" />
                        Aucun fournisseur trouvé
                      </div>
                    ) : (
                      recommendedSuppliers.map((fournisseur, index) => (
                        <Card
                          key={fournisseur._id}
                          className={`cursor-pointer transition-all ${
                            selectedSupplier?._id === fournisseur._id 
                              ? "border-blue-500 bg-blue-50 shadow-md" 
                              : "hover:border-gray-300 hover:shadow-sm"
                          }`}
                          onClick={() => setSelectedSupplier(fournisseur)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold">{fournisseur.nom}</span>
                                  {index === 0 && fournisseur.hasCoordinates && (
                                    <Badge className="bg-green-500 text-white text-xs">
                                      <Star className="h-3 w-3 mr-1" />
                                      Plus proche
                                    </Badge>
                                  )}
                                  {fournisseur.categories && fournisseur.categories.slice(0, 2).map((cat) => (
                                    <Badge key={cat} variant="outline" className="text-xs">
                                      {cat}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {fournisseur.adresse}, {fournisseur.ville}
                                </div>
                              </div>
                              <div className="text-right">
                                {fournisseur.hasCoordinates ? (
                                  <>
                                    <div className="text-blue-600 font-semibold text-sm">
                                      {formatDistance(fournisseur.distance)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      🚚 ~{fournisseur.estimatedTime} min
                                    </div>
                                  </>
                                ) : (
                                  <Badge variant="outline" className="text-orange-500 text-xs">
                                    Sans GPS
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {selectedSupplier?._id === fournisseur._id && (
                              <div className="mt-2 pt-2 border-t border-blue-200 flex items-center gap-1 text-blue-600 text-sm">
                                <CheckCircle className="h-4 w-4" />
                                Fournisseur sélectionné
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {selectedSupplier && currentSite && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="font-semibold text-green-800 mb-2">📋 Récapitulatif</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-gray-600">🏭 Fournisseur:</div>
                      <div className="font-medium text-gray-800">{selectedSupplier.nom}</div>
                      <div className="text-gray-600">🏗️ Chantier:</div>
                      <div className="font-medium text-gray-800">{currentSite.nom}</div>
                      {selectedSupplier.hasCoordinates && (
                        <>
                          <div className="text-gray-600">📏 Distance:</div>
                          <div className="font-medium text-gray-800">{formatDistance(recommendedSuppliers.find(f => f._id === selectedSupplier._id)?.distance || 0)}</div>
                          <div className="text-gray-600">⏱️ Durée estimée:</div>
                          <div className="font-medium text-gray-800">{recommendedSuppliers.find(f => f._id === selectedSupplier._id)?.estimatedTime || 60} minutes</div>
                        </>
                      )}
                      <div className="text-gray-600">📦 Quantité:</div>
                      <div className="font-medium text-gray-800">{quantity} {materialCategory === 'ciment' ? 'sacs' : 'unités'}</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateOrder} 
              disabled={loading || !selectedSupplier || !currentSite}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  Créer la commande
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {createdOrderId && (
        <ChatDialog
          open={showChat}
          onClose={handleCloseAll}
          orderId={createdOrderId}
          materialName={materialName}
          supplierName={selectedSupplier?.nom || "Fournisseur"}
          siteName={currentSite?.nom || "Chantier"}
          supplierCoordinates={selectedSupplier?.coordinates}
          siteCoordinates={currentSite?.coordinates}
          currentUser={currentUser}
        />
      )}
    </>
  );
}