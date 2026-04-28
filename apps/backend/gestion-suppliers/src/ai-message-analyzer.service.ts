import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface MessageAnalysisResult {
  status: 'NORMAL' | 'WARNING' | 'CONFLICT';
  sentiment: 'positive' | 'neutral' | 'negative';
  emotion: 'calm' | 'stressed' | 'frustrated' | 'angry';
  toxicity: 'none' | 'low' | 'medium' | 'high';
  bad_words: boolean;
  conflict_level: 'none' | 'low' | 'medium' | 'high';
  escalation_risk: 'low' | 'medium' | 'high';
  allow_send: boolean;
  show_suggestion: boolean;
  improved_message: string;
  ui_message: string;
  confidence: number;
  explanation: string;
}

// Mots d'agression directe (améliorés)
const ANGER_WORDS = [
  // Anglais
  'angry',
  'anger',
  'furious',
  'rage',
  'mad',
  'outraged',
  'pissed',
  'shit',
  'fuck',
  'damn',
  'hell',
  'crap',
  'ass',
  'bastard',
  'bitch',
  'idiot',
  'stupid',
  'moron',
  'hate',
  'kill',
  'destroy',
  'die',
  // Français
  'merde',
  'putain',
  'con',
  'connard',
  'connasse',
  'idiot',
  'imbécile',
  'nul',
  'naze',
  'crétin',
  'abruti',
  'salaud',
  'enfoiré',
  'salope',
  'chier',
  'foutre',
  'bordel',
  'crever',
  'tuer',
];

// Expressions de frustration (améliorées)
const FRUSTRATION_WORDS = [
  // Anglais
  'bad',
  'terrible',
  'horrible',
  'awful',
  'worst',
  'useless',
  'pathetic',
  'ridiculous',
  'unacceptable',
  'disgusting',
  'disappointed',
  'frustrated',
  'annoyed',
  'fed up',
  'sick of',
  'tired of',
  'enough',
  'stop',
  // Français
  'mauvais',
  'nul',
  'horrible',
  'inacceptable',
  'décevant',
  'frustrant',
  'agaçant',
  'énervant',
  'catastrophique',
  'lamentable',
  'pitoyable',
  'marre',
  'assez',
  'stop',
  'arrête',
  'arrêtez',
];

