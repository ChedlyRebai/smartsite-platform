# 🧪 Guide de Test Final - 5 Minutes

## ✅ Test 1: Météo Automatique (1 minute)

### Étapes:
1. Ouvrez la console du navigateur (F12)
2. Allez dans "Matériaux" → Cliquez sur l'icône "Prédiction IA" (cerveau violet)
3. **Vérifiez les logs**:
   ```
   🔍 Step 1: Récupération du matériau
   🔍 Step 2: Récupération du chantier
   🔍 Step 3: Vérification des coordonnées GPS
   🔍 Step 4: Récupération de la météo
   ✅ Réponse API météo: {success: true, ...}
   ```
4. **Vérifiez l'affichage**: Encadré vert avec météo, température, condition

### ✅ Résultat Attendu:
- Météo chargée en <2 secondes
- Encadré vert avec toutes les infos
- Champ météo verrouillé

---

## ✅ Test 2: Historique Automatique (1 minute)

### Étapes:
1. Allez dans "Consommation"
2. Sélectionnez un chantier
3. Ajoutez une consommation: 10 unités
4. Cliquez sur "Historique"
5. **Vérifiez**: Nouvelle entrée avec quantité 10, type OUT, date actuelle

### ✅ Résultat Attendu:
- Entrée créée immédiatement
- Toutes les infos correctes
- Auto-refresh fonctionnel

---

## ✅ Test 3: Rapport IA - Consommation Normale (1 minute)

### Étapes:
1. Allez dans "Consommation"
2. Cliquez sur "Rapport IA" (bouton violet)
3. Attendez la génération (2-3 secondes)
4. **Vérifiez**:
   - Statistiques affichées
   - Niveau de risque: LOW ou MEDIUM
   - Recommandations présentes

### ✅ Résultat Attendu:
- Rapport généré avec succès
- Statistiques correctes
- Interface claire et lisible

---

## ✅ Test 4: Détection de Vol (2 minutes)

### Étapes:
1. Allez dans "Consommation"
2. Ajoutez une consommation TRÈS ÉLEVÉE: 1000 unités
3. Allez dans "Historique" → Vérifiez l'entrée
4. Cliquez sur "Rapport IA"
5. **Vérifiez**:
   - Alerte 🚨 "VOL_POSSIBLE"
   - Niveau de risque: CRITICAL (rouge)
   - Recommandation: "Enquête immédiate recommandée"

### ✅ Résultat Attendu:
- Alerte critique affichée
- Badge rouge "CRITIQUE"
- Recommandations d'urgence

---

## 🔍 Débogage Rapide

### Problème: Météo ne se charge pas
**Solution**: Regardez les logs dans la console (F12)
- Si Step 1 échoue → Problème de récupération du matériau
- Si Step 2 échoue → Problème d'API sites
- Si Step 3 échoue → Coordonnées GPS manquantes
- Si Step 4 échoue → Problème d'API météo

### Problème: Historique ne se crée pas
**Solution**: Vérifiez les logs backend
```bash
# Dans le terminal du service materials-service
# Cherchez:
✅ Historique créé: 10 unite consommé(s) sur site ...
```

### Problème: Rapport IA ne se génère pas
**Solution**: Vérifiez qu'il y a des données d'historique
- Il faut au moins 1 entrée dans l'historique
- Période d'analyse: 30 jours par défaut

---

## 📊 Résultats Attendus

### Météo:
- ✅ Chargement automatique
- ✅ Affichage complet
- ✅ Champ verrouillé

### Historique:
- ✅ Création automatique
- ✅ Affichage immédiat
- ✅ Toutes les métadonnées

### Rapport IA:
- ✅ Génération rapide (<3s)
- ✅ Alertes par sévérité
- ✅ Recommandations personnalisées
- ✅ Niveau de risque visuel

---

## 🎉 Succès!

Si tous les tests passent:
- ✅ Météo fonctionnelle
- ✅ Historique fonctionnel
- ✅ Rapport IA fonctionnel
- ✅ Détection d'anomalies fonctionnelle

**Le système est opérationnel! 🚀**

---

## 📞 Support

Si un test échoue:
1. Vérifiez les logs de la console (F12)
2. Vérifiez les logs du backend
3. Vérifiez que MongoDB est accessible
4. Vérifiez que le service materials-service tourne sur le port 3002

**Commande de vérification**:
```bash
curl http://localhost:3002/api/materials/health
```
