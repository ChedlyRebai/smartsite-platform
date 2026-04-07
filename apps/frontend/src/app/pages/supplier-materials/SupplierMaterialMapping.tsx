import { Link2, Plus, Search, ChevronLeft, ChevronRight, Edit, Trash2, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../components/ui/alert-dialog";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { toast } from "sonner";
import { getAllSupplierMaterials, deleteSupplierMaterial, SupplierMaterial } from "@/app/action/supplier-material.action";

export default function SupplierMaterialMapping() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManage = user && canEdit(userRole.name, "materials");

  const [items, setItems] = useState<SupplierMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    loadData();
  }, [pagination.page]);

  useEffect(() => {
    const delay = setTimeout(() => loadData(), 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAllSupplierMaterials({ page: pagination.page, limit: pagination.limit });
      if (res.status === 200) {
        const filtered = searchQuery
          ? res.data.filter(item => 
              item.supplierId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.catalogItemId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : res.data;
        setItems(filtered);
        setPagination(prev => ({ ...prev, total: res.total || 0 }));
      }
    } catch (error) {
      toast.error("Failed to load supplier-material mappings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteSupplierMaterial(id);
    if (res.status === 200) {
      toast.success("Mapping deleted successfully");
      loadData();
    } else {
      toast.error("Failed to delete mapping");
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "limited": return "bg-yellow-100 text-yellow-800";
      case "unavailable": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier-Material Mappings</h1>
          <p className="text-gray-500 mt-1">Manage which suppliers supply which materials</p>
        </div>
        {canManage && (
          <Button className="bg-gradient-to-r from-blue-600 to-green-600" onClick={() => navigate("/supplier-materials/add")}>
            <Plus className="h-4 w-4 mr-2" />Add Mapping
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />Supplier-Material List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by supplier or material..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No mappings found</div>
          ) : (
            <>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item._id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.supplierId?.name}</h3>
                          <span className="text-sm text-gray-500">({item.supplierId?.supplierCode})</span>
                          <span className="text-gray-400">→</span>
                          <h3 className="font-semibold">{item.catalogItemId?.name}</h3>
                          <span className="text-sm text-gray-500">({item.catalogItemId?.code})</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="font-medium">{item.unitPrice} {item.currency}</span>
                          <span className="text-gray-500">{item.deliveryDays ? `${item.deliveryDays} days` : "-"}</span>
                          <Badge className={getAvailabilityColor(item.availability)}>{item.availability}</Badge>
                          {item.isPreferred && <Badge className="bg-blue-100 text-blue-800">Preferred</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/supplier-materials/${item._id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManage && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/supplier-materials/edit/${item._id}`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
                                  <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(item._id || "")}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}