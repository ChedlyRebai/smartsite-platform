import React, { useState, useEffect } from 'react';

interface Supplier {
  _id: string;
  nom: string;
  ville: string;
  specialites: string[];
  delaiLivraison: number;
  evaluation: number;
  distance?: number;
  prix?: number;
  disponibilite?: boolean;
  coordonnees?: {
    latitude: number;
    longitude: number;
  };
}

class SuppliersService {
  static async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const response = await fetch('http://localhost:3002/materials/suppliers');
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      throw new Error(data.message || 'Erreur lors de la récupération des fournisseurs');
    } catch (error) {
      console.error('Erreur SuppliersService.getAllSuppliers:', error);
      throw error;
    }
  }
  
  static async getSuppliersForMaterial(
    materialId: string, 
    siteId?: string,
    siteLatitude?: number,
    siteLongitude?: number
  ): Promise<Supplier[]> {
    try {
      let url = `http://localhost:3002/materials/${materialId}/suppliers`;
      const params = new URLSearchParams();
      
      if (siteId) params.append('siteId', siteId);
      if (siteLatitude) params.append('siteLatitude', siteLatitude.toString());
      if (siteLongitude) params.append('siteLongitude', siteLongitude.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      throw new Error(data.message || 'Erreur lors de la récupération des fournisseurs');
    } catch (error) {
      console.error('Erreur SuppliersService.getSuppliersForMaterial:', error);
      throw error;
    }
  }
}

interface SupplierSelectorProps {
  materialId: string;
  materialName: string;
  siteId?: string;
  siteCoordinates?: { latitude: number; longitude: number };
  onSupplierSelect: (supplier: Supplier) => void;
}

export const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  materialId,
  materialName,
  siteId,
  siteCoordinates,
  onSupplierSelect,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, [materialId, siteId, siteCoordinates]);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const suppliersData = await SuppliersService.getSuppliersForMaterial(
        materialId,
        siteId,
        siteCoordinates?.latitude,
        siteCoordinates?.longitude
      );
      setSuppliers(suppliersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllSuppliers = async () => {
    setLoading(true);
    try {
      const allSuppliers = await SuppliersService.getAllSuppliers();
      setSuppliers(allSuppliers);
      setShowAllSuppliers(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="supplier-selector loading">
        <div className="loading-spinner">🔄 Chargement des fournisseurs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="supplier-selector error">
        <div className="error-message">❌ {error}</div>
        <button onClick={loadSuppliers} className="retry-button">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="supplier-selector">
      <div className="selector-header">
        <h3>Fournisseurs pour {materialName}</h3>
        <div className="header-actions">
          {!showAllSuppliers && (
            <button onClick={loadAllSuppliers} className="show-all-button">
              Voir tous les fournisseurs
            </button>
          )}
          {showAllSuppliers && (
            <button onClick={loadSuppliers} className="show-recommended-button">
              Voir les recommandés
            </button>
          )}
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div className="no-suppliers">
          <p>Aucun fournisseur trouvé pour ce matériau.</p>
          <button onClick={loadAllSuppliers}>
            Voir tous les fournisseurs disponibles
          </button>
        </div>
      ) : (
        <div className="suppliers-grid">
          {suppliers.map((supplier) => (
            <div key={supplier._id} className="supplier-card">
              <div className="supplier-header">
                <h4>{supplier.nom}</h4>
                <div className="supplier-rating">
                  ⭐ {supplier.evaluation.toFixed(1)}/5
                </div>
              </div>

              <div className="supplier-details">
                <div className="detail-item">
                  <span className="icon">📍</span>
                  <span>{supplier.ville}</span>
                </div>

                <div className="detail-item">
                  <span className="icon">🚚</span>
                  <span>Livraison: {supplier.delaiLivraison} jour(s)</span>
                </div>

                {supplier.distance && (
                  <div className="detail-item">
                    <span className="icon">📏</span>
                    <span>Distance: {supplier.distance.toFixed(1)} km</span>
                  </div>
                )}

                {supplier.prix && (
                  <div className="detail-item">
                    <span className="icon">💰</span>
                    <span>Prix: {supplier.prix} TND</span>
                  </div>
                )}

                <div className="specialites">
                  <span className="icon">🔧</span>
                  <span>Spécialités:</span>
                  <div className="specialites-tags">
                    {supplier.specialites.map((spec, index) => (
                      <span key={index} className="specialite-tag">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="supplier-actions">
                <button
                  onClick={() => onSupplierSelect(supplier)}
                  className="select-supplier-button"
                  disabled={supplier.disponibilite === false}
                >
                  {supplier.disponibilite === false ? 'Indisponible' : 'Sélectionner'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierSelector;