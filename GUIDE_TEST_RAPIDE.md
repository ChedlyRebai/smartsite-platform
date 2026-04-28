# 🧪 Guide de Test Rapide - Météo et Historique

## 🎯 Objectif
Vérifier que la météo se charge automatiquement et que l'historique se sauvegarde correctement.

---

## ✅ Test 1: Météo Automatique (2 minutes)

### Étapes:
1. **Ouvrir la console du navigateur**
   - Appuyez sur `F12`
   - Allez dans l'onglet "Console"

2. **Ouvrir un matériau assigné**
   - Allez dans "Matériaux"
   - Cliquez sur l'icône "Prédiction IA" (cerveau violet) d'un matériau

3. **Vérifier les logs dans la console**
   Vous devriez voir:
   ```
   🔍 Step 1: Récupération du matériau [ID]
   ✅ Matériau récupéré: {siteId: "...", ...}
   🔍 Step 2: Récupération du chantier [ID]
   ✅ Réponse API sites: {success: true, data: {...}}
   🔍 Step 3: Vérification des coordonnées GPS
   Coordonnées trouvées: {latitude: 36.8065, longitude: 10.1815}
   🔍 Step 4: Récupération de la météo
   Coordonnées utilisées: {lat: 36.8065, lng: 10.1815}
   ✅ Réponse API météo: {success: true, weather: {...}}
   ```

4. **Vérifier l'affichage**
   - ✅ Encadré vert "Météo Automatique"
   - ✅ Nom du chantier affiché
   - ✅ Description météo (ex: "ciel dégagé")
   - ✅ Température (ex: "23°C")
   - ✅ Condition (ex: "Ensoleillé")

### ❌ Si ça ne marche pas:
- Regardez les logs dans la console
- Identifiez l'étape qui échoue
- Vérifiez que le matériau est bien assigné à un chantier
- Vérifiez que le chantier a des coordonnées GPS

---

## ✅ Test 2: Historique Automatique (3 minutes)

### Étapes:
1. **Aller dans l'onglet Consommation**
   - Cliquez sur "Consommation" dans les onglets

2. **Sélectionner un chantier**
   - Choisissez un chantier dans le menu déroulant

3. **Ajouter une consommation**
   - Trouvez un matériau dans la liste
   - Entrez une quantité (ex: 10)
   - Cliquez sur "Ajouter consommation"
   - ✅ Vous devriez voir: "10 unite consomme(s)"

4. **Vérifier l'historique**
   - Cliquez sur le sous-onglet "Historique"
   - ✅ Une nouvelle entrée devrait apparaître immédiatement
   - ✅ Vérifiez les détails:
     - Matériau correct
     - Quantité: 10
     - Type: OUT (sortie)
     - Date/heure actuelle

5. **Vérifier les logs backend** (optionnel)
   - Ouvrez les logs du service materials-service
   - Vous devriez voir:
   ```
   +10 consomme: site=..., material=..., nouveau total=...
   ✅ Historique créé: 10 unite consommé(s) sur site ...
   ```

### ❌ Si ça ne marche pas:
- Vérifiez que le service materials-service est démarré
- Vérifiez les logs backend pour voir les erreurs
- Vérifiez la base de données MongoDB:
  ```javascript
  use smartmaterials
  db.consumptionhistories.find().sort({createdAt: -1}).limit(5)
  ```

---

## ✅ Test 3: Mise à Jour de Consommation (2 minutes)

### Étapes:
1. **Modifier une consommation existante**
   - Dans l'onglet "Consommation"
   - Cliquez sur l'icône "Modifier" (crayon) d'un matériau
   - Changez la quantité consommée
   - Cliquez sur "Mettre à jour"

2. **Vérifier l'historique**
   - Allez dans le sous-onglet "Historique"
   - ✅ Une nouvelle entrée devrait apparaître
   - ✅ Type: OUT ou ADJUSTMENT selon le changement

---

## 🔍 Débogage Rapide

### Problème: "Météo non disponible"
**Vérifications:**
1. Le matériau est-il assigné à un chantier?
   - Ouvrez la console: `🔍 Step 1: Récupération du matériau`
   - Vérifiez `siteId` dans les logs

2. Le chantier a-t-il des coordonnées GPS?
   - Regardez les logs: `Coordonnées trouvées: {...}`
   - Vérifiez que `latitude` et `longitude` existent

3. L'API météo répond-elle?
   - Regardez les logs: `✅ Réponse API météo`
   - Vérifiez `success: true` et `weather: {...}`

### Problème: "Historique ne se crée pas"
**Vérifications:**
1. Le backend est-il démarré?
   ```bash
   # Vérifiez que le service tourne sur le port 3002
   curl http://localhost:3002/api/materials/health
   ```

2. MongoDB est-il accessible?
   ```bash
   # Connectez-vous à MongoDB
   mongosh
   use smartmaterials
   db.consumptionhistories.countDocuments()
   ```

3. Y a-t-il des erreurs dans les logs backend?
   - Cherchez: `❌ Erreur création historique`

---

## 📊 Résultats Attendus

### Météo:
- ✅ Chargement automatique en <2 secondes
- ✅ Affichage dans un encadré vert
- ✅ Toutes les informations présentes
- ✅ Champ météo verrouillé

### Historique:
- ✅ Création automatique à chaque action
- ✅ Affichage immédiat dans l'onglet Historique
- ✅ Toutes les métadonnées correctes
- ✅ Statistiques mises à jour

---

## 🎉 Succès!

Si tous les tests passent:
- ✅ La météo se charge automatiquement
- ✅ L'historique se sauvegarde automatiquement
- ✅ L'interface se rafraîchit automatiquement
- ✅ Tout fonctionne comme prévu!

**Félicitations! Le système est opérationnel! 🚀**
