# Guide d'utilisation - Fournisseurs et Géocodage

## 📋 Vue d'ensemble

Ce guide explique comment utiliser les deux nouvelles fonctionnalités :
1. **Materials Service** : Récupération des fournisseurs depuis MongoDB local
2. **Gestion Site** : Recherche d'adresse avec géolocalisation sur carte

## 🏪 1. Récupération des Fournisseurs (Materials Service)

### Fonctionnalités

#### A. Récupérer tous les fournisseurs
```http
GET /materials/suppliers
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "_id": "supplier_id",
      "nom": "Fournisseur ABC",
      "ville": "Tunis",
      "specialites": ["Ciment", "Béton"],
      "delaiLivraison": 2,
      "evaluation": 4.5,
      "coordonnees": {
        "latitude": 36.8065,
        "longitude": 10.1815
      }
    }
  ],
  "count": 25,
  "message": "25 fournisseurs trouvés",
  "source": "MongoDB smartsite-fournisseurs"
}
```

#### B. Récupérer les fournisseurs recommandés pour un matériau
```http
GET /materials/{materialId}/suppliers?siteId={siteId}
GET /materials/{materialId}/suppliers?siteLatitude=36.8&siteLongitude=10.2
```

**Paramètres :**
- `materialId` : ID du matériau
- `siteId` : ID du site (optionnel, pour calculer la distance)
- `siteLatitude` : Latitude du site (optionnel)
- `siteLongitude` : Longitude du site (optionnel)

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "_id": "supplier_id",
      "nom": "Fournisseur Proche",
      "ville": "Tunis",
      "specialites": ["Ciment"],
      "delaiLivraison": 1,
      "evaluation": 4.8,
      "distance": 5.2,
      "prix": 45.5,
      "disponibilite": true
    }
  ],
  "count": 8,
  "materialId": "material_123",
  "siteCoordinates": {
    "latitude": 36.8,
    "longitude": 10.2
  },
  "sortedBy": "distance"
}
```

### Utilisation Frontend

```typescript
// Récupérer tous les fournisseurs
const getAllSuppliers = async () => {
  const response = await fetch('http://localhost:3002/materials/suppliers');
  const data = await response.json();
  
  if (data.success) {
    console.log(`${data.count} fournisseurs trouvés:`, data.data);
    return data.data;
  }
};

// Récupérer les fournisseurs pour un matériau spécifique
const getSuppliersForMaterial = async (materialId: string, siteId?: string) => {
  let url = `http://localhost:3002/materials/${materialId}/suppliers`;
  if (siteId) {
    url += `?siteId=${siteId}`;
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.success) {
    console.log(`${data.count} fournisseurs recommandés:`, data.data);
    return data.data;
  }
};

// Utilisation dans un composant de commande
const OrderMaterialComponent = ({ materialId, siteId }) => {
  const [suppliers, setSuppliers] = useState([]);
  
  useEffect(() => {
    const loadSuppliers = async () => {
      const suppliersData = await getSuppliersForMaterial(materialId, siteId);
      setSuppliers(suppliersData);
    };
    
    loadSuppliers();
  }, [materialId, siteId]);
  
  return (
    <div>
      <h3>Fournisseurs recommandés</h3>
      {suppliers.map(supplier => (
        <div key={supplier._id} className="supplier-card">
          <h4>{supplier.nom}</h4>
          <p>📍 {supplier.ville}</p>
          <p>⭐ {supplier.evaluation}/5</p>
          <p>🚚 Livraison: {supplier.delaiLivraison} jours</p>
          {supplier.distance && (
            <p>📏 Distance: {supplier.distance.toFixed(1)} km</p>
          )}
          <button onClick={() => orderFromSupplier(supplier._id)}>
            Commander
          </button>
        </div>
      ))}
    </div>
  );
};
```

## 🗺️ 2. Recherche d'Adresse avec Géolocalisation (Gestion Site)

### Fonctionnalités

#### A. Recherche simple d'adresse
```http
GET /gestion-sites/geocode/search?address=Avenue Habib Bourguiba, Tunis
```

#### B. Recherche avancée d'adresse
```http
POST /gestion-sites/geocode/search-advanced
Content-Type: application/json

