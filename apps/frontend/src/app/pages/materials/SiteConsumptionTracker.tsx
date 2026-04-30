import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { toast } from 'sonner';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Building2,
  BarChart3,
  CheckCircle,
  Clock,
  History,
  Brain,
} from 'lucide-react';
import consumptionService, { MaterialRequirement, SiteConsumptionStats } from '../../../services/consumptionService';
import materialService, { Material } from '../../../services/materialService';
import { siteService, Site } from '../../../services/siteFournisseurService';
import MaterialRequirementForm from './MaterialRequirementForm';
import ConsumptionHistory from './ConsumptionHistory';
import ConsumptionAIReport from './ConsumptionAIReport';

interface SiteConsumptionTrackerProps {
  siteId?: string;
  siteName?: string;
  onClose?: () => void;
}

export default function SiteConsumptionTracker({ siteId: initialSiteId, siteName: initialSiteName, onClose }: SiteConsumptionTrackerProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId || '');
  const [selectedSiteName, setSelectedSiteName] = useState<string>(initialSiteName || '');
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);
  const [stats, setStats] = useState<SiteConsumptionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<MaterialRequirement | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [formData, setFormData] = useState({
    materialId: '',
    initialQuantity: 0,
    notes: '',
  });
  const [updateQuantity, setUpdateQuantity] = useState(0);
  const [updateNotes, setUpdateNotes] = useState('');
  const [addQuantityByRequirement, setAddQuantityByRequirement] = useState<Record<string, number>>({});
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [showAIReport, setShowAIReport] = useState(false);
  const [selectedMaterialForReport, setSelectedMaterialForReport] = useState<{ materialId: string; materialName: string } | null>(null);

  useEffect(() => {
    loadSites();
    loadMaterials();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadRequirements();
      loadStats();
    }
  }, [selectedSiteId]);

  const loadSites = async () => {
    try {
      const sitesData = await siteService.getSites();
      setSites(sitesData);
      if (!initialSiteId && sitesData.length > 0 && !selectedSiteId) {
        setSelectedSiteId(sitesData[0]._id);
        setSelectedSiteName(sitesData[0].nom);
      }
    } catch (error) {
      console.error('Erreur chargement sites:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const materialsData = await materialService.getMaterials({ page: 1, limit: 1000 });
      const materialsList = Array.isArray(materialsData) ? materialsData : materialsData.data || [];
      setMaterials(materialsList);
    } catch (error) {
      console.error('Erreur chargement materiaux:', error);
    }
  };

  const loadRequirements = async () => {
    if (!selectedSiteId) return;
    setLoading(true);
    try {
      const data = await consumptionService.getRequirementsBySite(selectedSiteId);
      setRequirements(data);
    } catch (error) {
      console.error('Erreur chargement exigences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedSiteId) return;
    try {
      const data = await consumptionService.getSiteStats(selectedSiteId, selectedSiteName);
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleAddRequirement = async () => {
    if (!formData.materialId) {
      toast.error('Veuillez selectionner un materiau');
      return;
    }
    if (formData.initialQuantity <= 0) {
      toast.error('La quantite initiale doit etre superieure a 0');
      return;
    }
    if (!selectedSiteId) {
      toast.error('Aucun chantier selectionne');
      return;
    }

    try {
      console.log('📤 Envoi de la requête createRequirement:', {
        siteId: selectedSiteId,
        materialId: formData.materialId,
        initialQuantity: formData.initialQuantity,
        notes: formData.notes,
      });
      
      await consumptionService.createRequirement({
        siteId: selectedSiteId,
        materialId: formData.materialId,
        initialQuantity: formData.initialQuantity,
        notes: formData.notes,
      });
      toast.success('Exigence ajoutee avec succes');
      setShowAddDialog(false);
      setFormData({ materialId: '', initialQuantity: 0, notes: '' });
      loadRequirements();
      loadStats();
      setHistoryRefreshKey(prev => prev + 1); // Rafraîchir l'historique
    } catch (error: any) {
      console.error('❌ Erreur createRequirement:', error.response?.data);
      
      // Afficher le message d'erreur détaillé du backend
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors de l'ajout";
      
      // Si c'est une erreur de validation
      if (Array.isArray(error.response?.data?.message)) {
        toast.error(`Erreur de validation: ${error.response.data.message.join(', ')}`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleUpdateConsumption = async () => {
    if (!selectedRequirement) return;
    if (updateQuantity < 0 || updateQuantity > selectedRequirement.initialQuantity) {
      toast.error(`La consommation doit etre entre 0 et ${selectedRequirement.initialQuantity}`);
      return;
    }

    try {
      // 🔥 FIX: Extraire l'ID si materialId est un objet
      const materialId = typeof selectedRequirement.materialId === 'object' 
        ? (selectedRequirement.materialId as any)._id 
        : selectedRequirement.materialId;
      
      await consumptionService.updateConsumption(selectedSiteId, materialId, {
        consumedQuantity: updateQuantity,
        notes: updateNotes,
      });
      toast.success('Consommation mise a jour');
      setShowUpdateDialog(false);
      setSelectedRequirement(null);
      setUpdateQuantity(0);
      setUpdateNotes('');
      loadRequirements();
      loadStats();
      setHistoryRefreshKey(prev => prev + 1); // Rafraîchir l'historique
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise a jour');
    }
  };

  const handleAddConsumption = async (requirement: MaterialRequirement, quantity: number) => {
    if (quantity <= 0) {
      toast.error('La quantite doit etre superieure a 0');
      return;
    }
    if (requirement.consumedQuantity + quantity > requirement.initialQuantity) {
      toast.error(`La consommation totale ne peut pas depasser ${requirement.initialQuantity}`);
      return;
    }

    try {
      // 🔥 FIX: Extraire l'ID si materialId est un objet
      const materialId = typeof requirement.materialId === 'object' 
        ? (requirement.materialId as any)._id 
        : requirement.materialId;
      
      await consumptionService.addConsumption(selectedSiteId, materialId, quantity);
      toast.success(`${quantity} ${requirement.materialUnit} consomme(s)`);
      setAddQuantityByRequirement((prev) => ({ ...prev, [requirement._id]: 0 }));
      loadRequirements();
      loadStats();
      setHistoryRefreshKey(prev => prev + 1); // Rafraîchir l'historique
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'ajout");
    }
  };

  const handleDeleteRequirement = async (requirement: MaterialRequirement) => {
    if (!window.confirm(`Supprimer l'exigence pour ${requirement.materialName} ?`)) return;

    try {
      // 🔥 FIX: Extraire l'ID si materialId est un objet
      const materialId = typeof requirement.materialId === 'object' 
        ? (requirement.materialId as any)._id 
        : requirement.materialId;
      
      await consumptionService.deleteRequirement(selectedSiteId, materialId);
      toast.success('Exigence supprimee');
      loadRequirements();
      loadStats();
      setHistoryRefreshKey(prev => prev + 1); // Rafraîchir l'historique
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const openUpdateDialog = (requirement: MaterialRequirement) => {
    setSelectedRequirement(requirement);
    setUpdateQuantity(requirement.consumedQuantity);
    setUpdateNotes('');
    setShowUpdateDialog(true);
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (percentage >= 70) return <Clock className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Building2 className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold">Suivi de consommation par chantier</h2>
            <p className="text-sm text-gray-500">Gestion intelligente des materiaux par chantier</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSiteId} onValueChange={(value) => {
            setSelectedSiteId(value);
            setSelectedSiteName(sites.find(s => s._id === value)?.nom || '');
          }}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selectionner un chantier" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site._id} value={site._id}>
                  {site.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadRequirements} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            variant="outline" 
            className="bg-purple-50 hover:bg-purple-100 text-purple-700"
            onClick={() => {
              if (requirements.length > 0) {
                const firstReq = requirements[0];
                const materialId = typeof firstReq.materialId === 'object' 
                  ? (firstReq.materialId as any)._id 
                  : firstReq.materialId;
                setSelectedMaterialForReport({
                  materialId,
                  materialName: firstReq.materialName
                });
                setShowAIReport(true);
              } else {
                toast.error('Aucun matériau disponible pour le rapport');
              }
            }}
            disabled={requirements.length === 0}
          >
            <Brain className="h-4 w-4 mr-2" />
            Rapport IA
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un materiau
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          )}
        </div>
      </div>

      {stats && stats.materialsCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Quantite totale</p><p className="text-2xl font-bold">{stats.totalInitialQuantity.toLocaleString()}</p><p className="text-xs text-gray-400">prevue</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Consomme</p><p className="text-2xl font-bold text-green-600">{stats.totalConsumedQuantity.toLocaleString()}</p><p className="text-xs text-gray-400">{stats.totalInitialQuantity > 0 ? ((stats.totalConsumedQuantity / stats.totalInitialQuantity) * 100).toFixed(1) : '0.0'}%</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Restant</p><p className="text-2xl font-bold text-yellow-600">{stats.totalRemainingQuantity.toLocaleString()}</p><p className="text-xs text-gray-400">a consommer</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Progression globale</p><p className="text-2xl font-bold">{stats.overallProgress.toFixed(1)}%</p><p className="text-xs text-gray-400">{stats.materialsCount} materiaux</p></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="consumption" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consumption" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Consommation
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consumption">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Materiaux du chantier {selectedSiteName && `- ${selectedSiteName}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2 text-gray-500">Chargement...</p>
                </div>
              ) : requirements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucun materiau defini pour ce chantier</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requirements.map((req) => (
                    <div key={req._id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(req.progressPercentage)}
                          <div>
                            <h3 className="font-semibold">{req.materialName}</h3>
                            <p className="text-sm text-gray-500">{req.materialCode} • {req.materialCategory}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={req.progressPercentage >= 90 ? 'destructive' : req.progressPercentage >= 70 ? 'secondary' : 'default'}>
                            {req.progressPercentage.toFixed(1)}%
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => openUpdateDialog(req)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteRequirement(req)}>
                            <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div><p className="text-xs text-gray-500">Quantite prevue</p><p className="font-medium">{req.initialQuantity} {req.materialUnit}</p></div>
                    <div><p className="text-xs text-gray-500">Consomme</p><p className="font-medium text-green-600">{req.consumedQuantity} {req.materialUnit}</p></div>
                    <div><p className="text-xs text-gray-500">Restant</p><p className="font-medium text-yellow-600">{req.remainingQuantity} {req.materialUnit}</p></div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progression</span>
                      <span>{req.progressPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={req.progressPercentage} />
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Quantite consommee"
                      className="w-40 text-sm"
                      min={0}
                      max={req.remainingQuantity}
                      value={addQuantityByRequirement[req._id] || ''}
                      onChange={(e) =>
                        setAddQuantityByRequirement((prev) => ({
                          ...prev,
                          [req._id]: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddConsumption(req, addQuantityByRequirement[req._id] || 0)}
                      disabled={(addQuantityByRequirement[req._id] || 0) <= 0}
                    >
                      Ajouter consommation
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>

    <TabsContent value="history">
      <ConsumptionHistory key={historyRefreshKey} siteId={selectedSiteId} />
    </TabsContent>
  </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un materiau au chantier</DialogTitle>
          </DialogHeader>
          <MaterialRequirementForm
            materials={materials}
            materialId={formData.materialId}
            initialQuantity={formData.initialQuantity}
            notes={formData.notes}
            onMaterialIdChange={(v) => setFormData({ ...formData, materialId: v })}
            onInitialQuantityChange={(v) => setFormData({ ...formData, initialQuantity: v })}
            onNotesChange={(v) => setFormData({ ...formData, notes: v })}
            onCancel={() => setShowAddDialog(false)}
            onSubmit={handleAddRequirement}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Mettre a jour la consommation - {selectedRequirement?.materialName}
            </DialogTitle>
          </DialogHeader>
          {selectedRequirement && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2 bg-gray-50 rounded"><p className="text-xs text-gray-500">Prevu</p><p className="font-medium">{selectedRequirement.initialQuantity} {selectedRequirement.materialUnit}</p></div>
                <div className="p-2 bg-green-50 rounded"><p className="text-xs text-gray-500">Consomme</p><p className="font-medium text-green-600">{updateQuantity} / {selectedRequirement.initialQuantity}</p></div>
                <div className="p-2 bg-yellow-50 rounded"><p className="text-xs text-gray-500">Restant</p><p className="font-medium text-yellow-600">{selectedRequirement.initialQuantity - updateQuantity}</p></div>
              </div>
              <div>
                <Label>Nouvelle quantite consommee</Label>
                <Input
                  type="number"
                  min={0}
                  max={selectedRequirement.initialQuantity}
                  value={updateQuantity}
                  onChange={(e) => setUpdateQuantity(parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Raison de la mise a jour..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>Annuler</Button>
                <Button onClick={handleUpdateConsumption}>Mettre a jour</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Rapport IA */}
      {showAIReport && selectedMaterialForReport && (
        <ConsumptionAIReport
          materialId={selectedMaterialForReport.materialId}
          siteId={selectedSiteId}
          materialName={selectedMaterialForReport.materialName}
          open={showAIReport}
          onClose={() => {
            setShowAIReport(false);
            setSelectedMaterialForReport(null);
          }}
        />
      )}
    </div>
  );
}
