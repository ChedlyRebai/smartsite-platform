# 🧪 Guide de Test Rapide - 5 Minutes

## 🎯 Objectif

Tester rapidement toutes les nouvelles fonctionnalités en 5 minutes.

---

## ⚡ Test Rapide (5 min)

### 1️⃣ Test Affichage Chantier (1 min)

**Actions** :
1. Ouvrir la liste des matériaux
2. Chercher un matériau assigné à un chantier
3. Vérifier la colonne "Site"

**Résultat attendu** :
```
✅ Colonne "Site" affiche le nom du chantier
✅ Pas de colonne "Emplacement"
```

---

### 2️⃣ Test Bouton Commander (1 min)

**Actions** :
1. Trouver un matériau avec quantité = 0 ou stock bas
2. Vérifier la présence du bouton "Commander"

**Résultat attendu** :
```
✅ Bouton rouge "Commander Urgent" si quantité = 0
✅ Bouton jaune "Commander" si stock bas
✅ Pas de bouton si stock suffisant
```

---

### 3️⃣ Test Météo (1 min)

**Actions** :
1. Cliquer sur l'icône 👁️ d'un matériau assigné à un chantier
2. Scroller jusqu'à la card "Météo du Chantier"

**Résultat attendu** :
```
✅ Card météo affichée
✅ Emoji météo visible (☀️🌧️❄️⛈️💨☁️)
✅ Température, humidité, vent affichés
✅ Nom de la ville affiché
```

---

### 4️⃣ Test Prédiction IA (1 min)

**Actions** :
1. Dans les détails du matériau
2. Scroller jusqu'à la card "Prédiction IA"

**Résultat attendu** :
```
✅ Card prédiction affichée
✅ Statut visible (OK/Attention/Critique)
✅ Consommation affichée
✅ Temps avant rupture affiché
✅ Quantité recommandée affichée
✅ Message d'impact météo affiché
```

---

### 5️⃣ Test Commande (1 min)

**Actions** :
1. Cliquer sur le bouton "Commander"
2. Vérifier le dialog

**Résultat attendu** :
```
✅ Dialog s'ouvre
✅ Nom du matériau pré-rempli
✅ Site de livraison pré-rempli
✅ Quantité recommandée pré-remplie
```

---

## 🐛 Problèmes Courants

### Météo ne s'affiche pas

**Cause** : Matériau non assigné à un chantier ou chantier sans GPS

**Solution** :
1. Assigner le matériau à un chantier
2. Vérifier que le chantier a des coordonnées GPS

### Bouton Commander n'apparaît pas

**Cause** : Stock suffisant

**Solution** :
1. Réduire la quantité à 0 ou en dessous du stock minimum
2. Actualiser la page

### Prédiction ne se charge pas

**Cause** : Pas de données historiques

**Solution** :
1. Attendre d'avoir des mouvements de stock
2. Ou entraîner le modèle ML manuellement

---

## ✅ Checklist Rapide

- [ ] Colonne "Site" visible dans la liste
- [ ] Bouton "Commander" s'affiche si stock bas
- [ ] Météo s'affiche dans les détails
- [ ] Prédiction IA s'affiche dans les détails
- [ ] Dialog de commande s'ouvre avec infos pré-remplies

---

## 🎉 Si Tous les Tests Passent

**Félicitations !** 🎊

Toutes les fonctionnalités sont opérationnelles !

Vous pouvez maintenant :
1. Former les utilisateurs
2. Déployer en production
3. Surveiller les métriques

---

## 📞 En Cas de Problème

1. Vérifier la console du navigateur (F12)
2. Vérifier les logs du backend
3. Consulter la documentation complète
4. Contacter le support technique

---

**Temps total** : 5 minutes  
**Difficulté** : Facile  
**Prérequis** : Backend et frontend démarrés