{
  "address": "Avenue Habib Bourguiba",
  "city": "Tunis",
  "country": "Tunisia"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "5 adresse(s) trouvée(s)",
  "results": [
    {
      "id": 0,
      "displayName": "Avenue Habib Bourguiba, Tunis, Tunisia",
      "lat": 36.8065,
      "lng": 10.1815,
      "coordinates": {
        "latitude": 36.8065,
        "longitude": 10.1815
      },
      "address": {
        "road": "Avenue Habib Bourguiba",
        "city": "Tunis",
        "country": "Tunisia",
        "countryCode": "tn",
        "postcode": "1000"
      },
      "boundingBox": {
        "south": 36.8060,
        "north": 36.8070,
        "west": 10.1810,
        "east": 10.1820
      },
      "confidence": 0.95,
      "mapUrl": "https://www.openstreetmap.org/?mlat=36.8065&mlon=10.1815&zoom=16"
    }
  ],
  "query": "Avenue Habib Bourguiba",
  "bestMatch": {
    "lat": 36.8065,
    "lng": 10.1815,
    "displayName": "Avenue Habib Bourguiba, Tunis, Tunisia"
  },
  "mapCenter": {
    "lat": 36.8065,
    "lng": 10.1815,
    "zoom": 16
  }
}
```

### Utilisation Frontend avec Carte

```typescript
// Service de géocodage
class GeocodingService {
  static async searchAddress(address: string) {
    const response = await fetch(
      `http://localhost:3001/gestion-sites/geocode/search?address=${encodeURIComponent(address)}`
    );
    return response.json();
  }
  
  static async searchAddressAdvanced(address: string, city?: string, country = 'Tunisia') {
    const response = await fetch(
      'http://localhost:3001/gestion-sites/geocode/search-advanced',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, city, country })
      }
    );
    return response.json();
  }
}

// Composant de recherche d'adresse avec carte
const AddressSearchComponent = ({ onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 36.8065, lng: 10.1815 }); // Tunis par défaut
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await GeocodingService.searchAddressAdvanced(searchQuery);
      
      if (result.success && result.results.length > 0) {
        setSearchResults(result.results);
        
        // Centrer la carte sur le meilleur résultat
        if (result.bestMatch) {
          setMapCenter({
            lat: result.bestMatch.lat,
            lng: result.bestMatch.lng
          });
        }
      } else {
        alert('Aucune adresse trouvée. Vérifiez votre saisie.');
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
      alert('Erreur lors de la recherche d\'adresse');
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectLocation = (result) => {
    // Mettre à jour la carte
    setMapCenter({ lat: result.lat, lng: result.lng });
    
    // Notifier le parent
    onLocationSelect({
      address: result.displayName,
      coordinates: result.coordinates,
      details: result.address
    });
  };
  
  return (
    <div className="address-search">
      <div className="search-input">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Entrez une adresse (ex: Avenue Habib Bourguiba, Tunis)"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? '🔄' : '🔍'} Rechercher
        </button>
      </div>
      
      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>Résultats de recherche :</h4>
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="result-item"
              onClick={() => selectLocation(result)}
            >
              <div className="result-name">{result.displayName}</div>
              <div className="result-details">
                📍 {result.coordinates.latitude.toFixed(4)}, {result.coordinates.longitude.toFixed(4)}
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
      
      {/* Intégration avec Leaflet ou Google Maps */}
      <div className="map-container">
        <MapComponent
          center={mapCenter}
          zoom={16}
          markers={searchResults.map(r => ({
            lat: r.lat,
            lng: r.lng,
            popup: r.displayName
          }))}
          onMapClick={(lat, lng) => {
            // Géocodage inverse si nécessaire
            console.log('Clicked at:', lat, lng);
          }}
        />
      </div>
    </div>
  );
};

