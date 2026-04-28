import { Button } from "@/components/ui/button";

export default function CreateOrderDialog() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Créer une nouvelle commande</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Cette fonctionnalité est en cours de développement. Veuillez patienter.
      </p>
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void 0} className="mr-2">
          Annuler
    </Button>
    </div>
    </div>
  );
}