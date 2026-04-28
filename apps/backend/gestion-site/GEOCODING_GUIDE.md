# 🗺️ Guide de Géocodage d'Adresses - Gestion des Sites

## Fonctionnalité

Le service de gestion des sites inclut maintenant une fonctionnalité de **géocodage automatique** qui permet de :
- Rechercher une adresse et obtenir automatiquement ses coordonnées GPS (latitude, longitude)
- Afficher l'adresse sur une carte interactive
- Obtenir plusieurs suggestions d'adresses si la recherche est ambiguë

## 🌍 API de Géocodage

### Endpoint

```
GET /gestion-sites/geocode/search?address={adresse}
```

### Paramètres

- **address** (required) : L'adresse à géocoder (rue, ville, pays, etc.)

### Exemple de Requête

#### Windows PowerShell :

```powershell
$address = "Avenue Habib Bourguiba, Tunis, Tunisia"
$encodedAddress = [System.Web.HttpUtility]::UrlEncode($address)
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=$encodedAddress" -Method GET
```

#### cURL :

```bash
curl "http://localhost:3001/gestion-sites/geocode/search?address=Avenue%20Habib%20Bourguiba%2C%20Tunis%2C%20Tunisia"
```

### Exemple de Réponse

```json
{
  "success": true,
  "message": "5 adresse(s) trouvée(s)",
  "query": "Avenue Habib Bourguiba, Tunis, Tunisia",
  "results": [
    {
      "displayName": "Avenue Habib Bourguiba, Tunis, Tunisia",
      "lat": 36.8065,
      "lng": 10.1815,
      "address": {
        "road": "Avenue Habib Bourguiba",
        "city": "Tunis",
        "state": "Tunis",
        "country": "Tunisia",
        "postcode": "1000"
      },
      "boundingBox": ["36.8060", "36.8070", "10.1810", "10.1820"],
      "type": "road",
      "importance": 0.8
    },
    {
      "displayName": "Avenue Habib Bourguiba, La Marsa, Tunisia",
      "lat": 36.8765,
      "lng": 10.3245,
      "address": {
        "road": "Avenue Habib Bourguiba",
        "city": "La Marsa",
        "state": "Tunis",
        "country": "Tunisia",
        "postcode": "2070"
      },
      "boundingBox": ["36.8760", "36.8770", "10.3240", "10.3250"],
      "type": "road",
      "importance": 0.7
    }
  ]
}
```

## 🎯 Utilisation dans le Frontend

### 1. Recherche d'Adresse lors de la Création/Modification d'un Site

Lorsque l'utilisateur saisit une adresse dans le formulaire de création/modification de site :

```typescript
// Fonction pour rechercher une adresse
async function searchAddress(address: string) {
  try {
    const response = await fetch(
      `/gestion-sites/geocode/search?address=${encodeURIComponent(address)}`
    );
    const data = await response.json();
    
    if (data.success && data.results.length > 0) {
      // Afficher les résultats à l'utilisateur
      return data.results;
    } else {
      console.warn('Aucune adresse trouvée');
      return [];
    }
  } catch (error) {
    console.error('Erreur lors de la recherche d\'adresse:', error);
    return [];
  }
}

// Utilisation
const results = await searchAddress('Avenue Habib Bourguiba, Tunis');
if (results.length > 0) {
  const firstResult = results[0];
  // Mettre à jour les coordonnées du site
  setSiteCoordinates({
    lat: firstResult.lat,
    lng: firstResult.lng
  });
  // Centrer la carte sur ces coordonnées
  map.setCenter({ lat: firstResult.lat, lng: firstResult.lng });
}
```

### 2. Intégration avec un Champ de Recherche

