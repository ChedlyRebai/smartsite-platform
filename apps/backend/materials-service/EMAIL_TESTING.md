# 📧 Guide de Test des Emails d'Alerte SmartSite

## Configuration Ethereal Email

Le service materials est configuré pour utiliser **Ethereal Email** pour tester l'envoi d'emails sans envoyer de vrais emails.

### Identifiants Ethereal Email

Les identifiants sont déjà configurés dans le fichier `.env` :

```env
EMAIL_USER=kacey8@ethereal.email
EMAIL_PASSWORD=mkWqQzs2q2wPvJStAu
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
ADMIN_EMAIL=kacey8@ethereal.email
```

## 🧪 Comment Tester l'Envoi d'Emails

### 1. Démarrer le Service Materials

```bash
cd apps/backend/materials-service
npm start
```

### 2. Tester l'Envoi d'Email via API

#### Option A : Utiliser cURL (Windows PowerShell)

```powershell
Invoke-RestMethod -Uri "http://localhost:3002/api/materials/email/test" -Method POST -ContentType "application/json" -Body '{}'
```

#### Option B : Utiliser cURL avec email personnalisé

```powershell
$body = @{
    email = "kacey8@ethereal.email"
    materialName = "Ciment Portland"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/materials/email/test" -Method POST -ContentType "application/json" -Body $body
```

#### Option C : Utiliser Postman ou Insomnia

- **URL**: `http://localhost:3002/api/materials/email/test`
- **Méthode**: POST
- **Headers**: `Content-Type: application/json`
- **Body** (optionnel):
```json
{
  "email": "kacey8@ethereal.email",
  "materialName": "Ciment Portland"
}
```

### 3. Voir les Emails Envoyés

1. Allez sur **https://ethereal.email/messages**
2. Connectez-vous avec les identifiants :
   - **Username**: `kacey8@ethereal.email`
   - **Password**: `mkWqQzs2q2wPvJStAu`
3. Vous verrez tous les emails envoyés par le système

## 📨 Types d'Alertes Email

Le système envoie des emails d'alerte dans les cas suivants :

### 1. **Sortie Excessive (EXCESSIVE_OUT)** 🚨
- Détecté quand la quantité sortie dépasse significativement la consommation normale
- **Risque** : Vol ou gaspillage de matériaux
- **Couleur** : Rouge (#dc2626)

### 2. **Stock de Sécurité Critique (BELOW_SAFETY_STOCK)** ⚠️
- Détecté quand le stock descend en dessous du seuil de sécurité
- **Risque** : Rupture de stock imminente
- **Couleur** : Orange (#f59e0b)

### 3. **Entrée Anormalement Élevée (EXCESSIVE_IN)** 📦
- Détecté quand une entrée de stock est anormalement élevée
- **Risque** : Erreur de saisie ou sur-commande
- **Couleur** : Bleu (#3b82f6)

## 📊 Contenu de l'Email d'Alerte

Chaque email d'alerte contient :

- **En-tête** : Logo SmartSite et titre
- **Bannière d'alerte** : Type d'anomalie avec emoji et couleur
- **Informations détaillées** :
  - Nom et code du matériau
  - Nom du chantier
  - Date et heure de l'anomalie
  - Type de mouvement (ENTRÉE/SORTIE)
  - Quantité concernée
  - Quantité normale attendue
  - Pourcentage de déviation
  - Stock avant et après le mouvement
  - Raison (si fournie)
- **Message d'alerte** : Description détaillée de l'anomalie
- **Actions recommandées** :
  1. Vérifier la consommation réelle sur site
  2. Ajuster les seuils de commande si nécessaire
  3. Passer une commande de réapprovisionnement si stock critique

## 🔧 Configuration pour Production

Pour utiliser un vrai service d'email en production (Gmail, SendGrid, etc.), modifiez le fichier `.env` :

### Exemple avec Gmail :

```env
EMAIL_USER=votre.email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_application
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ADMIN_EMAIL=admin@votreentreprise.com
```

**Note** : Pour Gmail, vous devez créer un "Mot de passe d'application" dans les paramètres de sécurité de votre compte Google.

### Exemple avec SendGrid :

```env
EMAIL_USER=apikey
EMAIL_PASSWORD=votre_clé_api_sendgrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
ADMIN_EMAIL=admin@votreentreprise.com
```

## 🧪 Scénarios de Test

### Test 1 : Alerte de Sortie Excessive

```bash
# Créer un mouvement de sortie anormal via l'API
POST /api/flows
{
  "materialId": "...",
  "siteId": "...",
  "flowType": "OUT",
  "quantity": 500,  # Quantité anormalement élevée
  "reason": "Test d'alerte"
}
```

### Test 2 : Alerte de Stock Critique

```bash
# Réduire le stock d'un matériau en dessous du seuil de sécurité
PUT /api/materials/:id/stock
{
  "quantity": 5,  # Stock très bas
  "operation": "set"
}
```

## 📝 Logs

Les logs d'envoi d'email sont visibles dans la console du service materials :

```
[AnomalyEmailService] Email transporter configured for anomaly alerts
[AnomalyEmailService] Anomaly email sent to kacey8@ethereal.email
```

En cas d'erreur :

```
[AnomalyEmailService] Failed to send anomaly email: [error message]
```

## 🔍 Dépannage

### Problème : Email non reçu

1. Vérifiez que le service materials est démarré
2. Vérifiez les logs pour voir si l'email a été envoyé
3. Vérifiez les identifiants Ethereal Email dans `.env`
4. Allez sur https://ethereal.email/messages et connectez-vous

### Problème : Erreur SMTP

1. Vérifiez que le port 587 n'est pas bloqué par un firewall
2. Vérifiez les identifiants SMTP dans `.env`
3. Vérifiez que `SMTP_HOST` est correct

## 📚 Ressources

- **Ethereal Email** : https://ethereal.email/
- **Nodemailer Documentation** : https://nodemailer.com/
- **Code Source** : `apps/backend/materials-service/src/common/email/anomaly-email.service.ts`
