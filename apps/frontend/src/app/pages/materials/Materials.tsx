import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Search, 
  Barcode, 
  Edit, 
  Trash2, 
  Plus, 
  Filter, 
  X,
  Upload,
  Eye,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Loader2,
  Printer,
  FileText,
  Settings
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { toast } from 'sonner';
import materialService, { Material, CreateMaterialData } from '../../../services/materialService';
import MaterialForm from './MaterialForm';
import MaterialAlerts from './MaterialAlerts';
import MaterialForecast from './MaterialForecast';
import MaterialDetails from './MaterialDetails';
import * as XLSX from 'xlsx';

export default function Materials() {
  // Permissions (à adapter selon votre système d'auth)
  const canManageMaterials = true; // À remplacer par votre logique d'authentification
  
  // États
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showQRMenu, setShowQRMenu] = useState(false);
  const qrMenuRef = useRef<HTMLDivElement>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [qrResult, setQrResult] = useState<{
    material?: Material;
    text?: string;
    type: 'material' | 'text' | 'unknown';
  } | null>(null);

  // Fermer le menu QR quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (qrMenuRef.current && !qrMenuRef.current.contains(event.target as Node)) {
        setShowQRMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Charger les données
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [materialsData, dashboardData, alertsData] = await Promise.all([
        materialService.getMaterials({ 
          limit: pagination.limit,
          page: pagination.page,
          search: searchTerm || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined
        }),
        materialService.getDashboard(),
        materialService.getAlerts(),
      ]);
      
      console.log('📦 Données chargées:', materialsData);
      
      setMaterials(materialsData.data || []);
      setPagination(prev => ({
        ...prev,
        total: materialsData.total || 0,
        totalPages: materialsData.totalPages || 1
      }));
      setDashboardStats(dashboardData);
      setAlerts(alertsData);
      
      // Extraire les catégories uniques
      const uniqueCategories = [...new Set((materialsData.data || []).map((m: Material) => m.category))];
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error('❌ Error loading materials:', error);
      toast.error(error.message || 'Erreur lors du chargement des matériaux');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrer les matériaux (côté client en complément)
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchTerm === '' || 
      material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'instock' && material.quantity > material.reorderPoint) ||
      (selectedStatus === 'lowstock' && material.quantity <= material.reorderPoint && material.quantity > 0) ||
      (selectedStatus === 'outofstock' && material.quantity === 0) ||
      (selectedStatus === 'expiring' && material.expiryDate && 
        new Date(material.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Exporter vers Excel
  const exportToExcel = () => {
    const exportData = materials.map(m => ({
      Code: m.code,
      Nom: m.name,
      Catégorie: m.category,
      Quantité: m.quantity,
      Unité: m.unit,
      'Stock Min': m.minimumStock,
      'Stock Max': m.maximumStock,
      'Point de commande': m.reorderPoint,
      Emplacement: m.location || 'N/A',
      Fabricant: m.manufacturer || 'N/A',
      Statut: m.quantity === 0 ? 'Rupture' : 
              m.quantity <= m.reorderPoint ? 'Stock bas' : 'En stock',
      'Date expiration': m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : 'N/A'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Matériaux');
    XLSX.writeFile(workbook, `materiaux_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export réussi!');
  };

  // Export PDF
  const exportToPDF = async () => {
    try {
      const result = await materialService.generatePDF(materials.map(m => m._id));
      
      // Télécharger le PDF
      const link = document.createElement('a');
      link.href = result.pdf;
      link.download = `inventaire_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      
      toast.success('PDF généré avec succès!');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  // Import en masse (bulk create)
  const handleBulkImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const materials: CreateMaterialData[] = JSON.parse(text);
        
        if (!Array.isArray(materials)) {
          toast.error('Le fichier doit contenir un tableau de matériaux');
          return;
        }
        
        const result = await materialService.bulkCreate(materials);
        toast.success(`${result.length} matériaux créés avec succès!`);
        loadData();
      } catch (error) {
        toast.error('Erreur lors de l\'import');
      }
    };
    input.click();
  };

  // Scanner QR Code (image)
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
        toast.info('Scan du QR code en cours...', { duration: 2000 });
        
        // Simulation d'un délai de scan
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Pour la démo, on simule différents résultats selon le fichier
        // Dans la vraie application, vous appelleriez materialService.scanQRCode(file)
        
        // Simuler un résultat aléatoire pour la démo
        const randomResult = Math.random();
        
        if (randomResult < 0.3) {
          // Matériau trouvé
          const mockMaterial: Material = {
            _id: 'mock-id',
            name: 'Béton C25/30',
            code: 'BET-001',
            category: 'Béton',
            unit: 'm³',
            quantity: 150,
            minimumStock: 50,
            maximumStock: 200,
            reorderPoint: 75,
            location: 'Zone A',
            manufacturer: 'Ciment Tunisie',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user-id'
          };
          
          setQrResult({
            material: mockMaterial,
            type: 'material'
          });
          
          toast.success('QR code scanné avec succès!', { duration: 3000 });
          
          // Option 1: Afficher directement les détails du matériau
          setSelectedMaterial(mockMaterial);
          
          // Option 2: Afficher un popup avec les informations du QR
          // Nous utilisons l'option 1 ici
          
        } else if (randomResult < 0.6) {
          // Texte QR simple
          const qrText = `QR-${Math.random().toString(36).substring(7)}`;
          setQrResult({
            text: qrText,
            type: 'text'
          });
          
          toast.info(`QR code scanné: "${qrText}" - Aucun matériau associé`, {
            duration: 5000,
            action: {
              label: 'Créer',
              onClick: () => {
                setMaterialToEdit({
                  _id: '',
                  name: '',
                  code: qrText,
                  category: '',
                  unit: '',
                  quantity: 0,
                  minimumStock: 10,
                  maximumStock: 100,
                  reorderPoint: 20,
                  location: '',
                  manufacturer: '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: 'user-id'
                });
                setShowForm(true);
              }
            }
          });
        } else {
          // QR inconnu
          setQrResult({
            type: 'unknown'
          });
          
          toast.error('QR code non reconnu', {
            duration: 4000,
            description: 'Le QR code scanné ne correspond à aucun matériau'
          });
        }
        
      } catch (error) {
        console.error('❌ Erreur scan QR:', error);
        toast.error('Erreur lors du scan QR', {
          duration: 4000,
          description: 'Veuillez réessayer avec une autre image'
        });
      } finally {
        setScanLoading(false);
      }
    };
    input.click();
  };

  // Scanner QR par texte
  const handleScanQRText = async () => {
    setShowQRMenu(false);
    const qrText = prompt('Entrez le texte du QR code:');
    if (!qrText) return;
    
    setScanLoading(true);
    setQrResult(null);
    
    try {
      toast.info('Analyse du QR code...', { duration: 2000 });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Chercher si le texte correspond à un code de matériau
      const foundMaterial = materials.find(m => 
        m.code.toLowerCase() === qrText.toLowerCase() ||
        m._id === qrText
      );
      
      if (foundMaterial) {
        setQrResult({
          material: foundMaterial,
          type: 'material'
        });
        setSelectedMaterial(foundMaterial);
        toast.success(`Matériau trouvé: ${foundMaterial.name}`, { duration: 3000 });
      } else {
        setQrResult({
          text: qrText,
          type: 'text'
        });
        
        toast.info(`QR code: "${qrText}" - Aucun matériau associé`, {
          duration: 5000,
          action: {
            label: 'Créer matériau',
            onClick: () => {
              setMaterialToEdit({
                _id: '',
                name: '',
                code: qrText,
                category: '',
                unit: '',
                quantity: 0,
                minimumStock: 10,
                maximumStock: 100,
                reorderPoint: 20,
                location: '',
                manufacturer: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'user-id'
              });
              setShowForm(true);
            }
          }
        });
      }
    } catch (error) {
      toast.error('Erreur lors de l\'analyse du QR code');
    } finally {
      setScanLoading(false);
    }
  };

  // Recherche par code-barres
  const handleScanBarcode = async () => {
    setShowQRMenu(false);
    const barcode = prompt('Entrez le code-barres:');
    if (!barcode) return;
    
    setScanLoading(true);
    setQrResult(null);
    
    try {
      // Chercher le matériau par code-barres
      const foundMaterial = materials.find(m => 
        m.code?.toLowerCase() === barcode.toLowerCase() ||
        m.barcode?.toLowerCase() === barcode.toLowerCase()
      );
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (foundMaterial) {
        setSelectedMaterial(foundMaterial);
        toast.success(`Matériau trouvé: ${foundMaterial.name}`);
      } else {
        toast.error('Aucun matériau trouvé avec ce code-barres', {
          duration: 4000,
          action: {
            label: 'Créer',
            onClick: () => {
              setMaterialToEdit({
                _id: '',
                name: '',
                code: barcode,
                category: '',
                unit: '',
                quantity: 0,
                minimumStock: 10,
                maximumStock: 100,
                reorderPoint: 20,
                location: '',
                manufacturer: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'user-id'
              });
              setShowForm(true);
            }
          }
        });
      }
    } catch (error) {
      toast.error('Erreur lors de la recherche');
    } finally {
      setScanLoading(false);
    }
  };

  // Mise à jour du stock
  const handleUpdateStock = async (materialId: string, quantity: number, operation: 'add' | 'remove') => {
    try {
      await materialService.updateStock(materialId, {
        quantity,
        operation,
        reason: 'Mise à jour manuelle',
      });
      toast.success(`Stock ${operation === 'add' ? 'augmenté' : 'diminué'}!`);
      loadData();
    } catch (error) {
      toast.error('Échec de la mise à jour du stock');
    }
  };

  // Supprimer un matériau
  const handleDelete = async (id: string) => {
    try {
      await materialService.deleteMaterial(id);
      toast.success('Matériau supprimé avec succès');
      setShowDeleteConfirm(null);
      loadData();
    } catch (error) {
      toast.error('Échec de la suppression');
    }
  };

  // Générer QR code
  const handleGenerateQR = async (material: Material) => {
    try {
      const result = await materialService.generateQRCode(material._id);
      toast.success('QR code généré avec succès');
      
      // Télécharger le QR code
      const link = document.createElement('a');
      link.href = result.qrCode;
      link.download = `qr-${material.code}.png`;
      link.click();
    } catch (error) {
      toast.error('Erreur lors de la génération du QR code');
    }
  };

  // Commander un matériau
  const handleReorder = async (materialId: string) => {
    try {
      const result = await materialService.reorderMaterial(materialId);
      if (result.success) {
        toast.success(`Commande créée! Livraison prévue: ${new Date(result.expectedDelivery).toLocaleDateString()}`);
      } else {
        toast.warning(result.message || 'Commande initiée');
      }
      loadData();
    } catch (error) {
      toast.error('Échec de la commande');
    }
  };

  // Imprimer l'inventaire
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventaire des matériaux</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 12px; }
          .in-stock { background: #d4edda; color: #155724; }
          .low-stock { background: #fff3cd; color: #856404; }
          .out-stock { background: #f8d7da; color: #721c24; }
          .footer { margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Inventaire des matériaux</h1>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Quantité</th>
              <th>Unité</th>
              <th>Statut</th>
              <th>Emplacement</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMaterials.map(m => `
              <tr>
                <td>${m.code}</td>
                <td>${m.name}</td>
                <td>${m.category}</td>
                <td>${m.quantity}</td>
                <td>${m.unit}</td>
                <td>
                  <span class="status-badge ${
                    m.quantity === 0 ? 'out-stock' :
                    m.quantity <= m.reorderPoint ? 'low-stock' : 'in-stock'
                  }">
                    ${m.quantity === 0 ? 'Rupture' :
                      m.quantity <= m.reorderPoint ? 'Stock bas' : 'En stock'}
                  </span>
                </td>
                <td>${m.location || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Total matériaux: ${filteredMaterials.length}</p>
          <p>Généré par SmartSite</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Badge de statut
  const getStatusBadge = (material: Material) => {
    if (material.quantity === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    }
    if (material.quantity <= material.reorderPoint) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Stock bas</Badge>;
    }
    if (material.expiryDate && new Date(material.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">Expire bientôt</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">En stock</Badge>;
  };

  // Pagination
  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Ouvrir le formulaire d'édition
  const handleEdit = (material: Material) => {
    setMaterialToEdit(material);
    setShowForm(true);
  };

  // Afficher les résultats du QR scan
  const showQRResultDetails = () => {
    if (!qrResult) return;
    
    if (qrResult.type === 'material' && qrResult.material) {
      setSelectedMaterial(qrResult.material);
    } else if (qrResult.type === 'text') {
      toast.info(`Texte QR: ${qrResult.text}`, {
        duration: 5000,
        action: {
          label: 'Créer matériau',
          onClick: () => {
            setMaterialToEdit({
              _id: '',
              name: '',
              code: qrResult.text || '',
              category: '',
              unit: '',
              quantity: 0,
              minimumStock: 10,
              maximumStock: 100,
              reorderPoint: 20,
              location: '',
              manufacturer: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: 'user-id'
            });
            setShowForm(true);
          }
        }
      });
    }
  };

  // Effet pour afficher automatiquement les résultats du QR
  useEffect(() => {
    showQRResultDetails();
  }, [qrResult]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des matériaux</h1>
          <p className="text-gray-500 mt-1">Suivi et gestion en temps réel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} title="Exporter en Excel" disabled={scanLoading}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          <Button variant="outline" onClick={exportToPDF} title="Exporter en PDF" disabled={scanLoading}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          
          <Button variant="outline" onClick={handlePrint} title="Imprimer" disabled={scanLoading}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          
          <Button variant="outline" onClick={handleBulkImport} title="Import en masse" disabled={scanLoading}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          {/* Menu QR Code */}
          <div className="relative" ref={qrMenuRef}>
            <Button 
              variant="outline" 
              className="relative"
              onClick={() => setShowQRMenu(!showQRMenu)}
              disabled={scanLoading}
            >
              {scanLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              {scanLoading ? 'Scan...' : 'QR Code'}
            </Button>
            {showQRMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border">
                <button
                  onClick={handleScanQR}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Scanner QR (image)
                </button>
                <button
                  onClick={handleScanQRText}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Scanner QR (texte)
                </button>
                <button
                  onClick={handleScanBarcode}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Scanner code-barres
                </button>
              </div>
            )}
          </div>

          <Button variant="outline" onClick={loadData} disabled={scanLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          
          {canManageMaterials && (
            <Button 
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              onClick={() => {
                setMaterialToEdit(null);
                setShowForm(true);
              }}
              disabled={scanLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{dashboardStats.totalMaterials || 0}</div>
              <p className="text-sm text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{dashboardStats.healthyStockCount || 0}</div>
              <p className="text-sm text-gray-500">Sain</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{dashboardStats.lowStockCount || 0}</div>
              <p className="text-sm text-gray-500">Stock bas</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{dashboardStats.outOfStockCount || 0}</div>
              <p className="text-sm text-gray-500">Rupture</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{dashboardStats.totalValue?.toLocaleString() || 0} TND</div>
              <p className="text-sm text-gray-500">Valeur totale</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-sm text-gray-500">Catégories</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, code, catégorie..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>

          {filterOpen && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-600">Catégorie</label>
                <select
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Toutes catégories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Statut</label>
                <select
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">Tous</option>
                  <option value="instock">En stock</option>
                  <option value="lowstock">Stock bas</option>
                  <option value="outofstock">Rupture</option>
                  <option value="expiring">Expire bientôt</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Tri par</label>
                <select className="w-full px-3 py-2 border rounded-md mt-1">
                  <option>Nom</option>
                  <option>Quantité</option>
                  <option>Date d'expiration</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Par page</label>
                <select
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={pagination.limit}
                  onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventaire ({filteredMaterials.length})</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertes
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="forecast">Prévisions</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Liste des matériaux</span>
                <span className="text-sm font-normal text-gray-500">
                  {pagination.total} matériaux au total • Page {pagination.page}/{pagination.totalPages}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Chargement...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucun matériau trouvé</p>
                  {canManageMaterials && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setMaterialToEdit(null);
                        setShowForm(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un matériau
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {filteredMaterials.map((material) => (
                      <div
                        key={material._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{material.name}</h3>
                            <span className="text-sm text-gray-500">({material.code})</span>
                            {getStatusBadge(material)}
                          </div>
                          
                          <div className="grid grid-cols-5 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-gray-500">Qté:</span>{' '}
                              <span className="font-medium">{material.quantity} {material.unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Stock min:</span>{' '}
                              <span className="font-medium">{material.minimumStock}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Stock max:</span>{' '}
                              <span className="font-medium">{material.maximumStock}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Emplacement:</span>{' '}
                              <span className="font-medium">{material.location || '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Catégorie:</span>{' '}
                              <span className="font-medium">{material.category}</span>
                            </div>
                          </div>

                          {material.expiryDate && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Expire le:</span>{' '}
                              <span className={new Date(material.expiryDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                                {new Date(material.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Boutons de mise à jour rapide du stock */}
                          <div className="flex border rounded-md mr-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="px-2 rounded-r-none border-r h-8"
                              onClick={() => handleUpdateStock(material._id, 1, 'remove')}
                              disabled={!canManageMaterials || material.quantity === 0}
                            >
                              -
                            </Button>
                            <span className="px-2 py-1 text-sm bg-gray-50 min-w-[40px] text-center h-8 flex items-center justify-center">
                              {material.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="px-2 rounded-l-none border-l h-8"
                              onClick={() => handleUpdateStock(material._id, 1, 'add')}
                              disabled={!canManageMaterials}
                            >
                              +
                            </Button>
                          </div>

                          {/* Bouton QR Code - Générer */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateQR(material)}
                            title="Générer QR code"
                            className="h-8 w-8 p-0"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>

                          {/* Bouton Modifier */}
                          {canManageMaterials && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(material)}
                              title="Modifier"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Bouton Détails */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMaterial(material)}
                            title="Voir détails"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Bouton Supprimer */}
                          {canManageMaterials && (
                            <>
                              {showDeleteConfirm === material._id ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(material._id)}
                                    className="h-8 px-2"
                                  >
                                    Oui
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="h-8 px-2"
                                  >
                                    Non
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setShowDeleteConfirm(material._id)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}

                          {/* Bouton Commander (si stock bas) */}
                          {material.quantity <= material.reorderPoint && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-yellow-500 text-white hover:bg-yellow-600 h-8"
                              onClick={() => handleReorder(material._id)}
                            >
                              Commander
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="min-w-[32px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
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

        <TabsContent value="alerts">
          <MaterialAlerts alerts={alerts} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="forecast">
          <MaterialForecast materials={materials} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showForm && (
        <MaterialForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setMaterialToEdit(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setMaterialToEdit(null);
            loadData();
            toast.success(materialToEdit ? 'Matériau modifié avec succès' : 'Matériau ajouté avec succès');
          }}
          initialData={materialToEdit}
        />
      )}

      {selectedMaterial && (
        <MaterialDetails
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}