import axios from 'axios';

/**
 * URLs de tous les services backend avec leur endpoint chat Gemini
 */
const SERVICES = {
  'user-authentication': {
    url: import.meta.env.VITE_AUTH_API_URL?.trim() || 'http://localhost:3000',
    endpoint: '/ai-chat/message',
    useAuthEndpoint: false, // utilise le nouveau module Groq
    label: 'Assistant Principal',
    keywords: ['user', 'team', 'role', 'permission', 'auth', 'login', 'worker', 'équipe', 'utilisateur'],
  },
  'gestion-site': {
    url: (import.meta.env.VITE_GESTION_SITE_URL?.trim() || 'http://localhost:3001/api').replace('/api', ''),
    endpoint: '/api/chat/message',
    useAuthEndpoint: false,
    label: 'Gestion des Sites',
    keywords: ['site', 'chantier', 'construction', 'localisation', 'budget', 'terrain'],
  },
  'gestion-planing': {
    url: import.meta.env.VITE_PLANNING_URL?.trim() || 'http://localhost:3002',
    endpoint: '/chat/message',
    useAuthEndpoint: false,
    label: 'Planning',
    keywords: ['task', 'tâche', 'milestone', 'planning', 'deadline', 'stage', 'étape', 'projet'],
  },
  'incident-management': {
    url: import.meta.env.VITE_INCIDENT_URL?.trim() || 'http://localhost:3003',
    endpoint: '/chat/message',
    useAuthEndpoint: false,
    label: 'Incidents',
    keywords: ['incident', 'accident', 'safety', 'sécurité', 'danger', 'risque', 'urgence'],
  },
  'notification': {
    url: import.meta.env.VITE_NOTIFICATION_URL?.trim() || 'http://localhost:3004',
    endpoint: '/chat/message',
    useAuthEndpoint: false,
    label: 'Notifications',
    keywords: ['notification', 'alerte', 'alert', 'message', 'email'],
  },
  'gestion-fournisseurs': {
    url: import.meta.env.VITE_FOURNISSEURS_URL?.trim() || 'http://localhost:3005',
    endpoint: '/chat/message',
    useAuthEndpoint: false,
    label: 'Fournisseurs',
    keywords: ['fournisseur', 'supplier', 'article', 'prix', 'price', 'catalog', 'catalogue'],
  },
  'paiement': {
    url: (import.meta.env.VITE_PAYMENT_URL?.trim() || 'http://localhost:3007/api/payments').replace('/api/payments', ''),
    endpoint: '/chat/message',
    useAuthEndpoint: false,
    label: 'Paiements',
    keywords: ['paiement', 'payment', 'facture', 'invoice', 'stripe', 'finance', 'argent'],
  },
  'materials-service': {
    url: import.meta.env.VITE_MATERIALS_URL?.trim() || 'http://localhost:3002',
    endpoint: '/api/chat/message',
    useAuthEndpoint: false,
    label: 'Matériaux',
    keywords: ['material', 'matériau', 'stock', 'inventaire', 'inventory', 'qr', 'équipement'],
  },
  'resource-optimization': {
    url: import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL?.trim() || 'http://localhost:3007',
    endpoint: '/api/chat/message',
    useAuthEndpoint: false,
    label: 'Optimisation',
    keywords: ['resource', 'ressource', 'optimization', 'optimisation', 'performance', 'analyse'],
  },
} as const;

type ServiceKey = keyof typeof SERVICES;

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  service?: string;
}

export interface AiChatResponse {
  success: boolean;
  reply: string;
  service: string;
  serviceLabel: string;
}

/**
 * Détecte le service le plus pertinent selon le message et la page courante
 */
