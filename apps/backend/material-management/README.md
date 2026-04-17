# Material Management Microservice

Ce microservice gère les matériaux (materials) pour SmartSite.

## Fonctionnalités

- CRUD complet des matériaux
- Validation des champs (code unique, unité enum, prix positif, seuil positif)
- Référence aux fournisseurs (supplier_id) avec vérification d'existence
- Soft delete (is_active)
- Authentification JWT (compatible avec user-authentication et supplier-management)

## Installation

```bash
npm install
```

## Configuration

`.env` :

```env
PORT=3006
MONGODB_URI=mongodb://localhost:27017/smartsite
JWT_SECRET=smartiste_secret_key_change_this_in_production
```

**Important** : Le `JWT_SECRET` doit être le même que dans les autres microservices.

## Développement

```bash
npm run start:dev
```

Service sur http://localhost:3006

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/materials` | Créer un matériau |
| GET | `/materials` | Lister tous les matériaux (avec populate fournisseur) |
| GET | `/materials/:id` | Récupérer un matériau |
| GET | `/materials/suppliers/active` | Lister les fournisseurs actifs (pour dropdown) |
| PATCH | `/materials/:id` | Modifier un matériau |
| DELETE | `/materials/:id` | Désactiver un matériau |
| POST | `/materials/:id/reactivate` | Réactiver un matériau |

## Validation

- **code** : requis, unique, max 50 caractères
- **name** : requis, max 100 caractères
- **unit** : requis, une des valeurs: `bag`, `kg`, `m²`, `ton`, `piece`
- **estimated_price** : requis, nombre >= 0
- **alert_threshold** : requis, nombre >= 0
- **supplier_id** : requis, ObjectId d'un fournisseur actif

## Exemple cURL

```bash
curl -X POST http://localhost:3006/materials \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CIM-35",
    "name": "Cement 35kg",
    "unit": "bag",
    "estimated_price": 8.50,
    "alert_threshold": 50,
    "supplier_id": "64a1b2c3d4e5f67890123456"
  }'
```

## Intégration Frontend

Le frontend utilise `material.action.ts` (port 3006) avec le token JWT.
