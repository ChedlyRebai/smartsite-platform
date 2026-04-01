import { useEffect, useState } from 'react';
import { Warehouse, Plus, Edit, Trash2, Archive, Star, Phone, Mail, MapPin, Building, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { canEdit } from '../../utils/permissions';
import { 
  Fournisseur, 
  getFournisseurs, 
  createFournisseur, 
  updateFournisseur, 
  deleteFournisseur,
  archiveFournisseur,
  unarchiveFournisseur,
  updateFournisseurNotes,
  addInteraction
} from '../../action/fournisseur.action';

export default function GestionFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Permission check
  const user = useAuthStore((state) => state.user);
  const canManageFournisseurs = user && canEdit(user.role.name, 'fournisseurs');

  // Form state
  const [formData, setFormData] = useState<Partial<Fournisseur>>({
    nom: '',
    adresse: '',
    ville: '',
    codePostal: '',
    pays: 'Tunisie',
    zoneGeographique: '',
    telephone: '',
    email: '',
    siteWeb: '',
    registreCommerce: '',
    matriculeFiscale: '',
    nif: '',
    nis: '',
    siret: '',
    iban: '',
    banque: '',
    conditionsPaiement: '30 jours',
    delaiLivraison: 7,
    remise: 0,
    noteFiabilite: 0,
    noteQualite: 0,
    noteRespectDelais: 0,
    notes: '',
    statut: 'occasionnel',
    estActif: true,
    categories: [],
    contacts: [],
    personneContact: '',
    telephoneContact: '',
  });

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.nom?.trim()) {
      newErrors.nom = 'Supplier name is required';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Phone validation (international format)
    if (formData.telephone && !/^[+]?[\d\s]{8,}$/.test(formData.telephone.replace(/\s/g, ''))) {
      newErrors.telephone = 'Invalid phone number';
    }

    // IBAN validation (basic check - starts with country code)
    if (formData.iban && !/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(formData.iban.replace(/\s/g, ''))) {
      newErrors.iban = 'Invalid IBAN (ex: TN59 1234...)';
    }

    // Number ranges
    if (formData.noteFiabilite !== undefined && (formData.noteFiabilite < 0 || formData.noteFiabilite > 5)) {
      newErrors.noteFiabilite = 'Rating must be between 0 and 5';
    }
    if (formData.noteQualite !== undefined && (formData.noteQualite < 0 || formData.noteQualite > 5)) {
      newErrors.noteQualite = 'Rating must be between 0 and 5';
    }
    if (formData.noteRespectDelais !== undefined && (formData.noteRespectDelais < 0 || formData.noteRespectDelais > 5)) {
      newErrors.noteRespectDelais = 'Rating must be between 0 and 5';
    }

    if (formData.remise !== undefined && (formData.remise < 0 || formData.remise > 100)) {
      newErrors.remise = 'Discount must be between 0 and 100%';
    }

    if (formData.delaiLivraison !== undefined && formData.delaiLivraison < 0) {
      newErrors.delaiLivraison = 'Delivery time cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Available categories
  const categoriesOptions = [
    'béton', 'fer', 'acier', 'électricité', 'plomberie', 
    'bois', 'sable', 'gravier', 'ciment', 'brique', 
    'carrelage', 'peinture', 'isolation', 'toiture'
  ];

  // Statuses
  const statuts = [
    { value: 'preferentiel', label: 'Preferred', color: 'bg-green-100 text-green-800' },
    { value: 'occasionnel', label: 'Occasional', color: 'bg-blue-100 text-blue-800' },
    { value: 'a_risque', label: 'At Risk', color: 'bg-red-100 text-red-800' },
  ];

  const loadFournisseurs = async () => {
    setLoading(true);
    const data = await getFournisseurs();
    setFournisseurs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadFournisseurs();
  }, []);

  const resetForm = () => {
    setFormData({
      nom: '',
      adresse: '',
      ville: '',
      codePostal: '',
      pays: 'Tunisia',
      zoneGeographique: '',
      telephone: '',
      email: '',
      siteWeb: '',
      registreCommerce: '',
      matriculeFiscale: '',
      nif: '',
      nis: '',
      siret: '',
      iban: '',
      banque: '',
      conditionsPaiement: '30 days',
      delaiLivraison: 7,
      remise: 0,
      noteFiabilite: 0,
      noteQualite: 0,
      noteRespectDelais: 0,
      notes: '',
      statut: 'occasionnel',
      estActif: true,
      categories: [],
      contacts: [],
      personneContact: '',
      telephoneContact: '',
    });
    setSelectedFournisseur(null);
    setErrors({});
  };

  const handleOpenDialog = (fournisseur?: Fournisseur) => {
    if (fournisseur) {
      setFormData(fournisseur);
      setSelectedFournisseur(fournisseur);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validate form before saving
    if (!validateForm()) {
      toast.error('Please fix errors before saving');
      return;
    }

    let result;
    if (selectedFournisseur?._id) {
      result = await updateFournisseur(selectedFournisseur._id, formData);
    } else {
      result = await createFournisseur(formData);
    }

    // Handle the new return type { status, data?, message? }
    if (result && (result.status === 200 || result.status === 201)) {
      toast.success(selectedFournisseur ? 'Supplier updated' : 'Supplier created');
      setDialogOpen(false);
      resetForm();
      setErrors({});
      loadFournisseurs();
    } else {
      toast.error(result?.message || 'Error saving supplier');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      const success = await deleteFournisseur(id);
      if (success) {
        toast.success('Supplier deleted');
        loadFournisseurs();
      } else {
        toast.error('Error deleting supplier');
      }
    }
  };

  const handleArchive = async (id: string) => {
    const success = await archiveFournisseur(id);
    if (success) {
      toast.success('Supplier archived');
      loadFournisseurs();
    }
  };

  const handleUnarchive = async (id: string) => {
    const success = await unarchiveFournisseur(id);
    if (success) {
      toast.success('Supplier restored');
      loadFournisseurs();
    }
  };

  const filteredFournisseurs = showArchived 
    ? fournisseurs.filter(f => f.estArchive)
    : fournisseurs.filter(f => !f.estArchive);

  const getStatutBadge = (statut?: string) => {
    const s = statuts.find(st => st.value === statut);
    if (!s) return null;
    return <span className={`px-2 py-1 rounded-full text-xs ${s.color}`}>{s.label}</span>;
  };

  const renderStars = (note: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i <= note ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-500 mt-1">Gérer les fiches fournisseurs et leurs interactions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="w-4 h-4 mr-2" />
            {showArchived ? 'Active' : 'Archived'}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedFournisseur ? 'Edit Supplier' : 'New Supplier'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="finance">Finance</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                  </TabsList>

                  {/* Show Evaluation tab only when editing an existing supplier */}
                  {selectedFournisseur && (
                    <TabsList className="grid w-full grid-cols-5 mt-2">
                      <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                    </TabsList>
                  )}

                  <TabsContent value="general" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Supplier Name *</Label>
                        <Input 
                          value={formData.nom || ''}
                          onChange={(e) => setFormData({...formData, nom: e.target.value})}
                          placeholder="Cement Company"
                          className={errors.nom ? 'border-red-500' : ''}
                        />
                        {errors.nom && <p className="text-red-500 text-xs">{errors.nom}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select 
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.statut || 'occasionnel'}
                          onChange={(e) => setFormData({...formData, statut: e.target.value as any})}
                        >
                          {statuts.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input 
                          value={formData.adresse || ''}
                          onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                          placeholder="Industry Street"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input 
                          value={formData.ville || ''}
                          onChange={(e) => setFormData({...formData, ville: e.target.value})}
                          placeholder="Tunis"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input 
                          value={formData.codePostal || ''}
                          onChange={(e) => setFormData({...formData, codePostal: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input 
                          value={formData.pays || ''}
                          onChange={(e) => setFormData({...formData, pays: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input 
                          value={formData.telephone || ''}
                          onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                          placeholder="71 234 567"
                          className={errors.telephone ? 'border-red-500' : ''}
                        />
                        {errors.telephone && <p className="text-red-500 text-xs">{errors.telephone}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input 
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="contact@fournisseur.tn"
                          className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Site Web</Label>
                      <Input 
                        value={formData.siteWeb || ''}
                        onChange={(e) => setFormData({...formData, siteWeb: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Zone Géographique</Label>
                      <Input 
                        value={formData.zoneGeographique || ''}
                        onChange={(e) => setFormData({...formData, zoneGeographique: e.target.value})}
                        placeholder="Grand Tunis, Nord, Sud..."
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="contacts" className="space-y-4 mt-4">
                    {/* Simple contact fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contact Person</Label>
                        <Input 
                          value={formData.personneContact || ''}
                          onChange={(e) => setFormData({...formData, personneContact: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Phone</Label>
                        <Input 
                          value={formData.telephoneContact || ''}
                          onChange={(e) => setFormData({...formData, telephoneContact: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Multiple contacts */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <Label className="text-lg font-semibold">Contacts multiples</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const newContact = { nom: '', fonction: '', telephone: '', email: '', estPrincipal: false };
                            setFormData({...formData, contacts: [...(formData.contacts || []), newContact]});
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      
                      {(formData.contacts || []).map((contact, index) => (
                        <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">Contact {index + 1}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                const newContacts = [...(formData.contacts || [])];
                                newContacts.splice(index, 1);
                                setFormData({...formData, contacts: newContacts});
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Name</Label>
                              <Input 
                                value={contact.nom || ''}
                                onChange={(e) => {
                                  const newContacts = [...(formData.contacts || [])];
                                  newContacts[index] = {...newContacts[index], nom: e.target.value};
                                  setFormData({...formData, contacts: newContacts});
                                }}
                                placeholder="Full name"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Function</Label>
                              <Input 
                                value={contact.fonction || ''}
                                onChange={(e) => {
                                  const newContacts = [...(formData.contacts || [])];
                                  newContacts[index] = {...newContacts[index], fonction: e.target.value};
                                  setFormData({...formData, contacts: newContacts});
                                }}
                                placeholder="Function"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Phone</Label>
                              <Input 
                                value={contact.telephone || ''}
                                onChange={(e) => {
                                  const newContacts = [...(formData.contacts || [])];
                                  newContacts[index] = {...newContacts[index], telephone: e.target.value};
                                  setFormData({...formData, contacts: newContacts});
                                }}
                                placeholder="+216 ..."
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Email</Label>
                              <Input 
                                type="email"
                                value={contact.email || ''}
                                onChange={(e) => {
                                  const newContacts = [...(formData.contacts || [])];
                                  newContacts[index] = {...newContacts[index], email: e.target.value};
                                  setFormData({...formData, contacts: newContacts});
                                }}
                                placeholder="email@supplier.tn"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input 
                                type="checkbox"
                                checked={contact.estPrincipal || false}
                                onChange={(e) => {
                                  const newContacts = [...(formData.contacts || [])];
                                  newContacts[index] = {...newContacts[index], estPrincipal: e.target.checked};
                                  setFormData({...formData, contacts: newContacts});
                                }}
                              />
                              Main contact
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="finance" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Register</Label>
                        <Input 
                          value={formData.registreCommerce || ''}
                          onChange={(e) => setFormData({...formData, registreCommerce: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tax ID</Label>
                        <Input 
                          value={formData.matriculeFiscale || ''}
                          onChange={(e) => setFormData({...formData, matriculeFiscale: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>NIF</Label>
                        <Input 
                          value={formData.nif || ''}
                          onChange={(e) => setFormData({...formData, nif: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>NIS</Label>
                        <Input 
                          value={formData.nis || ''}
                          onChange={(e) => setFormData({...formData, nis: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>SIRET</Label>
                      <Input 
                        value={formData.siret || ''}
                        onChange={(e) => setFormData({...formData, siret: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>IBAN</Label>
                        <Input 
                          value={formData.iban || ''}
                          onChange={(e) => setFormData({...formData, iban: e.target.value})}
                          placeholder="TN59 1234 5678..."
                          className={errors.iban ? 'border-red-500' : ''}
                        />
                        {errors.iban && <p className="text-red-500 text-xs">{errors.iban}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Bank</Label>
                        <Input 
                          value={formData.banque || ''}
                          onChange={(e) => setFormData({...formData, banque: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Payment Terms</Label>
                        <select 
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.conditionsPaiement || '30 jours'}
                          onChange={(e) => setFormData({...formData, conditionsPaiement: e.target.value})}
                        >
                          <option value="立即">立即 (Cash)</option>
                          <option value="15 jours">15 jours</option>
                          <option value="30 jours">30 jours</option>
                          <option value="45 jours">45 jours</option>
                          <option value="60 jours">60 jours</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Time (days)</Label>
                        <Input 
                          type="number"
                          value={formData.delaiLivraison || 0}
                          onChange={(e) => setFormData({...formData, delaiLivraison: parseInt(e.target.value)})}
                          className={errors.delaiLivraison ? 'border-red-500' : ''}
                        />
                        {errors.delaiLivraison && <p className="text-red-500 text-xs">{errors.delaiLivraison}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Discount (%)</Label>
                        <Input 
                          type="number"
                          min="0"
                          max="100"
                          value={formData.remise || 0}
                          onChange={(e) => setFormData({...formData, remise: parseFloat(e.target.value)})}
                          className={errors.remise ? 'border-red-500' : ''}
                        />
                        {errors.remise && <p className="text-red-500 text-xs">{errors.remise}</p>}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="categories" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Catégories</Label>
                      <div className="flex flex-wrap gap-2">
                        {categoriesOptions.map(cat => (
                          <label key={cat} className="flex items-center gap-2">
                            <input 
                              type="checkbox"
                              checked={formData.categories?.includes(cat)}
                              onChange={(e) => {
                                const cats = formData.categories || [];
                                if (e.target.checked) {
                                  setFormData({...formData, categories: [...cats, cat]});
                                } else {
                                  setFormData({...formData, categories: cats.filter(c => c !== cat)});
                                }
                              }}
                            />
                            {cat}
                          </label>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Show Evaluation tab content only when editing */}
                  {selectedFournisseur && (
                    <TabsContent value="evaluation" className="space-y-4 mt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Reliability Rating (0-5)</Label>
                          <Input 
                            type="number"
                            min="0"
                            max="5"
                            value={formData.noteFiabilite || 0}
                            onChange={(e) => setFormData({...formData, noteFiabilite: parseFloat(e.target.value)})}
                            className={errors.noteFiabilite ? 'border-red-500' : ''}
                          />
                          {errors.noteFiabilite && <p className="text-red-500 text-xs">{errors.noteFiabilite}</p>}
                          <div className="flex gap-1 mt-1">
                            {[1,2,3,4,5].map(star => (
                              <Star 
                                key={star} 
                                className={`h-5 w-5 cursor-pointer ${star <= (formData.noteFiabilite || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                onClick={() => setFormData({...formData, noteFiabilite: star})}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Quality Rating (0-5)</Label>
                          <Input 
                            type="number"
                            min="0"
                            max="5"
                            value={formData.noteQualite || 0}
                            onChange={(e) => setFormData({...formData, noteQualite: parseFloat(e.target.value)})}
                            className={errors.noteQualite ? 'border-red-500' : ''}
                          />
                          {errors.noteQualite && <p className="text-red-500 text-xs">{errors.noteQualite}</p>}
                          <div className="flex gap-1 mt-1">
                            {[1,2,3,4,5].map(star => (
                              <Star 
                                key={star} 
                                className={`h-5 w-5 cursor-pointer ${star <= (formData.noteQualite || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                onClick={() => setFormData({...formData, noteQualite: star})}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Delivery Compliance (0-5)</Label>
                          <Input 
                            type="number"
                            min="0"
                            max="5"
                            value={formData.noteRespectDelais || 0}
                            onChange={(e) => setFormData({...formData, noteRespectDelais: parseFloat(e.target.value)})}
                            className={errors.noteRespectDelais ? 'border-red-500' : ''}
                          />
                          {errors.noteRespectDelais && <p className="text-red-500 text-xs">{errors.noteRespectDelais}</p>}
                          <div className="flex gap-1 mt-1">
                            {[1,2,3,4,5].map(star => (
                              <Star 
                                key={star} 
                                className={`h-5 w-5 cursor-pointer ${star <= (formData.noteRespectDelais || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                onClick={() => setFormData({...formData, noteRespectDelais: star})}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label>Notes et observations</Label>
                        <textarea 
                          className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                          value={formData.notes || ''}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          placeholder="Notes about the supplier..."
                        />
                      </div>
                    </TabsContent>
                  )}
                </Tabs>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-green-600"
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Warehouse className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{fournisseurs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Preferred</p>
                <p className="text-2xl font-bold">
                  {fournisseurs.filter(f => f.statut === 'preferentiel').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">At Risk</p>
                <p className="text-2xl font-bold">
                  {fournisseurs.filter(f => f.statut === 'a_risque').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Archive className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Archived</p>
                <p className="text-2xl font-bold">
                  {fournisseurs.filter(f => f.estArchive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des fournisseurs */}
      <Card>
        <CardHeader>
          <CardTitle>
            {showArchived ? 'Archived Suppliers' : 'Active Suppliers'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : filteredFournisseurs.length === 0 ? (
            <p className="text-gray-500">No suppliers found</p>
          ) : (
            <div className="space-y-4">
              {filteredFournisseurs.map((fournisseur) => (
                <div key={fournisseur._id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{fournisseur.nom}</h3>
                        {getStatutBadge(fournisseur.statut)}
                        {!fournisseur.estActif && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {fournisseur.ville || '-'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {fournisseur.telephone || '-'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {fournisseur.email || '-'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {fournisseur.delaiLivraison} days
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="flex gap-6 mt-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Reliability:</span>
                          {renderStars(fournisseur.noteFiabilite || 0)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Quality:</span>
                          {renderStars(fournisseur.noteQualite || 0)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Delivery:</span>
                          {renderStars(fournisseur.noteRespectDelais || 0)}
                        </div>
                      </div>

                      {/* Catégories */}
                      {fournisseur.categories && fournisseur.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {fournisseur.categories.map((cat, i) => (
                            <Badge key={i} variant="outline">{cat}</Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleOpenDialog(fournisseur)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {fournisseur.estArchive ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUnarchive(fournisseur._id!)}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleArchive(fournisseur._id!)}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDelete(fournisseur._id!)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