export function detectBestService(message: string, currentPath: string): ServiceKey {
  const msg = message.toLowerCase();
  const path = currentPath.toLowerCase();

  // Détection par chemin de page (priorité haute)
  if (path.includes('incident')) return 'incident-management';
  if (path.includes('planning') || path.includes('milestone') || path.includes('task')) return 'gestion-planing';
  if (path.includes('site')) return 'gestion-site';
  if (path.includes('supplier') || path.includes('fournisseur') || path.includes('catalog')) return 'gestion-fournisseurs';
  if (path.includes('payment') || path.includes('paiement') || path.includes('finance')) return 'paiement';
  if (path.includes('material')) return 'materials-service';
  if (path.includes('resource-optimization')) return 'resource-optimization';
  if (path.includes('notification')) return 'notification';

  // Détection par mots-clés dans le message
  for (const [key, service] of Object.entries(SERVICES)) {
    for (const keyword of service.keywords) {
      if (msg.includes(keyword)) {
        return key as ServiceKey;
      }
    }
  }

  // Par défaut : user-authentication (chatbot principal)
  return 'user-authentication';
}

/**
 * Envoie un message au service détecté automatiquement
 */
export async function sendToDetectedService(
  message: string,
  currentPath: string,
  conversationHistory: AiChatMessage[] = [],
  language: string = 'en',
  conversationId?: string,
): Promise<AiChatResponse> {
  const serviceKey = detectBestService(message, currentPath);
  return sendToService(serviceKey, message, conversationHistory, language, conversationId);
}

/**
 * Envoie un message à un service spécifique
 */
export async function sendToService(
  serviceKey: ServiceKey,
  message: string,
  conversationHistory: AiChatMessage[] = [],
  language: string = 'en',
  conversationId?: string,
): Promise<AiChatResponse> {
  const service = SERVICES[serviceKey];

  try {
    // Service user-authentication : utilise le format chatbot custom existant
    if (service.useAuthEndpoint) {
      const authData = localStorage.getItem('smartsite-auth');
      const token =
        localStorage.getItem('access_token') ||
        (authData
          ? (() => {
              try { return JSON.parse(authData)?.state?.user?.access_token; }
              catch { return null; }
            })()
          : null);

      const res = await axios.post(
        `${service.url}${service.endpoint}`,
        { message, language, conversationId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      const data = res.data;
      const reply = data?.data?.responses?.[0] || data?.data?.reply || data?.message || 'No response';
      return { success: true, reply, service: serviceKey, serviceLabel: service.label };
    }

    // Autres services : format Gemini
    const history = conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await axios.post(
      `${service.url}${service.endpoint}`,
      { message, conversationHistory: history },
      { timeout: 15000 },
    );

    console.log(`[AI Chat] ${serviceKey} raw response:`, JSON.stringify(res.data));

    // Cherche la réponse dans tous les formats possibles
    const reply =
      res.data?.data?.reply ||
      res.data?.reply ||
      res.data?.data?.message ||
      res.data?.message ||
      res.data?.data?.responses?.[0] ||
      res.data?.responses?.[0] ||
      res.data?.data?.text ||
      res.data?.text ||
      (typeof res.data === 'string' ? res.data : null) ||
      'No response';

    return { success: true, reply, service: serviceKey, serviceLabel: service.label };

  } catch (error: any) {
    const errMsg = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error(`[AI Chat] ${serviceKey} error:`, errMsg, error?.response?.status);

    // Fallback vers user-authentication si le service est down
    if (serviceKey !== 'user-authentication') {
      console.warn(`[AI Chat] Falling back to user-authentication`);
      return sendToService('user-authentication', message, conversationHistory, language, conversationId);
    }

    return {
      success: false,
      reply: `Erreur service ${serviceKey}: ${errMsg}`,
      service: serviceKey,
      serviceLabel: service.label,
    };
  }
}

/**
 * Envoie à TOUS les services en parallèle et retourne toutes les réponses
 */
export async function sendToAllServices(
  message: string,
  conversationHistory: AiChatMessage[] = [],
  language: string = 'en',
): Promise<AiChatResponse[]> {
  const serviceKeys = Object.keys(SERVICES) as ServiceKey[];

  const results = await Promise.allSettled(
    serviceKeys.map((key) => sendToService(key, message, conversationHistory, language)),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<AiChatResponse> => r.status === 'fulfilled' && r.value.success)
    .map((r) => r.value);
}

export { SERVICES };
export type { ServiceKey };
