import { Link2, ArrowLeft, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { toast } from "sonner";
import { createSupplierMaterial, updateSupplierMaterial, getSupplierMaterialById } from "@/app/action/supplier-material.action";
import { getAllSuppliers, Supplier } from "@/app/action/supplier.action";
import { getAllCatalogItems, CatalogItem } from "@/app/action/catalog.action";

const CURRENCIES = ["DT", "EUR", "USD"];
const AVAILABILITY = ["available", "limited", "unavailable"];

export default function AddSupplierMaterialMapping() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManage = user && canEdit(userRole.name, "materials");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  const [formData, setFormData] = useState({
    supplierId: "",
    catalogItemId: "",
    supplierRef: "",
    unitPrice: "",
    currency: "DT",
    deliveryDays: "",
    availability: "available",
    qualityScore: "",
    isPreferred: false,
    notes: "",
  });

  useEffect(() => {
    if (!canManage) {
      toast.error("You don't have permission");
      navigate("/supplier-materials");
      return;
    }
    loadOptions();
    if (id) loadExisting();
  }, []);

  const loadOptions = async () => {
    const [supRes, catRes] = await Promise.all([
      getAllSuppliers({ limit: 100 }),
      getAllCatalogItems({ limit: 100 }),
    ]);
    if (supRes.status === 200) setSuppliers(supRes.data);
    if (catRes.status === 200) setCatalogItems(catRes.data);
  };

  const loadExisting = async () => {
    setFetching(true);
    const res = await getSupplierMaterialById(id!);
    if (res.status === 200) {
      const d = res.data;
      setFormData({
        supplierId: typeof d.supplierId === 'object' ? d.supplierId._id : "",
        catalogItemId: typeof d.catalogItemId === 'object' ? d.catalogItemId._id : "",
        supplierRef: d.supplierRef || "",
        unitPrice: d.unitPrice?.toString() || "",
        currency: d.currency || "DT",
        deliveryDays: d.deliveryDays?.toString() || "",
        availability: d.availability || "available",
        qualityScore: d.qualityScore?.toString() || "",
        isPreferred: d.isPreferred || false,
        notes: d.notes || "",
      });
    }
    setFetching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.catalogItemId || !formData.unitPrice) {
      toast.error("Supplier, material, and price are required");
      return;
    }
    setLoading(true);
    const data = {
      supplierId: formData.supplierId,
      catalogItemId: formData.catalogItemId,
      supplierRef: formData.supplierRef || undefined,
      unitPrice: parseFloat(formData.unitPrice),
      currency: formData.currency,
      deliveryDays: formData.deliveryDays ? parseInt(formData.deliveryDays) : undefined,
      availability: formData.availability,
      qualityScore: formData.qualityScore ? parseFloat(formData.qualityScore) : undefined,
      isPreferred: formData.isPreferred,
      notes: formData.notes || undefined,
    };
    const res = id 
      ? await updateSupplierMaterial(id, data)
      : await createSupplierMaterial(data);
    
    if (res.status === 200 || res.status === 201) {
      toast.success(id ? "Mapping updated" : "Mapping created");
      navigate("/supplier-materials");
    } else {
      toast.error("Failed to save mapping");
    }
    setLoading(false);
  };

  if (!canManage) return null;
  if (fetching) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/supplier-materials")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{id ? "Edit Mapping" : "Add Mapping"}</h1>
          <p className="text-gray-500">Link a supplier to a material</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />Mapping Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s._id} value={s._id!}>{s.name} ({s.supplierCode})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Material *</Label>
                  <Select value={formData.catalogItemId} onValueChange={(v) => setFormData({ ...formData, catalogItemId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                    <SelectContent>
                      {catalogItems.map(c => <SelectItem key={c._id} value={c._id!}>{c.name} ({c.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Supplier Reference</Label>
                  <Input value={formData.supplierRef} onChange={(e) => setFormData({ ...formData, supplierRef: e.target.value })} placeholder="e.g., SUP-CEM-001" />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price *</Label>
                  <Input type="number" step="0.01" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Delivery Days</Label>
                  <Input type="number" value={formData.deliveryDays} onChange={(e) => setFormData({ ...formData, deliveryDays: e.target.value })} placeholder="e.g., 5" />
                </div>
                <div className="space-y-2">
                  <Label>Availability</Label>
                  <Select value={formData.availability} onValueChange={(v) => setFormData({ ...formData, availability: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quality Score (0-10)</Label>
                  <Input type="number" step="0.1" min="0" max="10" value={formData.qualityScore} onChange={(e) => setFormData({ ...formData, qualityScore: e.target.value })} placeholder="0-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea className="w-full px-3 py-2 border rounded-md" rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Options</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="preferred" checked={formData.isPreferred} onChange={(e) => setFormData({ ...formData, isPreferred: e.target.checked })} className="h-4 w-4" />
                  <Label htmlFor="preferred" className="cursor-pointer">Preferred Supplier</Label>
                </div>
              </CardContent>
            </Card>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-green-600" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />{loading ? "Saving..." : "Save Mapping"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}