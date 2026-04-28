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

  // Nouveaux champs V2
  const [stockExistant, setStockExistant] = useState<number>(0);
  const [stockMinimum, setStockMinimum] = useState<number>(10);
  const [stockEntree, setStockEntree] = useState<number>(0);
  const [stockSortie, setStockSortie] = useState<number>(0);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);

  const categories = [
    'béton', 'fer', 'acier', 'électricité', 'plomberie', 
    'bois', 'sable', 'gravier', 'ciment', 'brique', 
    'carrelage', 'peinture', 'isolation', 'toiture', 'autre'
  ];

  const units = ['kg', 'm³', 'm²', 'ml', 'pièces', 'tonnes', 'sac', 'autre'];

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') return 'Le nom est obligatoire';
        if (value.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
        if (value.trim().length > 100) return 'Le nom ne peut pas dépasser 100 caractères';
        break;
      case 'code':
        if (!value || value.trim() === '') return 'Le code est obligatoire';
        if (!/^[A-Za-z0-9-_]+$/.test(value)) return 'Le code ne peut contenir que des lettres, chiffres, tirets et underscores';
        break;
      case 'category':
        if (!value || value === '') return 'La catégorie est obligatoire';
        break;
      case 'unit':
        if (!value || value === '') return 'L\'unité est obligatoire';
        break;
      case 'quantity':
        if (value === undefined || value === null || value === '') return 'La quantité est obligatoire';
        if (isNaN(Number(value))) return 'La quantité doit être un nombre';
        if (Number(value) < 0) return 'La quantité ne peut pas être négative';
        if (Number(value) > 1000000) return 'La quantité maximale est 1 000 000';
        break;
      case 'minimumStock':
        if (value === undefined || value === null || value === '') return 'Le stock minimum est obligatoire';
        if (isNaN(Number(value))) return 'Doit être un nombre';
        if (Number(value) < 0) return 'Ne peut pas être négatif';
        if (Number(value) > 1000000) return 'Valeur maximale: 1 000 000';
        break;
      case 'maximumStock':
        if (value === undefined || value === null || value === '') return 'Le stock maximum est obligatoire';
        if (isNaN(Number(value))) return 'Doit être un nombre';
        if (Number(value) < 0) return 'Ne peut pas être négatif';
        if (Number(value) > 1000000) return 'Valeur maximale: 1 000 000';
        if (formData.minimumStock && Number(value) < formData.minimumStock) {
          return 'Doit être supérieur ou égal au stock minimum';
        }
        break;
      case 'reorderPoint':
        if (value === undefined || value === null || value === '') return 'Le point de commande est obligatoire';
        if (isNaN(Number(value))) return 'Doit être un nombre';
        if (Number(value) < 0) return 'Ne peut pas être négatif';
        if (Number(value) > 1000000) return 'Valeur maximale: 1 000 000';
        if (formData.minimumStock && Number(value) > formData.minimumStock) {
          return 'Ne doit pas dépasser le stock minimum';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Valider seulement les champs obligatoires du nouveau formulaire V2
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
      newErrors.siteId = 'Le chantier est obligatoire';
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
      
      // Initialiser les nouveaux champs V2
      setStockExistant((initialData as any).stockExistant || initialData.quantity || 0);
      setStockMinimum((initialData as any).stockMinimum || initialData.minimumStock || 10);
      setStockEntree((initialData as any).stockEntree || 0);
      setStockSortie((initialData as any).stockSortie || 0);
      
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
      setStockExistant(0);
      setStockMinimum(10);
      setStockEntree(0);
      setStockSortie(0);
      setSelectedSiteId('');
    }
  }, [initialData, sites]);

  const loadSites = async () => {
    setLoadingSites(true);
    try {
      console.log('🔍 Loading sites from API...');
      const sitesData = await siteService.getSites();
      console.log('📍 Sites loaded:', sitesData.length, sitesData);
      console.log('📍 First few sites:', sitesData.slice(0, 3).map(s => ({ id: s._id, nom: s.nom })));
      setSites(sitesData);
    } catch (error: any) {
      console.error('❌ Erreur chargement sites:', error.message, error.response?.data);
    } finally {
      setLoadingSites(false);
    }
  };

  const getStockStatus = () => {
    const stockActuel = stockExistant + stockEntree - stockSortie;
    if (stockActuel === 0) return 'out_of_stock';
    if (stockActuel < stockMinimum) return 'low_stock';
    return 'in_stock';
  };

  const getStockStatusLabel = () => {
    const status = getStockStatus();
    const stockActuel = stockExistant + stockEntree - stockSortie;
    switch (status) {
      case 'out_of_stock':
        return <Badge className="bg-red-500">Rupture de stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-500">⚠️ Commander ({stockActuel} {'<'} {stockMinimum})</Badge>;
      default:
        return <Badge className="bg-green-500">✅ En stock ({stockActuel} unités)</Badge>;
    }
  };

  const calculateStockActuel = () => {
    return stockExistant + stockEntree - stockSortie;
  };

  const calculateQuantiteACommander = () => {
    const stockActuel = calculateStockActuel();
    if (stockActuel >= stockMinimum) return 0;
    return Math.ceil((stockMinimum - stockActuel) * 1.2); // +20% de marge
  };

  const doitCommander = () => {
    return calculateStockActuel() < stockMinimum;
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
      toast.error('Veuillez corriger les erreurs avant de soumettre');
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      // Calculer le stock actuel
      const stockActuel = stockExistant + stockEntree - stockSortie;

      // 🚨 DÉTECTION D'ANOMALIE - Si il y a une sortie de stock (consommation)
      if (stockSortie > 0) {
        try {
          console.log('🚨 Detecting anomaly for consumption:', stockSortie, 'of material:', formData.name);
          
          // Utiliser le service d'anomalie pour détecter les patterns suspects
          const anomalyResult = await anomalyDetectionService.processAnomalyDetection(
            initialData?._id || 'new-material',
            formData.name,
            stockSortie,
            false // Utiliser la simulation pour l'instant
          );

          console.log('🔍 Anomaly detection result:', anomalyResult);

          // Si une anomalie est détectée, afficher l'alerte
          if (anomalyResult.isAnomaly) {
            // Émettre l'événement d'anomalie pour l'affichage
            const anomalyEvent = new CustomEvent('anomalyDetected', {
              detail: {
                materialId: initialData?._id || 'new-material',
                materialName: formData.name,
                anomalyResult,
                timestamp: new Date(),
              }
            });
            window.dispatchEvent(anomalyEvent);

            // Afficher un toast d'alerte
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
          // Ne pas bloquer la soumission si la détection d'anomalie échoue
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
        
        // Nouveaux champs V2
        updateData.stockExistant = stockExistant;
        updateData.stockMinimum = stockMinimum;
        updateData.stockEntree = stockEntree;
        updateData.stockSortie = stockSortie;
        updateData.stockActuel = stockActuel;
        updateData.quantity = stockActuel; // Garder quantity synchronisé
        updateData.needsReorder = stockActuel < stockMinimum;
        
        if (formData.expiryDate) updateData.expiryDate = formData.expiryDate;
        
        // Include siteId if changed - use assign endpoint
        const siteChanged = selectedSiteId && selectedSiteId !== initialData?.siteId;
        if (siteChanged) {
          console.log('🔄 Site changed from', initialData?.siteId, 'to', selectedSiteId);
          try {
            await materialService.assignMaterialToSite(initialData._id, selectedSiteId);
            console.log('✅ Site assignation successful');
          } catch (error) {
            console.error('❌ Erreur assignation site:', error);
            toast.error('Erreur lors du changement de site');
          }
        }
        
        console.log('Update data to send:', updateData);
        
        // Allow update even if only site changed
        if (Object.keys(updateData).length === 0 && !siteChanged) {
          toast.error('Aucune donnée à mettre à jour');
          setLoading(false);
          return;
        }
        
        await materialService.updateMaterial(initialData._id, updateData);
        toast.success('Matériau modifié avec succès!');
      } else {
        if (!selectedSiteId) {
          toast.error('Veuillez sélectionner un chantier');
          setLoading(false);
          return;
        }
        
        // Créer un nouveau matériau avec les nouveaux champs V2
        const createData: any = {
          ...formData,
          stockExistant,
          stockMinimum,
          stockEntree,
          stockSortie,
          stockActuel,
          quantity: stockActuel,
          needsReorder: stockActuel < stockMinimum,
        };
        
        console.log('Creating material with site:', createData, selectedSiteId);
        await materialService.createMaterialWithSite(createData, selectedSiteId);
        toast.success('Matériau ajouté avec succès!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur complète:', error);
      console.error('Error response data:', error.response?.data);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Opération échouée';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Modifier le matériau' : 'Ajouter un matériau'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Modifiez les informations ci-dessous.' 
              : 'Remplissez les détails du matériau et associez-le à un chantier.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Chantier / Site {initialData ? '' : '*'}
              </Label>
              {loadingSites ? (
                <p className="text-sm text-gray-500">Chargement des sites...</p>
              ) : sites.length === 0 ? (
                <p className="text-sm text-red-500">Aucun site trouvé. Créez d'abord un site.</p>
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
                    <option value="">Sélectionner un chantier...</option>
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
              {selectedSiteId && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {sites.find(s => s._id === selectedSiteId)?.adresse}
                </div>
              )}
              {initialData && initialData.siteName && !selectedSiteId && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Site actuel: {initialData.siteName}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
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
                <Label htmlFor="category">Catégorie *</Label>
                <select
                  id="category"
                  className={`w-full px-3 py-2 border rounded-md ${errors.category && touched.category ? 'border-red-500' : ''}`}
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  onBlur={() => handleBlur('category')}
                >
                  <option value="">Sélectionner...</option>
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
                <Label htmlFor="unit">Unité *</Label>
                <select
                  id="unit"
                  className={`w-full px-3 py-2 border rounded-md ${errors.unit && touched.unit ? 'border-red-500' : ''}`}
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  onBlur={() => handleBlur('unit')}
                >
                  <option value="">Sélectionner...</option>
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

            {/* ========== GESTION DU STOCK V2 ========== */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Gestion du Stock
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockExistant">Stock Existant *</Label>
                  <Input
                    id="stockExistant"
                    type="number"
                    min="0"
                    value={stockExistant}
                    onChange={(e) => setStockExistant(parseInt(e.target.value) || 0)}
                    placeholder="Quantité déjà présente"
                  />
                  <p className="text-xs text-gray-500">Quantité déjà sur le chantier</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stockMinimum">Stock Minimum *</Label>
                  <Input
                    id="stockMinimum"
                    type="number"
                    min="0"
                    value={stockMinimum}
                    onChange={(e) => setStockMinimum(parseInt(e.target.value) || 0)}
                    placeholder="Seuil minimum"
                  />
                  <p className="text-xs text-gray-500">Seuil de réapprovisionnement</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-2 font-medium">Mouvements (Optionnel)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stockEntree">Entrée</Label>
                    <Input
                      id="stockEntree"
                      type="number"
                      min="0"
                      value={stockEntree}
                      onChange={(e) => setStockEntree(parseInt(e.target.value) || 0)}
                      placeholder="Quantité entrée"
                    />
                    <p className="text-xs text-gray-500">Quantité ajoutée au stock</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stockSortie">Sortie</Label>
                    <Input
                      id="stockSortie"
                      type="number"
                      min="0"
                      value={stockSortie}
                      onChange={(e) => setStockSortie(parseInt(e.target.value) || 0)}
                      placeholder="Quantité sortie"
                    />
                    <p className="text-xs text-gray-500">Quantité consommée</p>
                  </div>
                </div>
              </div>

              {/* Calcul Automatique */}
              <div className="p-3 bg-white border-2 border-blue-300 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📊 Calcul Automatique</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock Actuel:</span>
                    <span className="font-bold text-blue-700">{calculateStockActuel()} {formData.unit || 'unités'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">État:</span>
                    <span>{getStockStatusLabel()}</span>
                  </div>
                  {doitCommander() && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">À commander:</span>
                      <span className="font-bold text-orange-600">{calculateQuantiteACommander()} {formData.unit || 'unités'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {doitCommander() && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">Alerte stock</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Ce matériau nécessite une commande de {calculateQuantiteACommander()} {formData.unit || 'unités'} (+20% de marge de sécurité).
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Date d'expiration (optionnel)</Label>
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
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : (initialData ? 'Mettre à jour' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}