/**
 * Base URL de l'API **gestion-site**.
 * - Via API Gateway : http://localhost:9001/sites  (gateway ajoute /api en interne)
 * - Direct          : http://localhost:3001/api
 */
export const GESTION_SITE_API_URL =
  (import.meta.env.VITE_GESTION_SITE_URL as string | undefined)?.trim() ??
  'http://localhost:9001/sites';
