import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import materialService, { Material } from "../../../services/materialService";
import PredictionsList from "./PredictionsList";
import AnomaliesList from "./AnomaliesList";
import AutoOrderDashboard from "./AutoOrderDashboard";
import OrderMap from "./OrderMap";
import ConsumptionBySite from "./ConsumptionBySite";
import MaterialFlowLog from "./MaterialFlowLog";
import MaterialMLTraining from "./MaterialMLTraining";

export function StockPredictionsPage() {
  return <PredictionsList />;
}

export function AnomaliesAlertsPage() {
  return <AnomaliesList />;
}

export function AutoOrdersPage() {
  return <AutoOrderDashboard />;
}

export function OrderTrackingMapPage() {
  const navigate = useNavigate();
  return (
    <OrderMap
      open
      onClose={() => navigate("/materials")}
      onOrderConfirmed={() => void 0}
    />
  );
}

export function SiteConsumptionPage() {
  return <ConsumptionBySite />;
}

export function FlowLogPage() {
  return <MaterialFlowLog />;
}

export function MLTrainingPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMaterials = async () => {
      setLoading(true);
      try {
        const response = await materialService.getMaterials({ page: 1, limit: 100 });
        const list = Array.isArray(response) ? response : response.data || [];
        setMaterials(list);
        if (list.length > 0) {
          setSelectedMaterialId(list[0]._id);
        }
      } finally {
        setLoading(false);
      }
    };
    void loadMaterials();
  }, []);

  const selectedMaterial = useMemo(
    () => materials.find((material) => material._id === selectedMaterialId),
    [materials, selectedMaterialId],
  );

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ML Training (TensorFlow.js)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Matériau</Label>
            <Select
              value={selectedMaterialId}
              onValueChange={setSelectedMaterialId}
              disabled={loading || materials.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Chargement…" : "Choisir un matériau"} />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m._id} value={m._id}>
                    {m.name} ({m.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedMaterial && (
            <MaterialMLTraining
              materialId={selectedMaterial._id}
              materialName={selectedMaterial.name}
              currentStock={selectedMaterial.quantity}
              reorderPoint={selectedMaterial.reorderPoint}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
