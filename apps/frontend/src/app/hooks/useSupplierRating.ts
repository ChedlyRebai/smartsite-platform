import { useState, useEffect } from 'react';
import axios from 'axios';

interface SupplierRatingCheck {
  needed: boolean;
  consumptionPercentage: number;
  material?: {
    _id: string;
    name: string;
    supplierId?: string;
    supplierName?: string;
    siteId?: string;
  };
  alreadyRated: boolean;
}

export const useSupplierRating = (userId: string) => {
  const [pendingRatings, setPendingRatings] = useState<SupplierRatingCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const checkSupplierRatingNeeded = async (materialId: string): Promise<SupplierRatingCheck> => {
    try {
      const response = await axios.get(`/api/supplier-ratings/check/${materialId}`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking supplier rating:', error);
      return { needed: false, consumptionPercentage: 0, alreadyRated: false };
    }
  };

  const checkAllMaterials = async (materials: any[]) => {
    if (!materials.length || !userId) return;
    
    setLoading(true);
    try {
      const checks = await Promise.all(
        materials.map(async (material) => {
          // Vérifier si ce matériau a été ignoré par l'utilisateur
          if (isIgnored(material._id)) {
            return null;
          }
          
          const check = await checkSupplierRatingNeeded(material._id);
          if (check.needed) {
            return {
              ...check,
              material: {
                _id: material._id,
                name: material.name,
                supplierId: material.supplierId,
                supplierName: material.supplierName,
                siteId: material.siteId,
              }
            };
          }
          return null;
        })
      );
      
      const validChecks = checks.filter(Boolean) as SupplierRatingCheck[];
      setPendingRatings(validChecks);
      
      return validChecks;
    } catch (error) {
      console.error('Error checking all materials for rating:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const markAsRated = (materialId: string) => {
    setPendingRatings(prev => prev.filter(rating => rating.material?._id !== materialId));
  };

  const markAsIgnored = (materialId: string) => {
    // Marquer comme ignoré dans le localStorage pour cette session
    const ignoredRatings = JSON.parse(localStorage.getItem('ignoredSupplierRatings') || '[]');
    if (!ignoredRatings.includes(materialId)) {
      ignoredRatings.push(materialId);
      localStorage.setItem('ignoredSupplierRatings', JSON.stringify(ignoredRatings));
    }
    // Retirer de la liste des ratings en attente
    setPendingRatings(prev => prev.filter(rating => rating.material?._id !== materialId));
  };

  const isIgnored = (materialId: string): boolean => {
    const ignoredRatings = JSON.parse(localStorage.getItem('ignoredSupplierRatings') || '[]');
    return ignoredRatings.includes(materialId);
  };

  return {
    pendingRatings,
    loading,
    checkSupplierRatingNeeded,
    checkAllMaterials,
    markAsRated,
    markAsIgnored,
    isIgnored,
  };
};