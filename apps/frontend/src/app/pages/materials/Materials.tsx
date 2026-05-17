// frontend/src/app/pages/materials/Materials.tsx
import { 
  Package, Download, RefreshCw, Search, Edit, Trash2, Plus, Filter, Eye,
  ChevronLeft, ChevronRight, QrCode, Loader2, FileText, Upload, ScanLine,
  AlertTriangle, AlertCircle, TrendingDown, TrendingUp, Boxes, Brain, Clock,
  Wallet, CreditCard, BarChart3, Truck, MapPin, MessageCircle
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { toast } from 'sonner';
import materialService, { Material } from '../../../services/materialService';
import MaterialForm from './MaterialForm';
import MaterialDetails from './MaterialDetails';
import MaterialMLTraining from './MaterialMLTraining';
import MaterialAdvancedPrediction from './MaterialAdvancedPrediction';
import MaterialAlerts from './MaterialAlerts';
import MaterialForecast from './MaterialForecast';
import ConsumptionAnomalyAlert from './ConsumptionAnomalyAlert';
import AutoOrderDashboard from './AutoOrderDashboard';
import SiteConsumptionTracker from './SiteConsumptionTracker';
import CreateOrderDialog from './CreateOrderDialog';
import PaymentDialog from './PaymentDialog';
import SupplierRatingDialog from './SupplierRatingDialog';
import MLTrainingButton from '../../components/materials/MLTrainingButton';
import AnomalyAlert from '../../components/materials/AnomalyAlert';
import DailyReportButton from '../../components/materials/DailyReportButton';
import OrdersTrackingSidebar from '../../../components/orders/OrdersTrackingSidebar';
import ExpiringMaterials from '../../../components/ExpiringMaterials';

import { useSupplierRating } from '../../hooks/useSupplierRating';

interface StockPrediction {
  materialId: string;
  materialName: string;
  currentStock: number;
  consumptionRate: number;
  hoursToLowStock: number;
  hoursToOutOfStock: number;
  status: 'safe' | 'warning' | 'critical';
  recommendedOrderQuantity: number;
  predictionModelUsed: boolean;
  confidence: number;
  message: string;
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedMaterialForPrediction, setSelectedMaterialForPrediction] = useState<Material | null>(null);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [showQRMenu, setShowQRMenu] = useState(false);
  const [qrResult, setQrResult] = useState<{ material?: Material; text?: string; type: 'material' | 'text' | 'unknown' } | null>(null);
  const qrMenuRef = useRef<HTMLDivElement>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [materialToOrder, setMaterialToOrder] = useState<{ id: string; name: string; code: string; category: string; siteId?: string; siteName?: string; siteCoordinates?: { lat: number; lng: number } } | null>(null);
  const [dashboardStats, setDashboardStats] = useState({ totalMaterials: 0, totalQuantity: 0, lowStock: 0, outOfStock: 0, categoriesCount: 0 });
  const [alerts, setAlerts] = useState<Material[]>([]);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [predictions, setPredictions] = useState<Map<string, StockPrediction>>(new Map());
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('list');
  const [expiringCount, setExpiringCount] = useState<number>(0);
  
  // Anomaly Alert State
  const [anomalyAlerts, setAnomalyAlerts] = useState<Array<{
    id: string;
    materialId: string;
    materialName: string;
    anomalyResult: any;
    timestamp: Date;
  }>>([]);
  
  // Supplier Rating Dialog State
  const [showSupplierRatingDialog, setShowSupplierRatingDialog] = useState(false);
  const [supplierRatingData, setSupplierRatingData] = useState<{
    materialId: string;
    materialName: string;
    supplierId: string;
    supplierName: string;
    siteId: string;
    consumptionPercentage: number;
    userId: string;
    userName: string;
  } | null>(null);

  // Supplier Rating Hook
  const currentUserId = "675a123456789012345678ab"; // TODO: Get from auth context
  const currentUserName = "Manager"; // TODO: Get from auth context
  const { pendingRatings, checkAllMaterials, markAsRated, markAsIgnored } = useSupplierRating(currentUserId);

  // Close QR menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (qrMenuRef.current && !qrMenuRef.current.contains(event.target as Node)) {
        setShowQRMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load expiring materials count
  useEffect(() => {
    const loadExpiringCount = async () => {
      try {
        const expiringMaterials = await materialService.getExpiringMaterials(30);
        setExpiringCount(expiringMaterials.length);
      } catch (error) {
        console.error('Error loading expiring count:', error);
      }
    };
    loadExpiringCount();

    // 🚨 Listen for anomaly alerts via WebSocket (simulation)
    const handleAnomalyAlert = (data: any) => {
      const newAlert = {
        id: Date.now().toString(),
        materialId: data.materialId,
        materialName: data.materialName,
        anomalyResult: data.anomalyResult,
        timestamp: new Date(data.timestamp),
      };
      
      setAnomalyAlerts(prev => [...prev, newAlert]);
      
      // Toast notification
      if (data.anomalyResult.riskLevel === 'HIGH') {
        toast.error(`🚨 ${data.anomalyResult.message}`, { duration: 10000 });
      } else {
        toast.warning(`⚠️ ${data.anomalyResult.message}`, { duration: 5000 });
      }
    };

    // Simulate receiving alerts (in production, this would be via WebSocket)
    window.addEventListener('anomalyDetected', handleAnomalyAlert as any);
    
    return () => {
      window.removeEventListener('anomalyDetected', handleAnomalyAlert as any);
    };
  }, []);

  // Load materials data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let materialsData: any[] = [];
      try {
        const result = await materialService.getMaterials({ page: 1, limit: 1000 });
        if (Array.isArray(result)) {
          materialsData = result;
        } else if (result && (result as any).data) {
          materialsData = (result as any).data;
        } else {
          materialsData = result || [];
        }
      } catch (e: any) {
        console.error('getMaterials failed:', e.message);
        try {
          materialsData = await materialService.getMaterialsWithSites();
        } catch (e2: any) {
          console.error('getMaterialsWithSites failed:', e2.message);
        }
      }
      
      const safeMaterials = materialsData || [];
      setMaterials(safeMaterials);
      setPagination(prev => ({ 
        ...prev, 
        total: safeMaterials.length, 
        totalPages: Math.ceil(safeMaterials.length / prev.limit) 
      }));
      
      const uniqueCategories = [...new Set(safeMaterials.map((m: Material) => m.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      const totalQty = safeMaterials.reduce((sum: number, m: Material) => sum + (m.quantity || 0), 0);
      const lowStockItems = safeMaterials.filter((m: Material) => {
        const threshold = (m as any).stockMinimum || m.reorderPoint || m.minimumStock || 0;
        return m.quantity > 0 && m.quantity <= threshold;
      }).length;
      const outOfStockItems = safeMaterials.filter((m: Material) => !m.quantity || m.quantity === 0).length;
      
      setDashboardStats({
        totalMaterials: safeMaterials.length,
        totalQuantity: totalQty,
        lowStock: lowStockItems,
        outOfStock: outOfStockItems,
        categoriesCount: uniqueCategories.length
      });
      
      const alertMaterials = safeMaterials.filter((m: Material) => {
        const threshold = (m as any).stockMinimum || m.reorderPoint || m.minimumStock || 0;
        return !m.quantity || m.quantity === 0 || m.quantity <= threshold;
      });
      setAlerts(alertMaterials);
      
      // Reset ratings check flag only on actual reload
      
      if (outOfStockItems > 0) {
        toast.error(`${outOfStockItems} material(s) out of stock!`, { duration: 5000 });
      } else if (lowStockItems > 0) {
        toast.warning(`${lowStockItems} material(s) low stock`, { duration: 5000 });
      }
    } catch (error: any) {
      console.error('Error loading materials:', error);
      toast.error(error.message || 'Error loading materials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  // Load AI predictions
  const loadPredictions = useCallback(async () => {
    if (materials.length === 0) return;
    setLoadingPredictions(true);
    const newPredictions = new Map<string, StockPrediction>();
    try {
      // Load all predictions from the new endpoint
      const predictionsData = await materialService.getAllPredictions();
      
      if (Array.isArray(predictionsData)) {
        predictionsData.forEach((pred: any) => {
          // Convert backend format to frontend expected format
          const prediction: StockPrediction = {
            materialId: pred.materialId,
            materialName: pred.materialName,
            currentStock: pred.currentStock,
            consumptionRate: pred.consumptionRate || pred.hourlyConsumption || 0,
            hoursToLowStock: pred.hoursToLowStock || (pred.hoursRemaining ? pred.hoursRemaining * 0.7 : 999),
            hoursToOutOfStock: pred.hoursToOutOfStock || pred.hoursRemaining || 999,
            status: pred.status === 'critical' ? 'critical' : pred.status === 'warning' ? 'warning' : 'safe',
            recommendedOrderQuantity: pred.recommendedOrderQuantity || pred.currentStock * 2,
            predictionModelUsed: pred.predictionModelUsed || pred.confidence > 0.7,
            confidence: pred.confidence || 0.5,
            message: pred.message || `Out of stock in ${pred.hoursToOutOfStock || pred.hoursRemaining || 999}h`
          };
          
          newPredictions.set(pred.materialId, prediction);
          
          // Show critical alerts only on first load
          if (predictions.size === 0) {
            if (prediction.status === 'critical') {
              toast.error(`🚨 ${prediction.materialName}: Out of stock in ${Math.round(prediction.hoursToOutOfStock)}h!`, { duration: 5000 });
            } else if (prediction.status === 'warning') {
              toast.warning(`⚠️ ${prediction.materialName}: Low stock in ${Math.round(prediction.hoursToOutOfStock)}h`, { duration: 3000 });
            }
          }
        });
      }
      
      setPredictions(newPredictions);
      console.log(`✅ ${newPredictions.size} predictions loaded from FastAPI ML service`);
    } catch (err: any) {
      console.error('Error loading predictions:', err);
      // Don't show error to user if predictions fail
      // toast.error('Unable to load AI predictions');
    } finally {
      setLoadingPredictions(false);
    }
  }, [materials, predictions.size]);

  useEffect(() => { 
    if (materials.length > 0 && predictions.size === 0) {
      // Only load predictions once when materials are first loaded
      loadPredictions();
    }
    
    // Reload predictions every 5 minutes
    const predictionInterval = setInterval(() => {
      if (materials.length > 0) {
        loadPredictions();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Force re-render every minute to update hour display
    const displayInterval = setInterval(() => {
      // Decrement hours for all predictions
      setPredictions(prev => {
        const newPredictions = new Map(prev);
        for (const [id, pred] of newPredictions.entries()) {
          // Reduce by approximately 1/60 hour per minute (approximation)
          newPredictions.set(id, {
            ...pred,
            hoursToOutOfStock: Math.max(0, pred.hoursToOutOfStock - (1/60)),
            hoursToLowStock: Math.max(0, pred.hoursToLowStock - (1/60)),
          });
        }
        return newPredictions;
      });
    }, 60 * 1000); // 1 minute
    
    // Check for supplier ratings needed after 30% consumption
    // Only check ONCE when materials are first loaded
    if (materials.length > 0 && !showSupplierRatingDialog && pendingRatings.length === 0) {
      // Check only if we haven't checked yet in this session
      const sessionKey = `supplierRatingsChecked_${currentUserId}`;
      const alreadyChecked = sessionStorage.getItem(sessionKey);
      
      if (!alreadyChecked) {
        checkAllMaterials(materials).then((ratingsNeeded) => {
          if (ratingsNeeded && ratingsNeeded.length > 0) {
            // Show the first pending rating
            const firstRating = ratingsNeeded[0];
            if (firstRating.material) {
              setSupplierRatingData({
                materialId: firstRating.material._id,
                materialName: firstRating.material.name,
                supplierId: firstRating.material.supplierId || '',
                supplierName: firstRating.material.supplierName || 'Supplier',
                siteId: firstRating.material.siteId || '',
                consumptionPercentage: firstRating.consumptionPercentage,
                userId: currentUserId,
                userName: currentUserName,
              });
              setShowSupplierRatingDialog(true);
              toast.info(`🎯 Supplier rating required for ${firstRating.material.name} (${firstRating.consumptionPercentage}% consumed)`, { duration: 8000 });
            }
          }
          // Mark as checked for this session
          sessionStorage.setItem(sessionKey, 'true');
        });
      }
    }
    
    return () => {
      clearInterval(predictionInterval);
      clearInterval(displayInterval);
    };
  }, [materials.length, predictions.size, currentUserId, currentUserName, showSupplierRatingDialog, pendingRatings.length]);

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchTerm === '' || 
      material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    
    let matchesStock = true;
    if (stockFilter === 'out') {
      matchesStock = !material.quantity || material.quantity === 0;
    } else if (stockFilter === 'low') {
      const threshold = (material as any).stockMinimum || material.reorderPoint || material.minimumStock || 0;
      matchesStock = material.quantity > 0 && material.quantity <= threshold;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const paginatedMaterials = filteredMaterials.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(filteredMaterials.length / pagination.limit);
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleEdit = (material: Material) => { 
    setMaterialToEdit(material); 
    setShowForm(true); 
  };

  const handleDelete = async (id: string) => {
    try {
      await materialService.deleteMaterial(id);
      toast.success('Material deleted');
      setShowDeleteConfirm(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Deletion failed');
    }
  };

  const handleReorder = (
    materialId: string, 
    materialName: string, 
    materialCode: string, 
    materialCategory: string,
    materialSiteId?: string,
    materialSiteName?: string,
    materialSiteCoordinates?: { lat: number; lng: number }
  ) => {
    console.log('🛒 handleReorder called:', {
      materialId,
      materialName,
      materialCode,
      materialCategory,
      materialSiteId,
      materialSiteName,
      materialSiteCoordinates
    });
    
    setMaterialToOrder({ 
      id: materialId, 
      name: materialName, 
      code: materialCode, 
      category: materialCategory,
      siteId: materialSiteId,
      siteName: materialSiteName,
      siteCoordinates: materialSiteCoordinates
    });
    setShowOrderDialog(true);
    
    console.log('✅ Dialog should open now');
  };

  const handleGenerateQR = async (material: Material) => {
    try {
      const result = await materialService.generateQRCode(material._id);
      toast.success('QR generated');
      const link = document.createElement('a');
      link.href = result.qrCode;
      link.download = `qr-${material.code}.png`;
      link.click();
    } catch (error) {
      toast.error('QR generation error');
    }
  };

  // Import/Export handlers
  const handleImportExcel = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setScanLoading(true);
      try {
        const result = await materialService.importFromExcel(file);
        if (result?.success || result?.imported > 0) {
          toast.success(`Import successful! ${result.imported || 0} materials imported`);
          loadData();
        } else {
          toast.error(result?.message || 'Import failed');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || 'Import error');
      } finally {
        setScanLoading(false);
      }
    };
    input.click();
  };

  const handleExportExcel = async () => {
    try {
      const blob = await materialService.exportToExcel();
      await materialService.downloadFile(blob, `materials_${Date.now()}.xlsx`);
      toast.success('Excel export successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Excel export error');
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await materialService.exportToPDF();
      await materialService.downloadFile(blob, `materials_${Date.now()}.pdf`);
      toast.success('PDF export successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'PDF export error');
    }
  };

  // QR/Barcode scan handlers
  const handleScanQR = async () => {
    setShowQRMenu(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setScanLoading(true);
      setQrResult(null);
      try {
        const result = await materialService.scanQRCode(file);
        if (result?.success && result.material) {
          setQrResult({ material: result.material, type: 'material' });
          setSelectedMaterial(result.material);
          toast.success(`Material found: ${result.material.name}`);
        } else if (result?.qrData) {
          setQrResult({ text: result.qrData, type: 'text' });
          toast.info(`QR scanned: "${result.qrData.substring(0, 30)}..."`);
        } else {
          toast.error('QR code not recognized');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'QR code analysis error');
      } finally {
        setScanLoading(false);
      }
    };
    input.click();
  };

  const handleScanQRText = async () => {
    setShowQRMenu(false);
    const qrText = prompt('Enter QR code text:');
    if (!qrText) return;
    setScanLoading(true);
    setQrResult(null);
    try {
      const result = await materialService.scanQRCodeText(qrText);
      if (result?.success && result.material) {
        setQrResult({ material: result.material, type: 'material' });
        setSelectedMaterial(result.material);
        toast.success(`Material found: ${result.material.name}`);
      } else {
        setQrResult({ text: qrText, type: 'text' });
        toast.info(`QR: "${qrText}" - No associated material`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'QR analysis error');
    } finally {
      setScanLoading(false);
    }
  };

  const handleScanBarcode = async () => {
    const barcode = prompt('Enter barcode:');
    if (!barcode) return;
    setScanLoading(true);
    setQrResult(null);
    try {
      const material = await materialService.findByBarcode(barcode);
      setQrResult({ material, type: 'material' });
      setSelectedMaterial(material);
      toast.success(`Material found: ${material.name}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Search error');
    } finally {
      setScanLoading(false);
    }
  };

  const getStatusBadge = (material: Material) => {
    const threshold = (material as any).stockMinimum || material.reorderPoint || material.minimumStock || 0;
    
    if (material.quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (material.quantity <= threshold) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  const renderPredictionBadge = (materialId: string) => {
    const prediction = predictions.get(materialId);
    
    if (loadingPredictions && !prediction) {
      return (
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analyzing...
        </span>
      );
    }
    
    if (!prediction) {
      return <span className="text-xs text-gray-400">No prediction</span>;
    }

    // Check that hoursToOutOfStock is valid
    const hoursToOutOfStock = prediction.hoursToOutOfStock ?? 0;
    const consumptionRate = prediction.consumptionRate ?? 0;
    
    // If values are invalid, show error message
    if (!Number.isFinite(hoursToOutOfStock) || hoursToOutOfStock < 0) {
      return (
        <span className="text-xs text-orange-600">
          ⚠️ Insufficient data
        </span>
      );
    }
    
    // Calculate outage date/time
    const now = new Date();
    const outageDate = new Date(now.getTime() + hoursToOutOfStock * 60 * 60 * 1000);
    
    const formatOutageDate = () => {
      const days = Math.floor(hoursToOutOfStock / 24);
      const hours = Math.floor(hoursToOutOfStock % 24);
      
      if (hoursToOutOfStock < 24) {
        // Less than 24h: show exact time
        return `Today ${outageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (hoursToOutOfStock < 48) {
        // Between 24h and 48h: show "Tomorrow"
        return `Tomorrow ${outageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (days < 7) {
        // Less than a week: show day name
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `${dayNames[outageDate.getDay()]} ${outageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        // More than a week: show full date
        return outageDate.toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    };
    
    const getBadgeStyle = () => {
      switch (prediction.status) {
        case 'critical': return 'bg-red-100 text-red-700 border-red-300 animate-pulse';
        case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        default: return 'bg-green-100 text-green-700 border-green-300';
      }
    };
    
    const getIcon = () => {
      switch (prediction.status) {
        case 'critical': return '🚨';
        case 'warning': return '⚠️';
        default: return '✅';
      }
    };
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex flex-col gap-0.5 px-2 py-1 rounded text-xs border cursor-help ${getBadgeStyle()}`}>
              <div className="flex items-center gap-1 font-medium">
                <span>{getIcon()}</span>
                <span>{formatOutageDate()}</span>
              </div>
              <div className="text-[10px] opacity-75">
                {hoursToOutOfStock < 24 
                  ? `In ${Math.floor(hoursToOutOfStock)}h`
                  : `In ${Math.floor(hoursToOutOfStock / 24)}d ${Math.floor(hoursToOutOfStock % 24)}h`
                }
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="w-72">
            <div className="space-y-2">
              <div className="font-semibold text-base">{prediction.materialName}</div>
              <div className="border-t pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current stock:</span>
                  <span className="font-medium">{prediction.currentStock ?? 0} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consumption:</span>
                  <span className="font-medium">{consumptionRate.toFixed(2)} units/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Predicted stock (24h):</span>
                  <span className="font-medium">{Math.max(0, Math.floor((prediction.currentStock ?? 0) - consumptionRate * 24))} units</span>
                </div>
              </div>
              <div className="border-t pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected outage:</span>
                  <span className="font-medium text-red-600">
                    {outageDate.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      day: '2-digit', 
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time remaining:</span>
                  <span className="font-medium">
                    {Math.floor(hoursToOutOfStock / 24)}d {Math.floor(hoursToOutOfStock % 24)}h
                  </span>
                </div>
              </div>
              {(prediction.recommendedOrderQuantity ?? 0) > 0 && (
                <div className="border-t pt-2 bg-blue-50 -mx-2 -mb-2 px-2 py-2 rounded-b">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-700 font-medium">📦 Order:</span>
                    <span className="text-blue-900 font-bold">{Math.ceil(prediction.recommendedOrderQuantity ?? 0)} units</span>
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const handleCloseAnomalyAlert = (alertId: string) => {
    setAnomalyAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Anomaly Alerts */}
      {anomalyAlerts.map((alert) => (
        <AnomalyAlert
          key={alert.id}
          anomalyData={alert}
          onClose={() => handleCloseAnomalyAlert(alert.id)}
          onViewDetails={() => {
            // Open material details
            const material = materials.find(m => m._id === alert.materialId);
            if (material) {
              setSelectedMaterial(material);
            }
          }}
        />
      ))}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materials Management</h1>
          <p className="text-gray-500 mt-1">Real-time tracking, management and AI prediction</p>
        </div>
        <div className="flex gap-2">
          <OrdersTrackingSidebar className="mr-2" />
          <DailyReportButton />
          <Button variant="outline" onClick={handleImportExcel} disabled={scanLoading} title="Import Excel">
            {scanLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Import
          </Button>
          <Button variant="outline" onClick={handleExportExcel} title="Export Excel">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF} title="Export PDF">
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <div className="relative" ref={qrMenuRef}>
            <Button 
              variant="outline" 
              onClick={() => setShowQRMenu(!showQRMenu)} 
              disabled={scanLoading} 
              title="Scan QR/Barcode"
            >
              {scanLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ScanLine className="h-4 w-4 mr-2" />}
              Scan
            </Button>
            {showQRMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border">
                <button 
                  onClick={handleScanQR} 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Scan QR (image)
                </button>
                <button 
                  onClick={handleScanQRText} 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Scan QR (text)
                </button>
                <button 
                  onClick={handleScanBarcode} 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Scan Barcode
                </button>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => { setMaterialToEdit(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className={dashboardStats.outOfStock > 0 ? 'border-red-500 border-2' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Materials</p>
                <p className="text-2xl font-bold">{dashboardStats.totalMaterials}</p>
              </div>
              <Boxes className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Quantity</p>
                <p className="text-2xl font-bold">{dashboardStats.totalQuantity.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className={dashboardStats.lowStock > 0 ? 'border-yellow-500 border-2' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboardStats.lowStock}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className={dashboardStats.outOfStock > 0 ? 'border-red-500 border-2' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{dashboardStats.outOfStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Categories</p>
                <p className="text-2xl font-bold">{dashboardStats.categoriesCount}</p>
              </div>
              <Filter className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <span>📦</span>
            Materials
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <span>🔔</span>
            Alerts
            {alerts.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {alerts.length > 99 ? '99+' : alerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <span>⏰</span>
            Expiring
            {expiringCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                {expiringCount > 99 ? '99+' : expiringCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="auto-order" className="flex items-center gap-2">
            <span>🚚</span>
            Auto Orders
          </TabsTrigger>
          <TabsTrigger  value="consumption" className="flex items-center gap-2">
            <span>📊</span>
            Consumption
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center gap-2">
            <span>⚠️</span>
            Anomalies
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <span>📈</span>
            Forecast
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Materials List */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Materials List</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)}>
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>
              
              {filterOpen && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Category</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md mt-1" 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">All</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Per page</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md mt-1" 
                      value={pagination.limit} 
                      onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={loadData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  {alerts.length > 0 && (
                    <div className="col-span-3 flex items-center gap-2 mt-2 pt-2 border-t">
                      <Button 
                        variant={stockFilter === 'all' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setStockFilter('all')}
                      >
                        All ({materials.length})
                      </Button>
                      <Button 
                        variant={stockFilter === 'low' ? 'default' : 'outline'} 
                        size="sm" 
                        className={stockFilter === 'low' ? 'bg-yellow-500 hover:bg-yellow-600' : ''} 
                        onClick={() => setStockFilter('low')}
                      >
                        Low Stock ({dashboardStats.lowStock})
                      </Button>
                      <Button 
                        variant={stockFilter === 'out' ? 'default' : 'outline'} 
                        size="sm" 
                        className={stockFilter === 'out' ? 'bg-red-500 hover:bg-red-600' : ''} 
                        onClick={() => setStockFilter('out')}
                      >
                        Out of Stock ({dashboardStats.outOfStock})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2 text-gray-500">Loading...</p>
                </div>
              ) : paginatedMaterials.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No materials found</p>
                  <Button variant="outline" className="mt-4" onClick={() => { setMaterialToEdit(null); setShowForm(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add a material
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedMaterials.map((material) => (
                      <div key={material._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{material.name}</h3>
                            <span className="text-sm text-gray-500">({material.code})</span>
                            {getStatusBadge(material)}
                          </div>
                          <div className="grid grid-cols-7 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-gray-500">Qty:</span> 
                              <span className="font-medium ml-1">{material.quantity} {material.unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Min:</span> 
                              <span className="font-medium ml-1">{material.minimumStock}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Max:</span> 
                              <span className="font-medium ml-1">{material.maximumStock}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Site:</span> 
                              <span className="font-medium ml-1">{material.siteName || 'Unassigned'}</span>
                              {material.siteAddress && (
                                <div className="text-xs text-gray-400 mt-0.5">{material.siteAddress}</div>
                              )}
                              {material.siteCoordinates && (
                                <div className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  GPS: {material.siteCoordinates.lat.toFixed(4)}, {material.siteCoordinates.lng.toFixed(4)}
                                </div>
                              )}
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Expected outage:</span>
                              <div className="mt-1">{renderPredictionBadge(material._id)}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedMaterial(material)} title="Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(material)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {showDeleteConfirm === material._id ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(material._id)} className="h-8 px-2">
                                Yes
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(null)} className="h-8 px-2">
                                No
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 text-red-600" 
                              onClick={() => setShowDeleteConfirm(material._id)} 
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Order Button - Red if out of stock, Yellow if low stock */}
                          {(() => {
                            const threshold = (material as any).stockMinimum || material.reorderPoint || material.minimumStock || 0;
                            return (material.quantity === 0 || material.quantity <= threshold) && (
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className={`${
                                material.quantity === 0 
                                  ? 'bg-red-500 hover:bg-red-600' 
                                  : 'bg-yellow-500 hover:bg-yellow-600'
                              } text-white flex items-center gap-1`}
                              onClick={() => handleReorder(
                                material._id, 
                                material.name, 
                                material.code, 
                                material.category, 
                                material.siteId, 
                                material.siteName, 
                                material.siteCoordinates
                              )}
                              title={material.quantity === 0 ? 'Out of stock - Order urgently' : 'Low stock - Order'}
                            >
                              {material.quantity === 0 ? (
                                <>
                                  <AlertTriangle className="h-3 w-3" />
                                  Urgent
                                </>
                              ) : (
                                <>
                                  <Truck className="h-3 w-3" />
                                  Order
                                </>
                              )}
                            </Button>
                            );
                          })()}
                          <Button size="sm" variant="outline" onClick={() => handleGenerateQR(material)} title="Generate QR">
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {Math.ceil(filteredMaterials.length / pagination.limit) > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePageChange(pagination.page - 1)} 
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: Math.min(5, Math.ceil(filteredMaterials.length / pagination.limit)) }, (_, i) => {
                        const totalPages = Math.ceil(filteredMaterials.length / pagination.limit);
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <Button 
                            key={pageNum} 
                            variant={pagination.page === pageNum ? "default" : "outline"} 
                            size="sm" 
                            onClick={() => handlePageChange(pageNum)} 
                            className="min-w-[32px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePageChange(pagination.page + 1)} 
                        disabled={pagination.page >= Math.ceil(filteredMaterials.length / pagination.limit)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Alerts — includes stock banner + MaterialAlerts */}
        <TabsContent value="alerts">
          <div className="space-y-4">
            {/* Stock Alerts Banner — moved here from top */}
            {alerts.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🚨</span>
                  <span className="font-semibold text-red-700 text-base">
                    Stock Alerts ({alerts.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                  {alerts.map(alert => (
                    <div
                      key={alert._id}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                        !alert.quantity || alert.quantity === 0
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{!alert.quantity || alert.quantity === 0 ? '❌' : '⚡'}</span>
                        <span className="font-medium">{alert.name}</span>
                        <span className="text-xs opacity-70">({alert.code})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          {alert.quantity || 0} {alert.unit}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs border-current hover:opacity-80"
                          onClick={() => handleReorder(
                            alert._id,
                            alert.name,
                            alert.code,
                            alert.category,
                            alert.siteId,
                            alert.siteName,
                            alert.siteCoordinates
                          )}
                        >
                          🛒 Order
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-red-200 text-xs text-red-600">
                  <span>
                    ❌ <strong>{dashboardStats.outOfStock}</strong> out of stock
                  </span>
                  <span>
                    ⚡ <strong>{dashboardStats.lowStock}</strong> low stock
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto h-6 px-3 text-xs text-red-700 border-red-300 hover:bg-red-100"
                    onClick={loadData}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>
            )}

            {alerts.length === 0 && (
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-green-700">All stocks are in order</p>
                  <p className="text-sm text-green-600">No materials out of stock or low stock.</p>
                </div>
              </div>
            )}

            {/* MaterialAlerts component */}
            <MaterialAlerts alerts={alerts} onRefresh={loadData} />
          </div>
        </TabsContent>

        {/* Tab 2.5: Expiring Materials */}
        <TabsContent value="expiring">
          <ExpiringMaterials />
        </TabsContent>

        {/* Tab 3: Auto Orders */}
        <TabsContent value="auto-order">
          <AutoOrderDashboard onRefresh={loadData} />
        </TabsContent>

        {/* Tab 4: Consumption Tracking */}
        <TabsContent value="consumption">
          <SiteConsumptionTracker onClose={() => setActiveTab('list')} />
        </TabsContent>

        {/* Tab 5: Consumption Anomalies */}
        <TabsContent value="anomalies">
          <ConsumptionAnomalyAlert onAnomalyDetected={(anomaly) => {
            toast.error(`🚨 ${anomaly.message}`, { duration: 10000 });
          }} />
        </TabsContent>

        {/* Tab 6: Forecast */}
        <TabsContent value="forecast">
          <MaterialForecast materials={materials} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showForm && (
        <MaterialForm
          open={showForm}
          onClose={() => { setShowForm(false); setMaterialToEdit(null); }}
          onSuccess={() => { 
            setShowForm(false); 
            setMaterialToEdit(null); 
            loadData(); 
            toast.success(materialToEdit ? 'Material modified!' : 'Material added!'); 
          }}
          initialData={materialToEdit}
        />
      )}

      {selectedMaterial && (
        <MaterialDetails 
          material={selectedMaterial} 
          onClose={() => setSelectedMaterial(null)} 
          onUpdate={loadData}
          onOrder={handleReorder}
        />
      )}

      {selectedMaterialForPrediction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center bg-purple-50">
              <h2 className="font-bold text-lg text-purple-700">AI Prediction - {selectedMaterialForPrediction.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMaterialForPrediction(null)}>
                ✕
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <MaterialMLTraining
                materialId={selectedMaterialForPrediction._id}
                materialName={selectedMaterialForPrediction.name}
                currentStock={selectedMaterialForPrediction.quantity}
                reorderPoint={selectedMaterialForPrediction.reorderPoint}
              />
              <MaterialAdvancedPrediction
                materialId={selectedMaterialForPrediction._id}
                materialName={selectedMaterialForPrediction.name}
              />
            </div>
          </div>
        </div>
      )}

      {showOrderDialog && materialToOrder && (
        <CreateOrderDialog
          open={showOrderDialog}
          onClose={() => { setShowOrderDialog(false); setMaterialToOrder(null); }}
          materialId={materialToOrder.id}
          materialName={materialToOrder.name}
          materialCode={materialToOrder.code}
          materialCategory={materialToOrder.category}
          materialSiteId={materialToOrder.siteId}
          materialSiteName={materialToOrder.siteName}
          materialSiteCoordinates={materialToOrder.siteCoordinates}
          onOrderCreated={() => {
            loadData();
            toast.success('Order created! Click "Start delivery" to track the truck');
          }}
        />
      )}

      {/* Supplier Rating Dialog */}
      {showSupplierRatingDialog && supplierRatingData && (
        <SupplierRatingDialog
          open={showSupplierRatingDialog}
          onClose={() => {
            // Fermer et marquer comme ignoré pour ne plus afficher
            if (supplierRatingData.materialId) {
              markAsIgnored(supplierRatingData.materialId);
            }
            setShowSupplierRatingDialog(false);
            setSupplierRatingData(null);
          }}
          onIgnore={() => {
            // Marquer comme ignoré définitivement
            if (supplierRatingData.materialId) {
              markAsIgnored(supplierRatingData.materialId);
              toast.info(`📝 Rating ignored for ${supplierRatingData.materialName}. Won't show again.`);
            }
            setShowSupplierRatingDialog(false);
            setSupplierRatingData(null);
          }}
          materialId={supplierRatingData.materialId}
          materialName={supplierRatingData.materialName}
          supplierId={supplierRatingData.supplierId}
          supplierName={supplierRatingData.supplierName}
          siteId={supplierRatingData.siteId}
          consumptionPercentage={supplierRatingData.consumptionPercentage}
          userId={supplierRatingData.userId}
          userName={supplierRatingData.userName}
        />
      )}
    </div>
  );
}