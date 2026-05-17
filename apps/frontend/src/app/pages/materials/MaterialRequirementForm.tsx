import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Material } from '../../../services/materialService';

interface MaterialRequirementFormProps {
  materials: Material[];
  materialId: string;
  initialQuantity: number;
  notes: string;
  onMaterialIdChange: (value: string) => void;
  onInitialQuantityChange: (value: number) => void;
  onNotesChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function MaterialRequirementForm({
  materials,
  materialId,
  initialQuantity,
  notes,
  onMaterialIdChange,
  onInitialQuantityChange,
  onNotesChange,
  onCancel,
  onSubmit,
}: MaterialRequirementFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Material</Label>
        <Select value={materialId} onValueChange={onMaterialIdChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a material" />
          </SelectTrigger>
          <SelectContent>
            {materials.map((m) => (
              <SelectItem key={m._id} value={m._id}>
                {m.name} ({m.code}) - {m.quantity} {m.unit} in stock
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Planned quantity for the site</Label>
        <Input
          type="number"
          min={0}
          value={initialQuantity || ''}
          onChange={(e) => onInitialQuantityChange(Number.parseInt(e.target.value, 10) || 0)}
          placeholder="Ex: 1000"
        />
      </div>
      <div>
        <Label>Notes (optional)</Label>
        <Input
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Additional information..."
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSubmit}>Add</Button>
      </div>
    </div>
  );
}