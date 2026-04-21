# Configuration du Chat AI (Groq - Gratuit)

Tous les services backend ont maintenant un module de chat AI intégré utilisant **Groq** (gratuit, rapide, compatible OpenAI).

## 🔑 Obtenir ta clé API Groq (gratuite)

1. Va sur [console.groq.com](https://console.groq.com)
2. Crée un compte (gratuit, pas de carte bancaire)
3. Va dans **API Keys** → **Create API Key**
4. Copie la clé (commence par `gsk_...`)

## ⚙️ Configuration

Dans **chaque service** où tu veux activer le chat, crée un fichier `.env` :

```env
# Groq API (gratuit)
GROQ_API_KEY=gsk_ta_clé_ici
GROQ_MODEL=llama-3.3-70b-versatile

# MongoDB
MONGODB_URI=mongodb://localhost:27017/smartsite
```

**Services disponibles :**
- `gestion-fournisseurs`
- `gestion-planing`
- `gestion-projects`
- `gestion-site`
- `incident-management`
- `materials-service`
- `notification`
- `paiement`
- `resource-optimization`

## 🚀 Utilisation

### Endpoint
```
POST http://localhost:PORT/chat/message
Content-Type: application/json
```

### Exemple de requête
```json
{
  "message": "Comment créer un nouveau projet ?",
  "conversationHistory": []
}
```

### Exemple avec historique
```json
{
  "message": "Et pour le budget ?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Comment créer un nouveau projet ?"
    },
    {
      "role": "assistant",
      "content": "Pour créer un projet, allez dans..."
    }
  ]
}
```

### Réponse
```json
{
  "success": true,
  "data": {
    "reply": "Pour définir le budget d'un projet...",
    "usage": {
      "prompt_tokens": 45,
      "completion_tokens": 120,
      "total_tokens": 165
    }
  }
}
```

## 🎯 Modèles disponibles (Groq)

- `llama-3.3-70b-versatile` (recommandé, par défaut)
- `llama-3.1-8b-instant` (plus rapide, moins précis)
- `mixtral-8x7b-32768` (bon équilibre)
- `gemma2-9b-it` (léger et rapide)

Change le modèle dans `.env` :
```env
GROQ_MODEL=llama-3.1-8b-instant
```

## 📊 Limites gratuites Groq

- **Requêtes/jour** : 14,400 (très généreux)
- **Tokens/minute** : 30,000
- **Pas de carte bancaire requise**

## 🔧 Contexte par service

Chaque service a un **system prompt** personnalisé :

- **gestion-projects** : aide sur la gestion de projets, budgets, timelines
- **gestion-site** : aide sur les sites de construction, équipements
- **materials-service** : aide sur les matériaux, inventaire, QR codes
- **notification** : aide sur les alertes et notifications
- **paiement** : aide sur les factures et paiements
- etc.

L'AI adapte ses réponses au contexte du service.

## 🛠️ Dépannage

### Erreur "Invalid API Key"
- Vérifie que ta clé commence par `gsk_`
- Vérifie qu'elle est bien dans le fichier `.env`
- Redémarre le service après avoir ajouté la clé

### Erreur "Rate limit exceeded"
- Attends quelques secondes et réessaie
- Groq a des limites par minute (30k tokens/min)

### Pas de réponse
- Vérifie que le service est démarré
- Vérifie les logs du service
- Teste avec Postman ou curl

## 🔄 Alternatives

Si tu veux utiliser un autre provider :

### Google Gemini (gratuit aussi)
```typescript
// Installer : npm install @google/generative-ai
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
```

### OpenAI (payant)
```typescript
// Changer dans chat.service.ts
this.openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Retirer baseURL
});
// Model: gpt-4o ou gpt-3.5-turbo
```
