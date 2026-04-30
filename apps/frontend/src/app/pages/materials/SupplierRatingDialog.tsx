import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { Star, ThumbsUp, ThumbsDown, AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';

interface SupplierRatingDialogProps {
  open: boolean;
  onClose: () => void;
  onIgnore?: () => void; // Nouvelle prop pour ignorer explicitement
  materialId: string;
  materialName: string;
  supplierId: string;
  supplierName: string;
  siteId: string;
  consumptionPercentage: number;
  userId: string;
  userName: string;
}

export default function SupplierRatingDialog({
  open,
  onClose,
  onIgnore,
  materialId,
  materialName,
  supplierId,
  supplierName,
  siteId,
  consumptionPercentage,
  userId,
  userName,
}: SupplierRatingDialogProps) {
  const [avis, setAvis] = useState<'POSITIF' | 'NEGATIF' | null>(null);
  const [note, setNote] = useState<number>(0);
  const [commentaire, setCommentaire] = useState('');
  const [hasReclamation, setHasReclamation] = useState(false);
  const [reclamationMotif, setReclamationMotif] = useState('');
  const [reclamationDescription, setReclamationDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const motifsReclamation = [
    'Qualité insuffisante',
    'Livraison en retard',
    'Quantité incorrecte',
    'Produit endommagé',
    'Non-conformité',
    'Service client médiocre',
    'Autre',
  ];

  const handleSubmit = async () => {
    // Validation
    if (!avis) {
      toast.error('Veuillez donner votre avis (Positif ou Négatif)');
      return;
    }

    if (note === 0) {
      toast.error('Veuillez donner une note (1-5 étoiles)');
      return;
    }

    if (hasReclamation && !reclamationMotif) {
      toast.error('Veuillez sélectionner un motif de réclamation');
      return;
    }

    if (hasReclamation && !reclamationDescription.trim()) {
      toast.error('Veuillez décrire votre réclamation');
      return;
    }

    setLoading(true);

    try {
      const ratingData = {
        materialId,
        supplierId,
        siteId,
        userId,
        userName,
        avis,
        note,
        commentaire: commentaire.trim() || undefined,
        hasReclamation,
        reclamationMotif: hasReclamation ? reclamationMotif : undefined,
        reclamationDescription: hasReclamation ? reclamationDescription.trim() : undefined,
        consumptionPercentage,
      };

      await axios.post('/api/supplier-ratings', ratingData);

      toast.success(
        hasReclamation
          ? 'Avis enregistré et réclamation envoyée!'
          : 'Merci pour votre avis!'
      );

      // Fermer le dialog après succès
      onClose();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'avis');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setNote(star)}
            className={`transition-all ${
              star <= note ? 'text-yellow-500 scale-110' : 'text-gray-300'
            }`}
          >
            <Star
              className="h-8 w-8"
              fill={star <= note ? 'currentColor' : 'none'}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            🎯 Évaluer le Fournisseur (Optionnel)
          </DialogTitle>
          <DialogDescription>
            Vous avez consommé <strong>{consumptionPercentage}%</strong> de{' '}
            <strong>{materialName}</strong>. Souhaitez-vous donner votre avis sur le fournisseur{' '}
            <strong>{supplierName}</strong> ? Cette évaluation est entièrement optionnelle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Note informative */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Information :</strong> Cette évaluation est entièrement optionnelle. 
              Elle nous aide à améliorer la qualité de nos fournisseurs. 
              Vous pouvez ignorer cette demande si vous le souhaitez.
            </p>
          </div>

          {/* Avis Positif/Négatif */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Votre avis général *
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAvis('POSITIF')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  avis === 'POSITIF'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <ThumbsUp
                  className={`h-8 w-8 mx-auto mb-2 ${
                    avis === 'POSITIF' ? 'text-green-600' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`font-semibold ${
                    avis === 'POSITIF' ? 'text-green-700' : 'text-gray-600'
                  }`}
                >
                  Positif
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAvis('NEGATIF')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  avis === 'NEGATIF'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <ThumbsDown
                  className={`h-8 w-8 mx-auto mb-2 ${
                    avis === 'NEGATIF' ? 'text-red-600' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`font-semibold ${
                    avis === 'NEGATIF' ? 'text-red-700' : 'text-gray-600'
                  }`}
                >
                  Négatif
                </span>
              </button>
            </div>
          </div>

          {/* Note en étoiles */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Note (1-5 étoiles) *
            </Label>
            {renderStars()}
            {note > 0 && (
              <p className="text-center text-sm text-gray-600">
                {note === 1 && 'Très mauvais'}
                {note === 2 && 'Mauvais'}
                {note === 3 && 'Moyen'}
                {note === 4 && 'Bon'}
                {note === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
            <Textarea
              id="commentaire"
              placeholder="Partagez votre expérience avec ce fournisseur..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
            />
          </div>

          {/* Réclamation */}
          <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasReclamation"
                checked={hasReclamation}
                onChange={(e) => setHasReclamation(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="hasReclamation" className="cursor-pointer font-semibold">
                <AlertTriangle className="h-4 w-4 inline mr-1 text-orange-600" />
                Je souhaite faire une réclamation
              </Label>
            </div>

            {hasReclamation && (
              <div className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="reclamationMotif">Motif de la réclamation *</Label>
                  <select
                    id="reclamationMotif"
                    className="w-full px-3 py-2 border rounded-md"
                    value={reclamationMotif}
                    onChange={(e) => setReclamationMotif(e.target.value)}
                  >
                    <option value="">Sélectionner un motif...</option>
                    {motifsReclamation.map((motif) => (
                      <option key={motif} value={motif}>
                        {motif}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reclamationDescription">
                    Description de la réclamation *
                  </Label>
                  <Textarea
                    id="reclamationDescription"
                    placeholder="Décrivez en détail le problème rencontré..."
                    value={reclamationDescription}
                    onChange={(e) => setReclamationDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <p className="text-xs text-orange-700">
                  ⚠️ Votre réclamation sera transmise au service qualité et au
                  fournisseur pour traitement.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => {
              onIgnore?.();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Ignorer (optionnel)
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !avis || note === 0}
            className={
              avis === 'POSITIF'
                ? 'bg-green-600 hover:bg-green-700'
                : avis === 'NEGATIF'
                ? 'bg-red-600 hover:bg-red-700'
                : ''
            }
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>Envoyer l'avis</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
