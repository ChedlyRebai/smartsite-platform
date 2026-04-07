import { Link2, ArrowLeft, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { getSupplierMaterialById, SupplierMaterial } from "@/app/action/supplier-material.action";

export default function SupplierMaterialDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<SupplierMaterial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getSupplierMaterialById(id!);
    if (res.status === 200) setItem(res.data);
    else navigate("/supplier-materials");
    setLoading(false);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!item) return null;

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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/supplier-materials")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mapping Details</h1>
            <p className="text-gray-500">View supplier-material relationship</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/supplier-materials/edit/${id}`)}>
          <Edit className="h-4 w-4 mr-2" />Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Supplier</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{item.supplierId?.name}</p>
            <p className="text-gray-500">{item.supplierId?.supplierCode}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Material</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{item.catalogItemId?.name}</p>
            <p className="text-gray-500">{item.catalogItemId?.code} - {item.catalogItemId?.category}</p>
            <p className="text-sm text-gray-400">Unit: {item.catalogItemId?.unit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div><span className="text-gray-500">Unit Price:</span> <span className="font-medium">{item.unitPrice} {item.currency}</span></div>
            {item.supplierRef && <div><span className="text-gray-500">Supplier Ref:</span> <span className="font-medium">{item.supplierRef}</span></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Delivery & Availability</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div><span className="text-gray-500">Delivery:</span> <span className="font-medium">{item.deliveryDays ? `${item.deliveryDays} days` : "N/A"}</span></div>
            <div><span className="text-gray-500">Status:</span> <Badge className={getAvailabilityColor(item.availability)}>{item.availability}</Badge></div>
            {item.qualityScore !== undefined && <div><span className="text-gray-500">Quality Score:</span> <span className="font-medium">{item.qualityScore}/10</span></div>}
          </CardContent>
        </Card>
        {item.notes && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent><p>{item.notes}</p></CardContent>
          </Card>
        )}
        <div className="lg:col-span-2">
          {item.isPreferred && <Badge className="bg-blue-100 text-blue-800">Preferred Supplier</Badge>}
        </div>
      </div>
    </div>
  );
}