# 🚀 Test Rapide de l'Email d'Alerte

## Étape 1 : Démarrer le service

```bash
cd apps/backend/materials-service
npm start
```

## Étape 2 : Tester l'envoi d'email

### Windows PowerShell :

```powershell
Invoke-RestMethod -Uri "http://localhost:3002/api/materials/email/test" -Method POST -ContentType "application/json" -Body '{}'
```

## Étape 3 : Voir l'email

1. Allez sur : **https://ethereal.email/messages**
2. Connectez-vous avec :
   - **Email** : `kacey8@ethereal.email`
   - **Password** : `mkWqQzs2q2wPvJStAu`
3. Vous verrez l'email d'alerte avec un design professionnel !

## Résultat Attendu

```json
{
  "success": true,
  "message": "Email de test envoyé avec succès à kacey8@ethereal.email",
  "info": "Vérifiez votre boîte de réception Ethereal Email sur https://ethereal.email/messages",
  "etherealUrl": "https://ethereal.email/messages",
  "credentials": {
    "username": "kacey8@ethereal.email",
    "note": "Connectez-vous sur https://ethereal.email avec ces identifiants pour voir l'email"
  }
}
```

## 📧 L'Email Contient :

- 🚨 **Alerte** : Sortie excessive détectée
- 📋 **Matériau** : Ciment Portland (Test)
- 🏗️ **Chantier** : Chantier Test - Site Nord
- 🔢 **Quantité** : 150 unités (200% au-dessus de la normale)
- 📈 **Stock avant** : 200 unités
- 📉 **Stock après** : 50 unités
- ⚠️ **Déviation** : +200% au-dessus de la normale
- 💬 **Message** : Risque de vol ou gaspillage

## 🎨 Design de l'Email

L'email a un design professionnel avec :
- En-tête avec logo SmartSite
- Bannière d'alerte rouge pour les sorties excessives
- Tableau d'informations détaillées
- Boîte d'avertissement
- Actions recommandées
- Footer avec copyright

## 🔄 Tester avec des Données Personnalisées

```powershell
$body = @{
    email = "kacey8@ethereal.email"
    materialName = "Béton Prêt à l'Emploi"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/materials/email/test" -Method POST -ContentType "application/json" -Body $body
```