// Patterns de ponctuation agressive (améliorés)
const AGGRESSIVE_PATTERNS = [
  /!{2,}/, // !! ou !!!
  /\?{2,}/, // ?? ou ???
  /[A-Z]{4,}/, // TOUT EN MAJUSCULES (4+ lettres)
  /:\(/, // :(
  />:\(/, // >:(
  /\b[A-Z]+\s+[A-Z]+\b/, // MOTS EN MAJUSCULES
  /\.{3,}/, // ... (frustration)
];

@Injectable()
export class AiMessageAnalyzerService {
  private readonly logger = new Logger(AiMessageAnalyzerService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        '⚠️ OpenAI API key not configured. AI message analysis will be disabled.',
      );
    } else {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('✅ AI Message Analyzer initialized');
    }
  }

  async analyzeMessage(
    message: string,
    senderRole: string,
  ): Promise<MessageAnalysisResult> {
    this.logger.log(
      `🔍 Analyzing message: "${message.substring(0, 50)}..." (role: ${senderRole})`,
    );

    if (!this.openai) {
      this.logger.warn(
        '⚠️ OpenAI not available, using enhanced local analysis',
      );
      return this.getEnhancedLocalAnalysis(message);
    }

    // 🔥 ÉTAPE 1: Détection de mots négatifs (PRIORITAIRE)
    const wordDetection = this.detectNegativeWords(message);
    if (wordDetection.detected) {
      this.logger.log(
        `✅ Negative words detected: ${wordDetection.emotion} (confidence: ${wordDetection.confidence}%)`,
      );

      if (wordDetection.emotion === 'angry') {
        const improvedMessage = await this.generateImprovedMessage(message);
        return {
          status: 'CONFLICT',
          sentiment: 'negative',
          emotion: 'angry',
          toxicity: 'medium',
          bad_words: true,
          conflict_level: 'medium',
          escalation_risk: 'high',
          allow_send: false,
          show_suggestion: true,
          improved_message: improvedMessage,
          ui_message: 'Message inapproprié détecté. Veuillez reformuler.',
          confidence: wordDetection.confidence,
          explanation: `Mot(s) inapproprié(s) détecté(s): ${wordDetection.matchedWords.join(', ')}`,
        };
      }

      if (wordDetection.emotion === 'frustrated') {
        const improvedMessage = await this.generateImprovedMessage(message);
        return {
          status: 'WARNING',
          sentiment: 'negative',
          emotion: 'frustrated',
          toxicity: 'low',
          bad_words: false,
          conflict_level: 'low',
          escalation_risk: 'medium',
          allow_send: true,
          show_suggestion: true,
          improved_message: improvedMessage,
          ui_message: 'Tension détectée. Voulez-vous améliorer votre message ?',
          confidence: wordDetection.confidence,
          explanation: `Expression négative: ${wordDetection.matchedWords.join(', ')}`,
        };
      }
    }

    // 🔥 ÉTAPE 2: Détection d'émojis (améliorée)
    const emojiDetection = this.detectEmojiEmotion(message);
    if (emojiDetection) {
      this.logger.log(
        `✅ Emoji detected: ${emojiDetection.emotion} (confidence: ${emojiDetection.confidence}%)`,
      );
      const improvedMessage = await this.generateImprovedMessage(message);
      return {
        status: emojiDetection.emotion === 'angry' ? 'CONFLICT' : 'WARNING',
        sentiment: 'negative',
        emotion: emojiDetection.emotion,
        toxicity: emojiDetection.emotion === 'angry' ? 'medium' : 'low',
        bad_words: false,
        conflict_level: emojiDetection.emotion === 'angry' ? 'medium' : 'low',
        escalation_risk: emojiDetection.emotion === 'angry' ? 'high' : 'medium',
        allow_send: emojiDetection.emotion !== 'angry',
        show_suggestion: true,
        improved_message: improvedMessage,
        ui_message:
          emojiDetection.emotion === 'angry'
            ? 'Émotion de colère détectée. Veuillez reformuler votre message de manière professionnelle.'
            : 'Frustration détectée. Voulez-vous envoyer une version plus calme ?',
        confidence: emojiDetection.confidence,
        explanation: `Emoji de ${emojiDetection.emotion === 'angry' ? 'colère' : 'frustration'} détecté dans le message`,
      };
    }

    // 🔥 ÉTAPE 3: Appel OpenAI pour les cas ambigus
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(message, senderRole);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      this.logger.log(`✅ Message analyzed via OpenAI: ${result.status}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ OpenAI analysis error: ${error.message}`);
      return this.getEnhancedLocalAnalysis(message);
    }
  }

  /**
   * 🔥 AMÉLIORATION: Détection de mots négatifs plus précise
   */
  private detectNegativeWords(content: string): {
    detected: boolean;
    emotion: 'angry' | 'frustrated' | null;
    matchedWords: string[];
    confidence: number;
  } {
    const lowerMessage = content.toLowerCase();
    const words = lowerMessage.split(/\s+/);

    // Vérifier mots de colère (priorité haute) - recherche exacte uniquement
    const angerMatches = ANGER_WORDS.filter((word) => {
      // Recherche exacte dans les mots ou dans le message complet
      return (
        words.some((w) => {
          const cleanWord = w.replace(/[^a-zàâäéèêëïîôöùûüÿç]/g, '');
          return cleanWord === word;
        }) ||
        lowerMessage.includes(` ${word} `) ||
        lowerMessage.startsWith(`${word} `) ||
        lowerMessage.endsWith(` ${word}`)
      );
    });

    // Vérifier mots de frustration - recherche exacte uniquement
    const frustrationMatches = FRUSTRATION_WORDS.filter((word) => {
      return (
        words.some((w) => {
          const cleanWord = w.replace(/[^a-zàâäéèêëïîôöùûüÿç]/g, '');
          return cleanWord === word;
        }) ||
        lowerMessage.includes(` ${word} `) ||
        lowerMessage.startsWith(`${word} `) ||
        lowerMessage.endsWith(` ${word}`)
      );
    });

    // Vérifier patterns agressifs
    const patternMatches = AGGRESSIVE_PATTERNS.filter((pattern) =>
      pattern.test(content),
    );

    // Calculer le score de colère
    const angerScore = angerMatches.length * 20 + patternMatches.length * 10;
    const frustrationScore =
      frustrationMatches.length * 15 + patternMatches.length * 5;

    if (angerMatches.length > 0) {
      return {
        detected: true,
        emotion: 'angry',
        matchedWords: angerMatches,
        confidence: Math.min(95, 70 + angerScore),
      };
    }

    if (frustrationMatches.length > 0 || patternMatches.length >= 2) {
      return {
        detected: true,
        emotion: 'frustrated',
        matchedWords: [
          ...frustrationMatches,
          ...patternMatches.map((p) => 'pattern'),
        ],
        confidence: Math.min(90, 60 + frustrationScore),
      };
    }

    return { detected: false, emotion: null, matchedWords: [], confidence: 0 };
  }

  /**
   * 🔥 NOUVELLE FONCTION: Génération de message amélioré
   */
  private async generateImprovedMessage(
    originalMessage: string,
  ): Promise<string> {
    if (!this.openai) {
      return 'Veuillez reformuler votre message de manière professionnelle.';
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: `Reformule ce message de manière professionnelle et neutre pour un contexte professionnel de gestion de chantier: "${originalMessage}". Réponds uniquement avec le message reformulé, sans explication.`,
          },
        ],
      });

      return (
        response.choices[0].message.content?.trim() ||
        'Veuillez reformuler votre message de manière professionnelle.'
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate improved message: ${error.message}`,
      );
      return 'Veuillez reformuler votre message de manière professionnelle.';
    }
  }

  /**
   * 🔥 AMÉLIORATION: Détection d'émojis de colère et frustration plus précise
   */
  private detectEmojiEmotion(
    content: string,
  ): { emotion: 'angry' | 'frustrated'; confidence: number } | null {
    // Émojis de COLÈRE (émotion forte) - élargi
    const angerEmojis = [
      '😠',
      '🤬',
      '👿',
      '😤',
      '😡',
      '💢',
      '🗯️',
      '🔴',
      '🤯',
      '👺',
      '😾',
      '🙅‍♂️',
      '🙅‍♀️',
    ];

    // Émojis de FRUSTRATION (émotion modérée) - élargi
    const frustrationEmojis = [
      '😩',
      '😫',
      '😒',
      '🙄',
      '😑',
      '🤦',
      '🤦‍♂️',
      '🤦‍♀️',
      '😮‍💨',
      '😤',
      '🤷‍♂️',
      '🤷‍♀️',
    ];

    // Compter les occurrences pour plus de précision
    let angerCount = 0;
    let frustrationCount = 0;

    for (const emoji of angerEmojis) {
      const matches = (content.match(new RegExp(emoji, 'g')) || []).length;
      angerCount += matches;
    }

    for (const emoji of frustrationEmojis) {
      const matches = (content.match(new RegExp(emoji, 'g')) || []).length;
      frustrationCount += matches;
    }

    // Prioriser la colère si détectée
    if (angerCount > 0) {
      return {
        emotion: 'angry',
        confidence: Math.min(98, 85 + angerCount * 5),
      };
    }

    // Ensuite la frustration
    if (frustrationCount > 0) {
      return {
        emotion: 'frustrated',
        confidence: Math.min(95, 80 + frustrationCount * 5),
      };
    }

    return null;
  }

  private buildSystemPrompt(): string {
    return `You are an AI assistant specialized in analyzing and improving professional communication in construction project environments.

Context:
The conversation is between:
- Site Manager (Gestionnaire de chantier)
- Procurement Manager (Gestionnaire d'approvisionnement)
- Supplier (Fournisseur)

The environment is stressful, so moderate frustration is acceptable, but conflict must be detected carefully.

YOUR TASK HAS 3 PARTS:

### 1. ANALYZE THE MESSAGE
Detect:
- sentiment (positive, neutral, negative)
- emotion (calm, stressed, frustrated, angry)
- toxicity level (none, low, medium, high)
- presence of bad words (true/false)
- conflict level (none, low, medium, high)
- escalation risk (low, medium, high)

### 2. CLASSIFY THE MESSAGE
Use these rules:

NORMAL:
- Professional and respectful
- No aggression

WARNING:
- Frustration or stress
- No insults

CONFLICT:
- Aggressive tone
- Blame, disrespect, or insults

IMPORTANT:
- Do NOT classify as CONFLICT unless clearly aggressive
- Consider construction stress context

### 3. IMPROVE THE MESSAGE (IF NEEDED)
If the message is WARNING or CONFLICT:
- Rewrite it to be:
  - professional
  - respectful
  - solution-oriented
- Remove aggression and bad words
- Keep original meaning

If NORMAL:
- Keep original message

### 4. UI DECISION LOGIC
You must decide what the frontend should do:
- If NORMAL:
  → allow_send = true
  → show_suggestion = false
- If WARNING:
  → allow_send = true
  → show_suggestion = true
- If CONFLICT:
  → allow_send = false
  → show_suggestion = true

### 5. UI MESSAGE RULES
Generate a short message for frontend:
- NORMAL: "Communication saine"
- WARNING: "Tension détectée. Voulez-vous envoyer une version améliorée ?"
- CONFLICT: "Conflit détecté. Message bloqué. Veuillez utiliser une version plus professionnelle."

RETURN STRICT JSON FORMAT:
{
  "status": "NORMAL | WARNING | CONFLICT",
  "sentiment": "positive | neutral | negative",
  "emotion": "calm | stressed | frustrated | angry",
  "toxicity": "none | low | medium | high",
  "bad_words": true/false,
  "conflict_level": "none | low | medium | high",
  "escalation_risk": "low | medium | high",
  "allow_send": true/false,
  "show_suggestion": true/false,
  "improved_message": "...",
  "ui_message": "...",
  "confidence": 0-100,
  "explanation": "short explanation"
}`;
  }

  private buildUserPrompt(message: string, senderRole: string): string {
    return `Message to analyze:
Sender Role: ${senderRole}
Message: "${message}"

Analyze this message and return the JSON response.`;
  }

  private getDefaultAnalysis(message: string): MessageAnalysisResult {
    return {
      status: 'NORMAL',
      sentiment: 'neutral',
      emotion: 'calm',
      toxicity: 'none',
      bad_words: false,
      conflict_level: 'none',
      escalation_risk: 'low',
      allow_send: true,
      show_suggestion: false,
      improved_message: message,
      ui_message: 'Communication saine',
      confidence: 50,
      explanation: 'AI analysis unavailable, using default classification',
    };
  }

  /**
   * 🔥 NOUVELLE MÉTHODE: Analyse locale améliorée quand OpenAI n'est pas disponible
   */
  private getEnhancedLocalAnalysis(message: string): MessageAnalysisResult {
    // Utiliser les détections locales
    const wordDetection = this.detectNegativeWords(message);
    const emojiDetection = this.detectEmojiEmotion(message);

    if (wordDetection.detected && wordDetection.emotion === 'angry') {
      return {
        status: 'CONFLICT',
        sentiment: 'negative',
        emotion: 'angry',
        toxicity: 'medium',
        bad_words: true,
        conflict_level: 'medium',
        escalation_risk: 'high',
        allow_send: false,
        show_suggestion: true,
        improved_message:
          'Veuillez reformuler votre message de manière professionnelle.',
        ui_message: 'Message inapproprié détecté. Veuillez reformuler.',
        confidence: wordDetection.confidence,
        explanation: `Analyse locale - Mots inappropriés: ${wordDetection.matchedWords.join(', ')}`,
      };
    }

    if (wordDetection.detected && wordDetection.emotion === 'frustrated') {
      return {
        status: 'WARNING',
        sentiment: 'negative',
        emotion: 'frustrated',
        toxicity: 'low',
        bad_words: false,
        conflict_level: 'low',
        escalation_risk: 'medium',
        allow_send: true,
        show_suggestion: true,
        improved_message:
          'Votre message pourrait être reformulé plus positivement.',
        ui_message: 'Tension détectée. Voulez-vous améliorer votre message ?',
        confidence: wordDetection.confidence,
        explanation: `Analyse locale - Expressions négatives: ${wordDetection.matchedWords.join(', ')}`,
      };
    }

    if (emojiDetection) {
      return {
        status: emojiDetection.emotion === 'angry' ? 'CONFLICT' : 'WARNING',
        sentiment: 'negative',
        emotion: emojiDetection.emotion,
        toxicity: emojiDetection.emotion === 'angry' ? 'medium' : 'low',
        bad_words: false,
        conflict_level: emojiDetection.emotion === 'angry' ? 'medium' : 'low',
        escalation_risk: emojiDetection.emotion === 'angry' ? 'high' : 'medium',
        allow_send: emojiDetection.emotion !== 'angry',
        show_suggestion: true,
        improved_message: message.replace(
          /[😠🤬👿😤😡💢🗯️🔴🤯👺😾🙅‍♂️🙅‍♀️😩😫😒🙄😑🤦🤦‍♂️🤦‍♀️😮‍💨🤷‍♂️🤷‍♀️]/g,
          '',
        ),
        ui_message:
          emojiDetection.emotion === 'angry'
            ? 'Émotion de colère détectée. Veuillez reformuler votre message de manière professionnelle.'
            : 'Frustration détectée. Voulez-vous envoyer une version plus calme ?',
        confidence: emojiDetection.confidence,
        explanation: `Analyse locale - Emoji de ${emojiDetection.emotion === 'angry' ? 'colère' : 'frustration'} détecté`,
      };
    }

    return {
      status: 'NORMAL',
      sentiment: 'neutral',
      emotion: 'calm',
      toxicity: 'none',
      bad_words: false,
      conflict_level: 'none',
      escalation_risk: 'low',
      allow_send: true,
      show_suggestion: false,
      improved_message: message,
      ui_message: 'Communication saine',
      confidence: 75,
      explanation: 'Analyse locale - Aucun problème détecté',
    };
  }

  /**
   * 🔧 MÉTHODE DE TEST: Pour tester la détection d'émotions
   */
  async testEmotionDetection(): Promise<void> {
    const testMessages = [
      'Bonjour, comment allez-vous ?', // Normal
      "C'est vraiment nul ce service !", // Frustration
      'Je suis très déçu de cette livraison', // Frustration
      "Putain, c'est de la merde !", // Colère
      'Tu es vraiment con !', // Colère
      'Ça me saoule vraiment 😤', // Frustration avec emoji
      'Je suis furieux 😠🤬', // Colère avec emoji
      "ARRÊTEZ DE FAIRE N'IMPORTE QUOI !!!", // Colère (majuscules + ponctuation)
    ];

    this.logger.log("🧪 Test de détection d'émotions:");

    for (const message of testMessages) {
      const result = await this.analyzeMessage(message, 'test');
      this.logger.log(
        `📝 "${message}" → ${result.status} (${result.emotion}, ${result.confidence}%)`,
      );
    }
  }
}