```tsx
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

function AddressSearchInput({ onAddressSelect }) {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Recherche avec debounce pour éviter trop de requêtes
  const searchAddress = debounce(async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/gestion-sites/geocode/search?address=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.results);
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
  }, 500);

  useEffect(() => {
    searchAddress(address);
  }, [address]);

  return (
    <div className="address-search">
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Rechercher une adresse..."
        className="form-control"
      />
      
      {loading && <div className="spinner">Recherche...</div>}
      
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => {
                onAddressSelect(suggestion);
                setAddress(suggestion.displayName);
                setSuggestions([]);
              }}
              className="suggestion-item"
            >
              <div className="suggestion-name">{suggestion.displayName}</div>
              <div className="suggestion-coords">
                📍 {suggestion.lat.toFixed(4)}, {suggestion.lng.toFixed(4)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 3. Affichage sur une Carte (Leaflet ou Google Maps)

#### Avec Leaflet :

```tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function SiteMap({ coordinates }) {
  return (
    <MapContainer
      center={[coordinates.lat, coordinates.lng]}
      zoom={15}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={[coordinates.lat, coordinates.lng]}>
        <Popup>
          Site: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
```

## 🔧 Configuration

### API Utilisée

Le service utilise l'API **Nominatim** d'OpenStreetMap, qui est :
- ✅ **Gratuite**
- ✅ **Sans clé API requise**
- ✅ **Données ouvertes**
- ⚠️ **Limitée à 1 requête par seconde** (rate limiting)

### Limites et Bonnes Pratiques

1. **Rate Limiting** : Maximum 1 requête par seconde
   - Utilisez un debounce dans le frontend (500ms recommandé)
   - Ne faites pas de requêtes en boucle

2. **User-Agent** : Toujours inclure un User-Agent identifiable
   - Déjà configuré dans le service : `SmartSite-Platform/1.0`

3. **Cache** : Considérez mettre en cache les résultats fréquents
   - Réduire la charge sur l'API
   - Améliorer les performances

4. **Alternatives pour Production** :
   - **Google Maps Geocoding API** (payant, plus précis)
   - **Mapbox Geocoding API** (freemium)
   - **Here Geocoding API** (freemium)

## 📊 Cas d'Usage

### 1. Création d'un Nouveau Site

```
Utilisateur saisit : "Rue de la République, Tunis"
↓
API Géocodage recherche l'adresse
↓
Retourne : lat: 36.8065, lng: 10.1815
↓
Carte se centre automatiquement sur ces coordonnées
↓
Utilisateur confirme ou ajuste la position
↓
Site créé avec les coordonnées exactes
```

### 2. Modification d'un Site Existant

```
Utilisateur modifie l'adresse
↓
Nouvelle recherche de géocodage
↓
Coordonnées mises à jour automatiquement
↓
Carte se recentre sur la nouvelle position
```

### 3. Recherche Ambiguë

```
Utilisateur saisit : "Avenue Bourguiba"
↓
API retourne plusieurs résultats :
  - Avenue Bourguiba, Tunis
  - Avenue Bourguiba, Sousse
  - Avenue Bourguiba, Sfax
↓
Utilisateur sélectionne le bon résultat
↓
Coordonnées appliquées au site
```

## 🧪 Tests

### Test Manuel

1. Démarrer le service :
```bash
cd apps/backend/gestion-site
npm start
```

2. Tester l'endpoint :
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=Tunis" -Method GET
```

3. Vérifier la réponse :
- `success: true`
- `results` contient au moins un résultat
- Chaque résultat a `lat` et `lng`

### Test d'Intégration

```typescript
describe('Geocoding Service', () => {
  it('should geocode a valid address', async () => {
    const response = await request(app.getHttpServer())
      .get('/gestion-sites/geocode/search')
      .query({ address: 'Tunis, Tunisia' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.results).toHaveLength(greaterThan(0));
    expect(response.body.results[0]).toHaveProperty('lat');
    expect(response.body.results[0]).toHaveProperty('lng');
  });

  it('should return empty results for invalid address', async () => {
    const response = await request(app.getHttpServer())
      .get('/gestion-sites/geocode/search')
      .query({ address: 'xyzabc123invalid' })
      .expect(200);

    expect(response.body.success).toBe(false);
    expect(response.body.results).toHaveLength(0);
  });
});
```

## 🚀 Prochaines Améliorations

1. **Géocodage Inverse** : Obtenir l'adresse à partir de coordonnées
2. **Autocomplete** : Suggestions en temps réel pendant la saisie
3. **Cache Redis** : Mettre en cache les résultats fréquents
4. **Validation de Zone** : Vérifier que le site est dans une zone autorisée
5. **Calcul de Distance** : Distance entre sites ou entre site et fournisseur

## 📚 Ressources

- **Nominatim API** : https://nominatim.org/release-docs/latest/api/Overview/
- **OpenStreetMap** : https://www.openstreetmap.org/
- **Leaflet.js** : https://leafletjs.com/
- **React Leaflet** : https://react-leaflet.js.org/
