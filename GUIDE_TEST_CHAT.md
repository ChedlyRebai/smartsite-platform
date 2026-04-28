# 🧪 Guide de Test - Chat avec Analyse IA

## 🚀 Démarrage

### Backend
```bash
cd apps/backend/materials-service
npm run dev
```

### Frontend
```bash
cd apps/frontend
npm run dev
```

---

## ✅ Tests à Effectuer

### 1. Test Connexion WebSocket

**Objectif**: Vérifier que la connexion WebSocket s'établit correctement

**Étapes**:
1. Ouvrir le frontend (http://localhost:5173)
2. Naviguer vers une commande avec chat
3. Ouvrir la console développeur (F12)
4. Vérifier les logs:
   ```
   ✅ Chat WebSocket connected
   ```

**Résultat attendu**: Connexion établie sans erreur

---

### 2. Test Analyse IA - Message Normal

**Objectif**: Vérifier l'analyse d'un message professionnel

**Étapes**:
1. Dans le chat, taper: "Bonjour, pouvez-vous confirmer la livraison ?"
2. Observer l'interface

**Résultat attendu**:
- ✅ Message envoyé sans blocage
- ✅ Pas de suggestion affichée
- ✅ Émotion affichée sous le message: 😌 calm
- ✅ Sentiment: 👌 neutral

---

### 3. Test Analyse IA - Message avec Tension (WARNING)

**Objectif**: Vérifier la détection de tension et suggestion

**Étapes**:
1. Dans le chat, taper: "C'est vraiment frustrant, vous êtes toujours en retard !"
2. Observer l'interface

**Résultat attendu**:
- ⚠️ Bannière jaune affichée
- ⚠️ Message: "Tension détectée. Voulez-vous envoyer une version améliorée ?"
- ⚠️ Suggestion affichée dans un encadré
- ⚠️ 3 boutons: "Utiliser suggestion" / "Envoyer quand même" / "Fermer"
- ⚠️ Émotion détectée: 😤 frustrated

**Actions possibles**:
- Cliquer "Utiliser suggestion" → Message remplacé par version améliorée
- Cliquer "Envoyer quand même" → Message original envoyé
- Cliquer "Fermer" → Suggestion fermée, message reste dans le champ

---

### 4. Test Analyse IA - Message Conflictuel (CONFLICT)

**Objectif**: Vérifier le blocage des messages agressifs

**Étapes**:
1. Dans le chat, taper: "Vous êtes incompétents ! C'est inacceptable !"
2. Observer l'interface

**Résultat attendu**:
- 🚫 Bannière rouge affichée
- 🚫 Message: "Conflit détecté. Message bloqué. Veuillez utiliser une version plus professionnelle."
- 🚫 Suggestion affichée
- 🚫 1 seul bouton: "Modifier le message"
- 🚫 Message NON envoyé
- 🚫 Émotion détectée: 😡 angry

**Action**:
- Cliquer "Modifier le message" → Champ rempli avec version améliorée

---

### 5. Test Picker Emojis

**Objectif**: Vérifier l'insertion d'emojis

**Étapes**:
1. Cliquer sur le bouton 😊 à côté du champ de saisie
2. Sélectionner un emoji (ex: 👍)
3. Observer le champ de saisie

**Résultat attendu**:
- ✅ Popup emoji s'ouvre au-dessus du champ
- ✅ Emoji inséré dans le texte: "Bonjour 👍"
- ✅ Popup se ferme automatiquement
- ✅ Click outside ferme le popup

---

### 6. Test Reconnexion WebSocket

**Objectif**: Vérifier que la reconnexion ne recharge pas tout

**Étapes**:
1. Ouvrir le chat avec quelques messages
2. Dans la console développeur, simuler déconnexion:
   ```javascript
   // Trouver le socket et le déconnecter
   window.socketInstance?.disconnect()
   ```
3. Attendre 2-3 secondes
4. Observer l'interface

**Résultat attendu**:
- 🔄 Bannière jaune: "Reconnexion en cours..."
- 🔄 Reconnexion automatique après 1-2 secondes
- ✅ Messages existants restent affichés (pas de reload)
- ✅ Nouveaux messages synchronisés
- ✅ Bannière disparaît

---

### 7. Test Affichage Émotions sur Messages

**Objectif**: Vérifier l'affichage des émotions

**Étapes**:
1. Envoyer plusieurs messages avec différentes émotions:
   - "Merci beaucoup !" → 😌 calm, 👍 positive
   - "Je suis un peu stressé par les délais" → 😰 stressed, 👎 negative
   - "C'est vraiment frustrant" → 😤 frustrated, 👎 negative
2. Observer sous chaque message

**Résultat attendu**:
- ✅ Icône émotion discrète sous le message
- ✅ Icône sentiment à côté
- ✅ Couleur selon émotion (vert/jaune/orange/rouge)
- ✅ Tooltip au survol avec détails
- ✅ Badge WARNING/CONFLICT si applicable

---

### 8. Test Nettoyage Rooms

**Objectif**: Vérifier que les rooms sont nettoyées

**Étapes**:
1. Ouvrir le chat
2. Fermer le dialogue chat
3. Vérifier les logs backend

**Résultat attendu (logs backend)**:
```
👤 User [nom] left room order-[orderId]
🧹 Cleaned up empty room: order-[orderId]
✅ Disconnection cleanup completed for user: [nom]
```

---

### 9. Test Upload Fichier avec Analyse

**Objectif**: Vérifier que l'upload fonctionne toujours

**Étapes**:
1. Cliquer sur le bouton 📎 (Paperclip)
2. Sélectionner une image
3. Observer l'envoi

**Résultat attendu**:
- ✅ Fichier uploadé
- ✅ Message avec aperçu image affiché
- ✅ Pas d'analyse IA (type !== 'text')

---

### 10. Test Indicateur Frappe (Typing)

**Objectif**: Vérifier l'indicateur "en train d'écrire"

**Étapes**:
1. Ouvrir 2 fenêtres du chat (même commande)
2. Dans fenêtre 1, commencer à taper
3. Observer fenêtre 2

**Résultat attendu**:
- ✅ Indicateur "Fournisseur est en train d'écrire..." dans fenêtre 2
- ✅ Disparaît après 3 secondes d'inactivité

---

## 🐛 Problèmes Connus et Solutions

### Problème: "Failed to resolve import socket.io-client"
**Solution**: 
```bash
cd apps/frontend
npm install socket.io-client
```

### Problème: Analyse IA ne fonctionne pas
**Vérification**:
1. Vérifier `.env` backend:
   ```
   OPENAI_API_KEY=sk-proj-...
   ```
2. Vérifier logs backend:
   ```
   ✅ AI Message Analyzer initialized
   ```

### Problème: Reconnexion en boucle
**Solution**: Vérifier que le backend est démarré sur port 3002

### Problème: Emojis ne s'affichent pas
**Vérification**:
```bash
cd apps/frontend
npm list emoji-picker-react
# Doit afficher: emoji-picker-react@4.x.x
```

---

## 📊 Checklist Complète

### Fonctionnalités Chat
- [ ] Connexion WebSocket établie
- [ ] Envoi/réception messages
- [ ] Upload fichiers/images
- [ ] Messages vocaux
- [ ] Partage localisation
- [ ] Appels audio/vidéo
- [ ] Indicateur frappe

### Analyse IA
- [ ] Message NORMAL → Pas de suggestion
- [ ] Message WARNING → Suggestion affichée, envoi autorisé
- [ ] Message CONFLICT → Message bloqué, suggestion obligatoire
- [ ] Émotions affichées sous messages
- [ ] Sentiments affichés
- [ ] Badges WARNING/CONFLICT

### Picker Emojis
- [ ] Bouton 😊 visible
- [ ] Popup s'ouvre
- [ ] Emoji inséré dans texte
- [ ] Fermeture automatique
- [ ] Click outside fonctionne

### Reconnexion
- [ ] Indicateur "Reconnexion en cours..."
- [ ] Reconnexion automatique
- [ ] Pas de reload complet
- [ ] Messages synchronisés

### Nettoyage
- [ ] Rooms nettoyées à la déconnexion
- [ ] Pas de memory leak
- [ ] Logs propres

---

## 🎯 Scénarios de Test Complets

### Scénario 1: Conversation Professionnelle
1. Utilisateur A: "Bonjour, pouvez-vous confirmer la livraison ?" → 😌 calm
2. Utilisateur B: "Oui, livraison prévue demain matin" → 😌 calm
3. Utilisateur A: "Parfait, merci ! 👍" → 😌 calm, 👍 positive

**Résultat**: Conversation fluide, pas de suggestions

### Scénario 2: Tension Gérée
1. Utilisateur A: "C'est frustrant, vous êtes en retard" → 😤 frustrated
2. Suggestion affichée: "Je constate un retard dans la livraison. Pouvez-vous me donner une estimation ?"
3. Utilisateur A accepte la suggestion
4. Message amélioré envoyé

**Résultat**: Tension détectée et désamorcée

### Scénario 3: Conflit Bloqué
1. Utilisateur A: "Vous êtes incompétents !" → 😡 angry
2. Message bloqué, suggestion obligatoire
3. Utilisateur A modifie: "Je suis préoccupé par la qualité du service"
4. Message professionnel envoyé

**Résultat**: Conflit évité, communication professionnelle maintenue

---

*Guide de test créé le 26 avril 2026*