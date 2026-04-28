import { useState, useEffect } from 'react';
import axios from 'axios';

interface UseSupplierRatingProps {
  materialId: string;
  userId: string;
  enabled?: boolean;
}

interface RatingCheck {
  needed: boolean;
  consumptionPercentage: number;
  material?: any;
  alreadyRated: boolean;
}

export function useSupplierRating({ materialId, userId, enabled = true }: UseSupplierRatingProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [ratingData, setRatingData] = useState<RatingCheck | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !materialId || !userId) return;

    checkIfRatingNeeded();
  }, [materialId, userId, enabled]);

  const checkIfRatingNeeded = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<RatingCheck>(
        `/api/supplier-ratings/check/${materialId}?userId=${userId}`
      );

      setRatingData(data);

      // Afficher le dialog si rating nécessaire
      if (data.needed) {
        setShowDialog(true);
      }
    } catch (error) {
      console.error('Error checking rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setShowDialog(false);
  };

  const refreshCheck = () => {
    checkIfRatingNeeded();
  };

  return {
    showDialog,
    closeDialog,
    ratingData,
    loading,
    refreshCheck,
  };
}
