/**
 * Base URL du microservice **gestion-projects**.
 * - Via API Gateway : http://localhost:9001/projects
 * - Direct          : http://localhost:3010
 */
const raw =
  (import.meta.env.VITE_GESTION_PROJECTS_URL as string | undefined)?.trim() ??
  'http://localhost:9001/projects';

// Strip trailing /api if present (gateway doesn't need it)
export const GESTION_PROJECTS_API_URL = raw.replace(/\/api\/?$/, '');
