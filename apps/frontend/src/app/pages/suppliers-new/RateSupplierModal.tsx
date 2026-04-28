import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

const RATING_CRITERIA_BY_ROLE: Record<string, string[]> = {
  procurement_manager: ['Delays', 'Communication', 'Price', 'Reliability'],
  site_manager: ['Material Quality'],
  project_manager: ['Quality', 'Delays'],
  qhse_manager: ['Safety Compliance'],
};

interface RateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  userRole: string;
  userId: string;
  userName: string;
  onSubmitSuccess: () => void;
  criteriaAverages?: Record<string, number>;
}

const API_URL = 'http://localhost:3014/suppliers';

export default function RateSupplierModal({
  isOpen,
  onClose,
  supplierId,
  supplierName,
  userRole,
  userId,
  userName,
  onSubmitSuccess,
  criteriaAverages,
}: RateSupplierModalProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAlreadyRatedModal, setShowAlreadyRatedModal] = useState(false);

  const criteria = RATING_CRITERIA_BY_ROLE[userRole] || [];

  useEffect(() => {
    if (isOpen) {
      setRatings({});
      setComment('');
    }
  }, [isOpen]);

  const handleRatingChange = (criterion: string, value: number) => {
    setRatings((prev) => ({ ...prev, [criterion]: value }));
  };

  const handleSubmit = async () => {
    if (criteria.length === 0) {
      toast.error('Your role does not have permission to rate this supplier');
      return;
    }

    const missingCriteria = criteria.filter((c) => !ratings[c]);
    if (missingCriteria.length > 0) {
      toast.error('Please rate all criteria');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/${supplierId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          userRole,
          ratings,
          comment: comment || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.message?.includes('already rated')) {
          setShowAlreadyRatedModal(true);
          return;
        }
        throw new Error(err.message || 'Failed to submit rating');
      }

      toast.success('Rating submitted successfully');
      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAlreadyRatedClose = () => {
    setShowAlreadyRatedModal(false);
    onClose();
  };

  const isValidRole = criteria.length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Supplier</DialogTitle>
            <p className="text-sm text-gray-500">{supplierName}</p>
          </DialogHeader>

          {!isValidRole ? (
            <div className="py-6 text-center">
              <p className="text-gray-500">
                Your role ({userRole}) does not have permission to rate suppliers.
              </p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {criteriaAverages && Object.keys(criteriaAverages).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Current Averages</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(criteriaAverages).map(([criterion, avg]) => (
                      <span key={criterion} className="text-xs bg-white px-2 py-1 rounded border">
                        {criterion}: <span className="font-medium">{avg}/10</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {criteria.map((criterion) => (
                <div key={criterion} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>{criterion}</Label>
                    <span className="text-sm font-medium text-blue-600">
                      {ratings[criterion]?.toFixed(1) || '0.0'}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-12">Poor</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={ratings[criterion] || 0}
                      onChange={(e) => handleRatingChange(criterion, parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-xs text-gray-500 w-16 text-right">Excellent</span>
                  </div>
                </div>
              ))}

              <div className="space-y-2">
                <Label htmlFor="comment">Comment (optional)</Label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment about your rating..."
                  className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            {isValidRole && (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAlreadyRatedModal} onOpenChange={handleAlreadyRatedClose}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Rate Limited</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-gray-600">
              You have already rated this supplier today. Please try again tomorrow.
            </p>
          </div>
          <DialogFooter className="justify-center">
            <Button onClick={handleAlreadyRatedClose}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}