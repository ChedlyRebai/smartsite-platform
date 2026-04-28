# 🧪 Test Rapide du Géocodage

## Étape 1 : Démarrer le Service

```bash
cd apps/backend/gestion-site
npm start
```

## Étape 2 : Tester l'Endpoint

### Test 1 : Recherche Simple

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=Tunis" -Method GET
```

**Résultat Attendu** :
```json
{
  "success": true,
  "message": "5 adresse(s) trouvée(s)",
  "results": [
    {
      "displayName": "Tunis, Tunisia",
      "lat": 36.8065,
      "lng": 10.1815,
      "address": {
        "city": "Tunis",
        "country": "Tunisia"
      }
    }
  ]
}
```

### Test 2 : Adresse Complète

```powershell
$address = "Avenue Habib Bourguiba, Tunis, Tunisia"
$encoded = [System.Web.HttpUtility]::UrlEncode($address)
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=$encoded" -Method GET
```

### Test 3 : Adresse Tunisienne Spécifique

```powershell
# Test avec une adresse à Tunis
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=La%20Marsa%2C%20Tunis" -Method GET

# Test avec une adresse à Sousse
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=Sousse%2C%20Tunisia" -Method GET

# Test avec une adresse à Sfax
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=Sfax%2C%20Tunisia" -Method GET
```

### Test 4 : Adresse Invalide

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=xyzabc123invalid" -Method GET
```

**Résultat Attendu** :
```json
{
  "success": false,
  "message": "Aucune adresse trouvée. Veuillez vérifier l'adresse saisie.",
  "results": []
}
```

## Étape 3 : Intégration Frontend

### Exemple de Code React

```tsx
// Dans votre composant de création/modification de site
const [address, setAddress] = useState('');
const [coordinates, setCoordinates] = useState({ lat: 36.8065, lng: 10.1815 });
const [suggestions, setSuggestions] = useState([]);

const handleAddressSearch = async (query: string) => {
  if (query.length < 3) return;
  
  try {
    const response = await fetch(
      `/gestion-sites/geocode/search?address=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    
    if (data.success && data.results.length > 0) {
      setSuggestions(data.results);
      // Sélectionner automatiquement le premier résultat
      const firstResult = data.results[0];
      setCoordinates({
        lat: firstResult.lat,
        lng: firstResult.lng
      });
    }
  } catch (error) {
    console.error('Erreur de géocodage:', error);
  }
};

// Dans le JSX
<input
  type="text"
  value={address}
  onChange={(e) => {
    setAddress(e.target.value);
    handleAddressSearch(e.target.value);
  }}
  placeholder="Saisissez une adresse..."
/>

{suggestions.length > 0 && (
  <ul className="suggestions">
    {suggestions.map((suggestion, index) => (
      <li
        key={index}
        onClick={() => {
          setAddress(suggestion.displayName);
          setCoordinates({
            lat: suggestion.lat,
            lng: suggestion.lng
          });
          setSuggestions([]);
        }}
      >
        {suggestion.displayName}
        <br />
        <small>📍 {suggestion.lat.toFixed(4)}, {suggestion.lng.toFixed(4)}</small>
      </li>
    ))}
  </ul>
)}
```

## 📍 Coordonnées de Villes Tunisiennes pour Tests

| Ville | Latitude | Longitude |
|-------|----------|-----------|
| Tunis | 36.8065 | 10.1815 |
| Sousse | 35.8256 | 10.6369 |
| Sfax | 34.7406 | 10.7603 |
| Bizerte | 37.2746 | 9.8739 |
| Gabès | 33.8815 | 10.0982 |
| Ariana | 36.8625 | 10.1956 |
| La Marsa | 36.8765 | 10.3245 |
| Nabeul | 36.4561 | 10.7356 |
| Kairouan | 35.6781 | 10.0963 |
| Monastir | 35.7774 | 10.8264 |

## ✅ Checklist de Test

- [ ] Le service démarre sans erreur
- [ ] L'endpoint `/gestion-sites/geocode/search` répond
- [ ] Une recherche valide retourne des résultats
- [ ] Les résultats contiennent `lat` et `lng`
- [ ] Une recherche invalide retourne `success: false`
- [ ] Les adresses tunisiennes sont correctement géocodées
- [ ] Le frontend peut appeler l'endpoint
- [ ] Les coordonnées sont affichées sur la carte
- [ ] L'utilisateur peut sélectionner parmi plusieurs résultats

## 🐛 Dépannage

### Problème : "Aucune adresse trouvée"

**Solution** : Vérifiez que l'adresse est suffisamment précise. Ajoutez le pays ou la ville.

### Problème : "Too Many Requests" (429)

**Solution** : Attendez quelques secondes entre les requêtes. Nominatim limite à 1 requête/seconde.

### Problème : Timeout

**Solution** : Vérifiez votre connexion internet. L'API Nominatim est externe.

### Problème : Coordonnées incorrectes

**Solution** : Vérifiez que l'adresse est correctement orthographiée. Essayez avec plus de détails.
