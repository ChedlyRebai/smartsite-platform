import React, { useState } from 'react';

interface GeocodingResult {
  id: number;
  displayName: string;
  lat: number;
  lng: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: {
    road?: string;
    city?: string;
    country?: string;
    postcode?: string;
  };
  confidence: number;
  mapUrl: string;
}

interface GeocodingResponse {
  success: boolean;
  message: string;
  results: GeocodingResult[];
  bestMatch?: GeocodingResult;
  mapCenter?: {
    lat: number;
    lng: number;
    zoom: number;
  };
}

class GeocodingService {
  static async searchAddress(address: string): Promise<GeocodingResponse> {
    try {
      const response = await fetch(
        `http://localhost:3001/gestion-sites/geocode/search?address=${encodeURIComponent(address)}`
      );
      return response.json();
    } catch (error) {
      console.error('Erreur GeocodingService.searchAddress:', error);
      throw error;
    }
  }
  
  static async searchAddressAdvanced(
    address: string, 
    city?: string, 
    country = 'Tunisia'
  ): Promise<GeocodingResponse> {
    try {
      const response = await fetch(
        'http://localhost:3001/gestion-sites/geocode/search-advanced',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, city, country })
        }
      );
      return response.json();
    } catch (error) {
      console.error('Erreur GeocodingService.searchAddressAdvanced:', error);
      throw error;
    }
  }
}

interface AddressSearchProps {
  onLocationSelect: (location: {
    address: string;
    coordinates: { latitude: number; longitude: number };
    details: any;
  }) => void;
  placeholder?: string;
}

export const AddressSearch: React.FC<AddressSearchProps> = ({
  onLocationSelect,
  placeholder = "Entrez une adresse (ex: Avenue Habib Bourguiba, Tunis)",
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<GeocodingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await GeocodingService.searchAddressAdvanced(searchQuery);

      if (result.success && result.results.length > 0) {
        setSearchResults(result.results);
      } else {
        setError('Aucune adresse trouvée. Vérifiez votre saisie.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setError('Erreur lors de la recherche d\'adresse');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectLocation = (result: GeocodingResult) => {
    setSelectedResult(result);

    // Notifier le parent
    onLocationSelect({
      address: result.displayName,
      coordinates: result.coordinates,
      details: result.address
    });
  };

  return (
    <div className="address-search">
      <div className="search-section">
        <div className="search-input">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isLoading}
          />
          <button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}>
            {isLoading ? '🔄' : '🔍'} Rechercher
          </button>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="search-results">
            <h4>Résultats de recherche :</h4>
            {searchResults.map((result) => (
              <div
                key={result.id}
                className={`result-item ${selectedResult?.id === result.id ? 'selected' : ''}`}
                onClick={() => selectLocation(result)}
              >
                <div className="result-name">{result.displayName}</div>
                <div className="result-details">
                  <span>📍 {result.coordinates.latitude.toFixed(4)}, {result.coordinates.longitude.toFixed(4)}</span>
                  {result.confidence && (
                    <span className="confidence">
                      ✓ {(result.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedResult && (
        <div className="selected-location">
          <h4>✅ Localisation sélectionnée :</h4>
          <div className="location-details">
            <div><strong>Adresse :</strong> {selectedResult.displayName}</div>
            <div><strong>Coordonnées :</strong> {selectedResult.coordinates.latitude.toFixed(6)}, {selectedResult.coordinates.longitude.toFixed(6)}</div>
            {selectedResult.address.city && (
              <div><strong>Ville :</strong> {selectedResult.address.city}</div>
            )}
            {selectedResult.address.country && (
              <div><strong>Pays :</strong> {selectedResult.address.country}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSearch;