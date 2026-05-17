import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Package, AlertTriangle, AlertCircle } from 'lucide-react';
import materialService, { Material, CreateMaterialData } from '../../../services/materialService';
import materialFlowService, { FlowType } from '../../../services/materialFlowService';
import anomalyDetectionService from '../../../services/anomalyDetectionService';
import { siteService, fournisseurService, Site, Fournisseur } from '../../../services/siteFournisseurService';

interface FormErrors {
  name?: string;
  code?: string;
  category?: string;
  unit?: string;
  stockExistant?: string;
  stockMinimum?: string;
  stockEntree?: string;
  stockSortie?: string;
  siteId?: string;
}

interface MaterialFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Material | null;
}

export default function MaterialForm({ open, onClose, onSuccess, initialData }: MaterialFormProps) {
  const [formData, setFormData] = useState<CreateMaterialData>({
    name: '',
    code: '',
    category: '',
    unit: '',
    quantity: 0,
    minimumStock: 10,
    maximumStock: 100,
    reorderPoint: 20,
    location: '',
    manufacturer: '',
    expiryDate: '',
  });

  // New V2 fields
  const [existingStock, setExistingStock] = useState<number>(0);
  const [minimumStock, setMinimumStock] = useState<number>(10);
  const [stockIn, setStockIn] = useState<number>(0);
  const [stockOut, setStockOut] = useState<number>(0);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);

  const categories = [
    'concrete', 'iron', 'steel', 'electricity', 'plumbing', 
    'wood', 'sand', 'gravel', 'cement', 'brick', 
    'tile', 'paint', 'insulation', 'roofing', 'other'
  ];

  const units = ['kg', 'm³', 'm²', 'ml', 'pieces', 'tons', 'bag', 'other'];

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') return 'Name is required';
        if (value.trim().length < 2) return 'Name must contain at least 2 characters';
        if (value.trim().length > 100) return 'Name cannot exceed 100 characters';
        break;
      case 'code':
        if (!value || value.trim() === '') return 'Code is required';
        if (!/^[A-Za-z0-9-_]+$/.test(value)) return 'Code can only contain letters, numbers, hyphens and underscores';
        break;
      case 'category':
        if (!value || value === '') return 'Category is required';
        break;
      case 'unit':
        if (!value || value === '') return 'Unit is required';
        break;
      case 'quantity':
        if (value === undefined || value === null || value === '') return 'Quantity is required';
        if (Number.isNaN(Number(value))) return 'Quantity must be a number';
        if (Number(value) < 0) return 'Quantity cannot be negative';
        if (Number(value) > 1000000) return 'Maximum quantity is 1,000,000';
        break;
      case 'minimumStock':
        if (value === undefined || value === null || value === '') return 'Minimum stock is required';
        if (Number.isNaN(Number(value))) return 'Must be a number';
        if (Number(value) < 0) return 'Cannot be negative';
        if (Number(value) > 1000000) return 'Maximum value: 1,000,000';
        break;
      case 'maximumStock':
        if (value === undefined || value === null || value === '') return 'Maximum stock is required';
        if (Number.isNaN(Number(value))) return 'Must be a number';
        if (Number(value) < 0) return 'Cannot be negative';
        if (Number(value) > 1000000) return 'Maximum value: 1,000,000';
        if (formData.minimumStock && Number(value) < formData.minimumStock) {
          return 'Must be greater than or equal to minimum stock';
        }
        break;
      case 'reorderPoint':
        if (value === undefined || value === null || value === '') return 'Reorder point is required';
        if (Number.isNaN(Number(value))) return 'Must be a number';
        if (Number(value) < 0) return 'Cannot be negative';
        if (Number(value) > 1000000) return 'Maximum value: 1,000,000';
        if (formData.minimumStock && Number(value) > formData.minimumStock) {
          return 'Cannot exceed minimum stock';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate only required fields for the new V2 form
    const requiredFields = ['name', 'code', 'category', 'unit'];
    
    requiredFields.forEach(key => {
      const error = validateField(key, formData[key as keyof CreateMaterialData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    // Validate site for new materials
    if (!initialData && !selectedSiteId) {
      newErrors.siteId = 'Site is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field as keyof CreateMaterialData]);
    if (error) {
      setErrors({ ...errors, [field]: error });
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    // Reset form state when opening/closing
    if (!open) {
      setErrors({});
      setTouched({});
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        category: initialData.category || '',
        unit: initialData.unit || '',
        quantity: initialData.quantity || 0,
        minimumStock: initialData.minimumStock || 10,
        maximumStock: initialData.maximumStock || 100,
        reorderPoint: initialData.reorderPoint || 20,
        location: initialData.location || '',
        manufacturer: initialData.manufacturer || '',
        expiryDate: initialData.expiryDate ? initialData.expiryDate.split('T')[0] : '',
      });
      
      // Initialize new V2 fields
      setExistingStock((initialData as any).stockExistant || initialData.quantity || 0);
      setMinimumStock((initialData as any).stockMinimum || initialData.minimumStock || 10);
      setStockIn((initialData as any).stockEntree || 0);
      setStockOut((initialData as any).stockSortie || 0);
      
      // Handle siteId - could be string or object
      const getSiteId = (sid: any): string => {
        if (!sid) return '';
        if (typeof sid === 'string') return sid;
        if (sid && typeof sid === 'object' && sid._id) return sid._id;
        if (sid && typeof sid === 'object' && sid.toString) return sid.toString();
        return '';
      };
      
      // Set the site from the material
      const materialSiteId = getSiteId(initialData.siteId);
      if (materialSiteId) {
        setSelectedSiteId(materialSiteId);
        console.log('🎯 Material siteId set to:', materialSiteId);
      } else {
        // No site assigned yet - allow selection
        setSelectedSiteId('');
      }
    } else {
      // Reset for new material - site is required
      setFormData({
        name: '',
        code: '',
        category: '',
        unit: '',
        quantity: 0,
        minimumStock: 10,
        maximumStock: 100,
        reorderPoint: 20,
        location: '',
        manufacturer: '',
        expiryDate: '',
      });
      setExistingStock(0);
      setMinimumStock(10);
      setStockIn(0);
      setStockOut(0);
      setSelectedSiteId('');
    }
  }, [initialData, sites]);

  const loadSites = async () => {
    setLoadingSites(true);
    try {
      console.log('🔍 Loading sites from API...');
      const sitesData = await siteService.getSites();
      console.log('📍 Sites loaded:', sitesData.length, sitesData);
      console.log('📍 First few sites:', sitesData.slice(0, 3).map(s => ({ id: s._id, name: s.nom })));
      setSites(sitesData);
    } catch (error: any) {
      console.error('❌ Error loading sites:', error.message, error.response?.data);
    } finally {
      setLoadingSites(false);
    }
  };

  const getStockStatus = () => {
    const currentStock = existingStock + stockIn - stockOut;
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock < minimumStock) return 'low_stock';
    return 'in_stock';
  };

  const getStockStatusLabel = () => {
    const status = getStockStatus();
    const currentStock = existingStock + stockIn - stockOut;
    switch (status) {
      case 'out_of_stock':
        return <Badge className="bg-red-500">Out of Stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-500">⚠️ Order ({currentStock} {'<'} {minimumStock})</Badge>;
      default:
        return <Badge className="bg-green-500">✅ In Stock ({currentStock} units)</Badge>;
    }
  };

  const calculateCurrentStock = () => {
    return existingStock + stockIn - stockOut;
  };

  const calculateQuantityToOrder = () => {
    const currentStock = calculateCurrentStock();
    if (currentStock >= minimumStock) return 0;
    return Math.ceil((minimumStock - currentStock) * 1.2); // +20% safety margin
  };

  const needsReorder = () => {
    return calculateCurrentStock() < minimumStock;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    if (!initialData) {
      allTouched['siteId'] = true;
    }
    setTouched(allTouched);
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please correct errors before submitting');
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      // Calculate current stock
      const currentStock = existingStock + stockIn - stockOut;

      // 🚨 ANOMALY DETECTION - If there is stock output (consumption)
      if (stockOut > 0) {
        try {
          console.log('🚨 Detecting anomaly for consumption:', stockOut, 'of material:', formData.name);
          
          // Use anomaly detection service to detect suspicious patterns
          const anomalyResult = await anomalyDetectionService.processAnomalyDetection(
            initialData?._id || 'new-material',
            formData.name,
            stockOut,
            false // Use simulation for now
          );

          console.log('🔍 Anomaly detection result:', anomalyResult);

          // If anomaly is detected, show alert
          if (anomalyResult.isAnomaly) {
            // Emit anomaly event for display
            const anomalyEvent = new CustomEvent('anomalyDetected', {
              detail: {
                materialId: initialData?._id || 'new-material',
                materialName: formData.name,
                anomalyResult,
                timestamp: new Date(),
              }
            });
            window.dispatchEvent(anomalyEvent);

            // Show alert toast
            if (anomalyResult.riskLevel === 'HIGH') {
              toast.error(`🚨 ${anomalyResult.message}`, {
                duration: 10000,
                description: anomalyResult.recommendedAction
              });
            } else if (anomalyResult.riskLevel === 'MEDIUM') {
              toast.warning(`⚠️ ${anomalyResult.message}`, {
                duration: 8000,
                description: anomalyResult.recommendedAction
              });
            }
          }
        } catch (anomalyError) {
          console.error('❌ Anomaly detection failed:', anomalyError);
          // Don't block submission if anomaly detection fails
        }
      }
      
      if (initialData && initialData._id) {
        console.log('Updating material:', initialData._id, formData);
        
        // Only include fields that have values and are valid for update
        const updateData: any = {};
        
        if (formData.name) updateData.name = formData.name;
        if (formData.code) updateData.code = formData.code;
        if (formData.category) updateData.category = formData.category;
        if (formData.unit) updateData.unit = formData.unit;
        
        // New V2 fields
        updateData.stockExistant = existingStock;
        updateData.stockMinimum = minimumStock;
        updateData.stockEntree = stockIn;
        updateData.stockSortie = stockOut;
        updateData.stockActuel = currentStock;
        updateData.quantity = currentStock; // Keep quantity synchronized
        updateData.needsReorder = currentStock < minimumStock;
        
        if (formData.expiryDate) updateData.expiryDate = formData.expiryDate;
        
        // Include siteId if changed - use assign endpoint
        const siteChanged = selectedSiteId && selectedSiteId !== initialData?.siteId;
        if (siteChanged) {
          console.log('🔄 Site changed from', initialData?.siteId, 'to', selectedSiteId);
          try {
            await materialService.assignMaterialToSite(initialData._id, selectedSiteId);
            console.log('✅ Site assignment successful');
          } catch (error) {
            console.error('❌ Error assigning site:', error);
            toast.error('Error changing site');
          }
        }
        
        console.log('Update data to send:', updateData);
        
        // Allow update even if only site changed
        if (Object.keys(updateData).length === 0 && !siteChanged) {
          toast.error('No data to update');
          setLoading(false);
          return;
        }
        
        await materialService.updateMaterial(initialData._id, updateData);
        toast.success('Material updated successfully!');
      } else {
        if (!selectedSiteId) {
          toast.error('Please select a site');
          setLoading(false);
          return;
        }
        
        // Create new material with new V2 fields
        const createData: any = {
          ...formData,
          stockExistant: existingStock,
          stockMinimum: minimumStock,
          stockEntree: stockIn,
          stockSortie: stockOut,
          stockActuel: currentStock,
          quantity: currentStock,
          needsReorder: currentStock < minimumStock,
        };
        
        console.log('Creating material with site:', createData, selectedSiteId);
        await materialService.createMaterialWithSite(createData, selectedSiteId);
        toast.success('Material added successfully!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Complete error:', error);
      console.error('Error response data:', error.response?.data);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Operation failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Material' : 'Add Material'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Modify the information below.' 
              : 'Fill in the material details and associate it with a site.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Site / Location {initialData ? '' : '*'}
              </Label>
              {loadingSites ? (
                <p className="text-sm text-gray-500">Loading sites...</p>
              ) : sites.length === 0 ? (
                <p className="text-sm text-red-500">No sites found. Please create a site first.</p>
              ) : (
                <>
                  <select
                    className={`w-full px-3 py-2 border rounded-md ${errors.siteId && touched.siteId ? 'border-red-500' : ''}`}
                    value={selectedSiteId}
                    onChange={(e) => {
                      setSelectedSiteId(e.target.value);
                      if (errors.siteId) setErrors({ ...errors, siteId: undefined });
                    }}
                    required={!initialData}
                  >
                    <option value="">Select a site...</option>
                    {sites.map((site) => (
                      <option key={site._id} value={site._id}>
                        {site.nom} - {site.adresse}
                      </option>
                    ))}
                  </select>
                  {errors.siteId && touched.siteId && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.siteId}
                    </p>
                  )}
                </>
              )}
              {selectedSiteId && (() => {
                const selectedSite = sites.find(s => s._id === selectedSiteId);
                return selectedSite ? (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900">{selectedSite.nom}</p>
                        <p className="text-sm text-gray-700">{selectedSite.adresse}</p>
                        {selectedSite.ville && (
                          <p className="text-sm text-gray-600">
                            {selectedSite.ville} {selectedSite.codePostal}
                          </p>
                        )}
                        {selectedSite.coordonnees?.latitude && selectedSite.coordonnees?.longitude && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs font-mono text-blue-600 bg-white px-2 py-0.5 rounded">
                              📍 GPS: {selectedSite.coordonnees.latitude.toFixed(5)}, {selectedSite.coordonnees.longitude.toFixed(5)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
              {initialData && initialData.siteName && !selectedSiteId && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Current site: {initialData.siteName}</p>
                      {(initialData as any).siteAddress && (
                        <p className="text-sm text-gray-600">{(initialData as any).siteAddress}</p>
                      )}
                      {initialData.siteCoordinates && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs font-mono text-gray-600 bg-white px-2 py-0.5 rounded border">
                            📍 GPS: {initialData.siteCoordinates.lat.toFixed(5)}, {initialData.siteCoordinates.lng.toFixed(5)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={errors.name && touched.name ? 'border-red-500' : ''}
                />
                {errors.name && touched.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('code')}
                  className={errors.code && touched.code ? 'border-red-500' : ''}
                />
                {errors.code && touched.code && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.code}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className={`w-full px-3 py-2 border rounded-md ${errors.category && touched.category ? 'border-red-500' : ''}`}
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  onBlur={() => handleBlur('category')}
                >
                  <option value="">Select...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && touched.category && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.category}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <select
                  id="unit"
                  className={`w-full px-3 py-2 border rounded-md ${errors.unit && touched.unit ? 'border-red-500' : ''}`}
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  onBlur={() => handleBlur('unit')}
                >
                  <option value="">Select...</option>
                  {units.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {errors.unit && touched.unit && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.unit}
                  </p>
                )}
              </div>
            </div>

            {/* ========== STOCK MANAGEMENT V2 ========== */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Management
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="existingStock">Existing Stock *</Label>
                  <Input
                    id="existingStock"
                    type="number"
                    min="0"
                    value={existingStock}
                    onChange={(e) => setExistingStock(parseInt(e.target.value) || 0)}
                    placeholder="Quantity already present"
                  />
                  <p className="text-xs text-gray-500">Quantity already on site</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Minimum Stock *</Label>
                  <Input
                    id="minimumStock"
                    type="number"
                    min="0"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(parseInt(e.target.value) || 0)}
                    placeholder="Minimum threshold"
                  />
                  <p className="text-xs text-gray-500">Reorder threshold</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-2 font-medium">Movements (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stockIn">Stock In</Label>
                    <Input
                      id="stockIn"
                      type="number"
                      min="0"
                      value={stockIn}
                      onChange={(e) => setStockIn(parseInt(e.target.value) || 0)}
                      placeholder="Quantity added"
                    />
                    <p className="text-xs text-gray-500">Quantity added to stock</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stockOut">Stock Out</Label>
                    <Input
                      id="stockOut"
                      type="number"
                      min="0"
                      value={stockOut}
                      onChange={(e) => setStockOut(parseInt(e.target.value) || 0)}
                      placeholder="Quantity removed"
                    />
                    <p className="text-xs text-gray-500">Quantity consumed</p>
                  </div>
                </div>
              </div>

              {/* Automatic Calculation */}
              <div className="p-3 bg-white border-2 border-blue-300 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📊 Automatic Calculation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Stock:</span>
                    <span className="font-bold text-blue-700">{calculateCurrentStock()} {formData.unit || 'units'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span>{getStockStatusLabel()}</span>
                  </div>
                  {needsReorder() && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">To order:</span>
                      <span className="font-bold text-orange-600">{calculateQuantityToOrder()} {formData.unit || 'units'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {needsReorder() && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">Stock Alert</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  This material requires an order of {calculateQuantityToOrder()} {formData.unit || 'units'} (+20% safety margin).
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}