// Composant de création de site avec recherche d'adresse
const CreateSiteComponent = () => {
  const [siteData, setSiteData] = useState({
    nom: '',
    adresse: '',
    coordonnees: null
  });
  
  const handleLocationSelect = (locationData) => {
    setSiteData(prev => ({
      ...prev,
      adresse: locationData.address,
      coordonnees: {
        latitude: locationData.coordinates.latitude,
        longitude: locationData.coordinates.longitude
      }
    }));
  };
  
  return (
    <form>
      <input
        type="text"
        placeholder="Nom du site"
        value={siteData.nom}
        onChange={(e) => setSiteData(prev => ({ ...prev, nom: e.target.value }))}
      />
      
      <div className="address-section">
        <label>Adresse du site :</label>
        <AddressSearchComponent onLocationSelect={handleLocationSelect} />
        
        {siteData.coordonnees && (
          <div className="selected-location">
            ✅ Localisation sélectionnée :
            <div>{siteData.adresse}</div>
            <div>
              📍 {siteData.coordonnees.latitude.toFixed(4)}, {siteData.coordonnees.longitude.toFixed(4)}
            </div>
          </div>
        )}
      </div>
      
      <button type="submit">Créer le site</button>
    </form>
  );
};
```

### Intégration avec Leaflet

```typescript
// Composant de carte avec Leaflet
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ center, zoom, markers, onMapClick }) => {
  const MapEvents = () => {
    useMapEvents({
      click: (e) => {
        if (onMapClick) {
          onMapClick(e.latlng.lat, e.latlng.lng);
        }
      },
    });
    return null;
  };
  
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {markers?.map((marker, index) => (
        <Marker key={index} position={[marker.lat, marker.lng]}>
          <Popup>{marker.popup}</Popup>
        </Marker>
      ))}
      
      <MapEvents />
    </MapContainer>
  );
};
```

## 🎨 Styles CSS

```css
/* Styles pour la recherche d'adresse */
.address-search {
  max-width: 800px;
  margin: 20px auto;
}

.search-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.search-input button {
  padding: 12px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.search-input button:hover {
  background: #0056b3;
}

.search-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.search-results {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.result-item:hover {
  background: #f8f9fa;
}

.result-item:last-child {
  border-bottom: none;
}

.result-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.result-details {
  font-size: 14px;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confidence {
  background: #28a745;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.map-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.selected-location {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  padding: 12px;
  margin-top: 10px;
}

/* Styles pour les fournisseurs */
.supplier-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.supplier-card h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.supplier-card p {
  margin: 4px 0;
  color: #666;
}

.supplier-card button {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
}

.supplier-card button:hover {
  background: #218838;
}
```

## 🧪 Tests

### Test des fournisseurs
```bash
# Tester la récupération de tous les fournisseurs
curl http://localhost:3002/materials/suppliers

# Tester les fournisseurs pour un matériau
curl "http://localhost:3002/materials/MATERIAL_ID/suppliers?siteId=SITE_ID"
```

### Test du géocodage
```bash
# Test simple
curl "http://localhost:3001/gestion-sites/geocode/search?address=Avenue%20Habib%20Bourguiba%20Tunis"

# Test avancé
curl -X POST http://localhost:3001/gestion-sites/geocode/search-advanced \
  -H "Content-Type: application/json" \
  -d '{"address": "Avenue Habib Bourguiba", "city": "Tunis", "country": "Tunisia"}'
```

## 📝 Notes importantes

### Fournisseurs
- Les fournisseurs sont récupérés depuis MongoDB local (`smartsite-fournisseurs`)
- Le tri se fait par distance si les coordonnées du site sont fournies
- Sinon, le tri se fait par évaluation
- Les spécialités des fournisseurs sont prises en compte

### Géocodage
- Utilise l'API Nominatim (OpenStreetMap) - gratuite
- Optimisé pour la Tunisie par défaut
- Recherche de fallback si aucun résultat en Tunisie
- Calcul de score de confiance pour chaque résultat
- Support des bounding boxes pour centrer la carte

### Performance
- Cache recommandé pour les résultats de géocodage
- Limitation des requêtes Nominatim (1 req/sec recommandé)
- Timeout configuré à 15 secondes pour les requêtes

Ces fonctionnalités améliorent significativement l'expérience utilisateur pour la commande de matériaux et la gestion des sites avec localisation précise.