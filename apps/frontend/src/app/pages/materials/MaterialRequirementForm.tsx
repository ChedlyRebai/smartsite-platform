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
        <Label>Materiau</Label>
        <Select value={materialId} onValueChange={onMaterialIdChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selectionner un materiau" />
          </SelectTrigger>
          <SelectContent>
            {materials.map((m) => (
              <SelectItem key={m._id} value={m._id}>
                {m.name} ({m.code}) - {m.quantity} {m.unit} en stock
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Quantite prevue pour le chantier</Label>
        <Input
          type="number"
          min={0}
          value={initialQuantity || ''}
          onChange={(e) => onInitialQuantityChange(parseInt(e.target.value, 10) || 0)}
          placeholder="Ex: 1000"
        />
      </div>
      <div>
        <Label>Notes (optionnel)</Label>
        <Input
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Informations supplementaires..."
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={onSubmit}>Ajouter</Button>
      </div>
    </div>
  );
}
