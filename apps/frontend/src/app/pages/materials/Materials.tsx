"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Package,
  DollarSign,
  Truck,
  AlertTriangle,
  Building2,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { toast } from "react-hot-toast";

import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  reactivateMaterial,
  getActiveSuppliers,
  type Material,
  type Supplier,
} from "@/app/action/material.action";

const UNIT_OPTIONS = [
  { value: "bag", label: "Bag" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "m²", label: "Square Meter (m²)" },
  { value: "ton", label: "Ton" },
  { value: "piece", label: "Piece" },
] as const;

const formSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
  unit: z.enum(["bag", "kg", "m²", "ton", "piece"], {
    errorMap: () => ({ message: "Unit must be bag, kg, m², ton, or piece" }),
  }),
  estimated_price: z
    .number({ invalid_type_error: "Estimated price is required" })
    .min(0, "Price must be positive"),
  alert_threshold: z
    .number({ invalid_type_error: "Alert threshold is required" })
    .min(0, "Threshold must be positive"),
  supplier_id: z.string().min(1, "Supplier is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Material | null>(null);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      unit: "bag",
      estimated_price: 0,
      alert_threshold: 0,
      supplier_id: "",
    },
  });

  useEffect(() => {
    loadMaterials();
    loadSuppliers();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await getMaterials();
      setMaterials(data);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      const data = await getActiveSuppliers();
      setSuppliers(data);
    } catch (error: any) {
      console.error("Failed to load suppliers:", error);
    } finally {
      setSuppliersLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMaterial(null);
    form.reset({
      code: "",
      name: "",
      unit: "bag",
      estimated_price: 0,
      alert_threshold: 0,
      supplier_id: "",
    });
    setOpenModal(true);
  };

  const openEditModal = (material: Material) => {
    setEditingMaterial(material);
    form.reset({
      code: material.code,
      name: material.name,
      unit: material.unit,
      estimated_price: material.estimated_price,
      alert_threshold: material.alert_threshold,
      supplier_id: material.supplier_id,
    });
    setOpenModal(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      if (editingMaterial) {
        await updateMaterial(editingMaterial._id, values);
        toast.success("Material updated successfully");
      } else {
        await createMaterial(values);
        toast.success("Material created successfully");
      }
      setOpenModal(false);
      await loadMaterials();
    } catch (error: any) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Operation failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (material: Material) => {
    try {
      await deleteMaterial(material._id);
      toast.success("Material deactivated");
      setDeleteConfirm(null);
      await loadMaterials();
    } catch (error: any) {
      toast.error(error?.message || "Failed to deactivate material");
    }
  };

  const handleReactivate = async (material: Material) => {
    try {
      await reactivateMaterial(material._id);
      toast.success("Material reactivated");
      await loadMaterials();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reactivate material");
    }
  };

  const getSelectedSupplierName = (supplierId: string) => {
    const supplier = suppliers.find((s) => s._id === supplierId);
    return supplier ? supplier.name : "Unknown Supplier";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materials</h1>
          <p className="text-gray-500 mt-1">
            Manage materials and their suppliers
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Est. Price (€)</TableHead>
              <TableHead>Alert Threshold</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading materials...
                </TableCell>
              </TableRow>
            ) : materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No materials found. Add your first material!
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => (
                <TableRow key={material._id}>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {material.code}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{material.unit}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      {material.estimated_price.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      {material.alert_threshold}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-xs">
                      <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate">
                        {getSelectedSupplierName(material.supplier_id)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={material.is_active ? "default" : "secondary"}
                    >
                      {material.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {material.is_active ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(material)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirm(material)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReactivate(material)}
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? "Edit Material" : "Add New Material"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="CIM-35" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Cement 35kg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimated_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Price (€) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="8.50"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alert_threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Threshold *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="50"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliersLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading suppliers...
                          </SelectItem>
                        ) : suppliers.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No active suppliers
                          </SelectItem>
                        ) : (
                          suppliers.map((supplier) => (
                            <SelectItem
                              key={supplier._id}
                              value={supplier._id}
                            >
                              {supplier.name} ({supplier.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingMaterial
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate Material</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to deactivate{" "}
              <strong>{deleteConfirm?.name}</strong>? This action can be undone later.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
